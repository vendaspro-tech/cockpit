import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { getSystemSettings } from "@/app/actions/admin/settings"
import { retrieveKbContext } from "@/lib/ai/kb/retrieval"
import { processPendingKbSources } from "@/lib/ai/kb/ingestion"
import { createOpenRouterClient, getOpenRouterApiKey, normalizeOpenRouterModel } from "@/lib/ai/openrouter"
import { transcribeChatAudio } from "@/lib/ai/chat-audio-server"

export const runtime = "nodejs"

const ChatRequestSchema = z.object({
  agentId: z.string().uuid(),
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
  rag: z
    .object({
      limit: z.number().min(1).max(20).optional(),
      similarityThreshold: z.number().min(0.1).max(0.95).optional(),
      documentType: z.enum(["transcript", "pdi", "assessment", "document", "image_extracted"]).optional(),
    })
    .optional(),
})
  .refine((data) => data.message.trim().length > 0 || Boolean(data.messageMetadata?.audio), {
    message: "Mensagem ou áudio é obrigatório",
    path: ["message"],
  })

function needsInternalKbGrounding(message: string) {
  return /(no documento|nos documentos|na base|na metodologia|segundo o material|segundo os docs|transcri|aula|playbook|processo de vendas|metodologia|framework|no treinamento)/i.test(
    message
  )
}

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

    const { userId } = await ensureSupabaseUser(authData.user.id)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { agentId, workspaceId, conversationId, message, messageMetadata, rag } = parsed.data
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
        console.error("Chat audio transcription error:", error)
        return NextResponse.json({ error: "Não foi possível transcrever o áudio" }, { status: 400 })
      }
    }

    if (!resolvedUserMessage) {
      return NextResponse.json({ error: "Não foi possível gerar texto a partir do áudio" }, { status: 400 })
    }

    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, name, system_prompt, status, model, temperature")
      .eq("id", agentId)
      .maybeSingle()

    if (agentError) {
      console.error("Agent lookup error:", agentError)
      return NextResponse.json({ error: "Erro ao buscar agente" }, { status: 500 })
    }

    if (!agent) {
      console.error("Agent not found:", { agentId })
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    if (agent.status !== "active") {
      return NextResponse.json({ error: "Agente inativo" }, { status: 403 })
    }

    let resolvedConversationId = conversationId

    if (resolvedConversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from("ai_conversations")
        .select("id, agent_id, user_id, workspace_id")
        .eq("id", resolvedConversationId)
        .maybeSingle()

      if (conversationError || !conversation) {
        return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
      }

      if (
        conversation.agent_id !== agentId ||
        conversation.user_id !== userId ||
        conversation.workspace_id !== workspaceId
      ) {
        return NextResponse.json({ error: "Conversa inválida" }, { status: 403 })
      }
    } else {
      const title = resolvedUserMessage.length > 60 ? `${resolvedUserMessage.slice(0, 60)}...` : resolvedUserMessage
      const { data: newConversation, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          agent_id: agentId,
          workspace_id: workspaceId,
          user_id: userId,
          title,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError || !newConversation) {
        return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
      }

      resolvedConversationId = newConversation.id
    }

    const { error: messageError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: resolvedConversationId,
        sender: "user",
        content: resolvedUserMessage,
        metadata: resolvedUserMetadata,
      })

    if (messageError) {
      return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 })
    }

    let openRouterKey: string
    try {
      openRouterKey = getOpenRouterApiKey()
    } catch (error) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY ausente no servidor" }, { status: 500 })
    }

    const settings = await getSystemSettings()
    if (settings?.provider && settings.provider !== "openrouter") {
      return NextResponse.json({ error: "Provedor configurado não suportado nesta versão" }, { status: 400 })
    }

    const model = normalizeOpenRouterModel(
      agent.model || (settings?.model && settings.provider === "openrouter" ? settings.model : undefined),
      "openai/gpt-4o-mini"
    )
    const openai = createOpenRouterClient()

    await processPendingKbSources({ agentId, limit: 1 }, openRouterKey).catch((error) => {
      console.error("KB opportunistic processing failed:", error)
    })

    let ragResults: Array<{
      id: string
      title: string
      type: string
      similarity: number
      content: string
      chunkIndex: number
    }> = []
    let contextMarkdown = ""
    let usedThreshold = rag?.similarityThreshold ?? 0.55
    let pendingSources = 0
    let failedSources = 0

    const runRetrieval = async () => {
      const retrieval = await retrieveKbContext(supabase, openai, {
        query: resolvedUserMessage,
        agentId,
        limit: rag?.limit ?? 12,
        similarityThreshold: rag?.similarityThreshold ?? 0.55,
        documentType: rag?.documentType,
      })
      usedThreshold = retrieval.usedThreshold
      ragResults = retrieval.chunks.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        type: chunk.type,
        similarity: chunk.similarity,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
      }))
      contextMarkdown = retrieval.contextMarkdown
    }

    try {
      await runRetrieval()

      if (ragResults.length === 0) {
        const [pendingQuery, failedQuery] = await Promise.all([
          supabase
            .from("ai_agent_kb_sources")
            .select("id", { count: "exact", head: true })
            .eq("agent_id", agentId)
            .in("status", ["pending", "processing"]),
          supabase
            .from("ai_agent_kb_sources")
            .select("id", { count: "exact", head: true })
            .eq("agent_id", agentId)
            .eq("status", "failed"),
        ])

        pendingSources = pendingQuery.count || 0
        failedSources = failedQuery.count || 0

        if (pendingSources > 0) {
          await processPendingKbSources({ agentId, limit: 5 }, openRouterKey).catch((error) => {
            console.error("KB follow-up processing failed:", error)
          })
          await runRetrieval()
        }
      }
    } catch (error) {
      console.error("RAG chunk retrieval error:", error)
    }

    const { data: attachments, error: attachmentsError } = await supabase
      .from("ai_conversation_attachments")
      .select("filename, extracted_text")
      .eq("conversation_id", resolvedConversationId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (attachmentsError) {
      console.error("Attachment fetch error:", attachmentsError)
    }

    const attachmentContext = (attachments ?? [])
      .filter((att) => att.extracted_text)
      .map((att) => {
        const text = String(att.extracted_text || "")
        const preview = text.length > 4000 ? `${text.slice(0, 4000)}...` : text
        return `**[ANEXO] ${att.filename}**\n${preview}`
      })
      .join("\n\n---\n\n")

    const { data: recentMessages, error: historyError } = await supabase
      .from("ai_messages")
      .select("sender, content")
      .eq("conversation_id", resolvedConversationId)
      .order("created_at", { ascending: false })
      .limit(12)

    if (historyError) {
      console.error("Conversation history fetch error:", historyError)
    }

    const conversationHistory = (recentMessages ?? [])
      .slice()
      .reverse()
      .filter((msg) => (msg.sender === "user" || msg.sender === "assistant") && typeof msg.content === "string")
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      })) as Array<{ role: "user" | "assistant"; content: string }>

    const requiresKbGrounding = needsInternalKbGrounding(resolvedUserMessage)
    const ragGuardrail = ragResults.length
      ? `\n\n## REGRAS DE RESPOSTA COM BASE\n- Use prioritariamente os trechos em CONTEXTO RELEVANTE para responder.\n- Não contradiga os trechos recuperados.\n- Quando possível, cite explicitamente o nome da fonte e o trecho.\n- Se faltar detalhe no contexto, diga o que faltou antes de assumir.`
      : requiresKbGrounding
        ? `\n\n## REGRAS DE RESPOSTA SEM BASE RECUPERADA\n- Nesta mensagem, nenhum trecho da base indexada foi recuperado.\n- Não invente conteúdo da metodologia/documentos.\n- Informe claramente que não encontrou base suficiente nos documentos indexados para responder com segurança.\n- Sugira reindexar documentos, processar pendentes ou refinar a pergunta.\n- Contexto operacional: pendentes=${pendingSources}, falhas=${failedSources}, threshold=${usedThreshold.toFixed(2)}.`
        : `\n\n## REGRAS DE RESPOSTA GERAL\n- Para perguntas gerais/conversacionais, responda normalmente.\n- Só sinalize ausência de base quando a pergunta depender de documentos internos.`

    const systemPrompt = `${agent.system_prompt || ""}${ragGuardrail}${
      contextMarkdown
        ? `\n\n## CONTEXTO RELEVANTE\n\n${contextMarkdown}\n\nUse este contexto para responder de forma mais precisa. Se não for relevante, ignore.`
        : ""
    }${
      attachmentContext
        ? `\n\n## ANEXOS DA CONVERSA\n\n${attachmentContext}\n\nUse apenas se for útil para a resposta.`
        : ""
    }`

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      temperature: typeof agent.temperature === "number" ? agent.temperature : 0.7,
      max_tokens: 1200,
    })

    const assistantText =
      completion.choices[0]?.message?.content?.trim() ||
      "Não consegui gerar uma resposta agora. Tente novamente."

    const { error: assistantError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: resolvedConversationId,
        sender: "assistant",
        content: assistantText,
        metadata: {
          model,
          usage: completion.usage ?? null,
          rag_documents: ragResults.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            similarity: doc.similarity,
            chunk_index: doc.chunkIndex,
          })),
          rag_status: {
            chunks: ragResults.length,
            pending_sources: pendingSources,
            failed_sources: failedSources,
            threshold_used: usedThreshold,
            requires_grounding: requiresKbGrounding,
          },
        },
      })

    if (assistantError) {
      return NextResponse.json({ error: "Erro ao salvar resposta" }, { status: 500 })
    }

    await supabase
      .from("ai_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", resolvedConversationId)

    return NextResponse.json({
      success: true,
      conversationId: resolvedConversationId,
      message: assistantText,
      userMessage: resolvedUserMessage,
      userMessageMetadata: resolvedUserMetadata,
      ragCount: ragResults.length,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Falha ao gerar resposta" }, { status: 500 })
  }
}
