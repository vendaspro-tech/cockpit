import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { assertLeaderEligible, canAccessLeaderCopilot } from "@/lib/leader-scope"
import { getLeaderCopilotAgentId, runLeaderCopilotTurn } from "@/lib/ai/leader-copilot-agent"
import { transcribeChatAudio } from "@/lib/ai/chat-audio-server"

export const runtime = "nodejs"

const ChatRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  message: z.string().max(8000).default(""),
  messageMetadata: z
    .object({
      audio: z
        .object({
          dataUrl: z.string().startsWith("data:audio/").max(3_000_000),
          mimeType: z.string().min(1).max(100),
          durationMs: z.number().int().min(0).max(120_000),
          transcript: z.string().min(1).max(8000).optional(),
        })
        .optional(),
    })
    .passthrough()
    .optional(),
}).refine((data) => data.message.trim().length > 0 || Boolean(data.messageMetadata?.audio), {
  message: "Mensagem ou áudio é obrigatório",
  path: ["message"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ChatRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { workspaceId, conversationId, message, messageMetadata } = parsed.data
    const typedMessage = message.trim()
    let resolvedUserMessage = typedMessage
    let resolvedUserMetadata = messageMetadata ?? {}

    if (messageMetadata?.audio) {
      try {
        const backendTranscript = await transcribeChatAudio(messageMetadata.audio)
        if (!typedMessage) {
          resolvedUserMessage = backendTranscript
        }
        resolvedUserMetadata = {
          ...resolvedUserMetadata,
          audio: {
            ...messageMetadata.audio,
            transcript: backendTranscript || messageMetadata.audio.transcript,
          },
        }
      } catch (error) {
        console.error("Leader chat audio transcription error:", error)
        return NextResponse.json({ error: "Não foi possível transcrever o áudio" }, { status: 400 })
      }
    }

    if (!resolvedUserMessage) {
      return NextResponse.json({ error: "Não foi possível gerar texto a partir do áudio" }, { status: 400 })
    }

    const hasAccess = await canAccessLeaderCopilot(workspaceId, authData.user.id, supabase)
    if (!hasAccess) {
      return NextResponse.json({ error: "Acesso negado ao Copiloto do Líder" }, { status: 403 })
    }

    const eligibility = await assertLeaderEligible(workspaceId, authData.user.id, supabase)
    if (!eligibility.eligible || !eligibility.internalUserId) {
      return NextResponse.json({ error: "Usuário sem elegibilidade para este recurso" }, { status: 403 })
    }

    const ensuredUser = await ensureSupabaseUser(authData.user.id)
    const internalUserId = ensuredUser.userId ?? eligibility.internalUserId

    if (!internalUserId) {
      return NextResponse.json({ error: "Não foi possível resolver usuário interno" }, { status: 401 })
    }

    const agentId = await getLeaderCopilotAgentId()
    if (!agentId) {
      return NextResponse.json({ error: "Agente de copiloto não configurado" }, { status: 500 })
    }

    let resolvedConversationId: string | null = conversationId ?? null

    if (resolvedConversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from("ai_conversations")
        .select("id, workspace_id, user_id, agent_id")
        .eq("id", resolvedConversationId)
        .maybeSingle()

      if (conversationError || !conversation) {
        return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
      }

      if (
        conversation.workspace_id !== workspaceId ||
        conversation.user_id !== internalUserId ||
        conversation.agent_id !== agentId
      ) {
        return NextResponse.json({ error: "Conversa inválida" }, { status: 403 })
      }
    } else {
      const { data: createdConversation, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          workspace_id: workspaceId,
          user_id: internalUserId,
          agent_id: agentId,
          title: resolvedUserMessage.length > 60 ? `${resolvedUserMessage.slice(0, 60)}...` : resolvedUserMessage,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError || !createdConversation) {
        return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
      }

      resolvedConversationId = createdConversation.id
    }

    if (!resolvedConversationId) {
      return NextResponse.json({ error: "Falha ao resolver conversa" }, { status: 500 })
    }

    const { error: userMessageError } = await supabase.from("ai_messages").insert({
      conversation_id: resolvedConversationId,
      sender: "user",
      content: resolvedUserMessage,
      metadata: resolvedUserMetadata,
    })

    if (userMessageError) {
      return NextResponse.json({ error: "Erro ao registrar mensagem" }, { status: 500 })
    }

    const result = await runLeaderCopilotTurn({
      workspaceId,
      conversationId: resolvedConversationId,
      actorAuthUserId: authData.user.id,
      actorInternalUserId: internalUserId,
      message: resolvedUserMessage,
      client: supabase,
    })

    const assistantMetadata = {
      ...(result.metadata ?? {}),
      type: result.type,
      pendingActionId: result.pendingAction?.id ?? null,
    }

    const { error: assistantMessageError } = await supabase.from("ai_messages").insert({
      conversation_id: resolvedConversationId,
      sender: "assistant",
      content: result.message,
      metadata: assistantMetadata,
    })

    if (assistantMessageError) {
      return NextResponse.json({ error: "Erro ao salvar resposta" }, { status: 500 })
    }

    await supabase
      .from("ai_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", resolvedConversationId)

    if (result.type === "pending_action" && result.pendingAction) {
      return NextResponse.json({
        success: true,
        type: "pending_action",
        conversationId: resolvedConversationId,
        userMessage: resolvedUserMessage,
        userMessageMetadata: resolvedUserMetadata,
        message: result.message,
        pendingAction: result.pendingAction,
      })
    }

    return NextResponse.json({
      success: true,
      type: "answer",
      conversationId: resolvedConversationId,
      userMessage: resolvedUserMessage,
      userMessageMetadata: resolvedUserMetadata,
      message: result.message,
    })
  } catch (error) {
    console.error("Leader copilot chat error:", error)
    return NextResponse.json({ error: "Falha ao processar mensagem" }, { status: 500 })
  }
}
