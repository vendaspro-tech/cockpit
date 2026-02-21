import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { OpenAI } from "openai"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { isSystemOwner } from "@/lib/auth-utils"
import { getSystemSettings } from "@/app/actions/admin/settings"
import { retrieveKbContext } from "@/lib/ai/kb/retrieval"
import { processPendingKbSources } from "@/lib/ai/kb/ingestion"

export const runtime = "nodejs"

const ChatRequestSchema = z.object({
  agentId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(8000),
  rag: z
    .object({
      limit: z.number().min(1).max(20).optional(),
      similarityThreshold: z.number().min(0.1).max(0.95).optional(),
      documentType: z.enum(["transcript", "pdi", "assessment", "document", "image_extracted"]).optional(),
    })
    .optional(),
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

    const owner = await isSystemOwner(authData.user.id)
    if (!owner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { userId } = await ensureSupabaseUser(authData.user.id)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { agentId, conversationId, message, rag } = parsed.data

    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, name, system_prompt, model, temperature")
      .eq("id", agentId)
      .maybeSingle()

    if (agentError) {
      return NextResponse.json({ error: "Erro ao buscar agente" }, { status: 500 })
    }

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    let resolvedConversationId = conversationId

    if (resolvedConversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from("ai_admin_agent_conversations")
        .select("id, agent_id, user_id")
        .eq("id", resolvedConversationId)
        .maybeSingle()

      if (conversationError || !conversation) {
        return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
      }

      if (conversation.agent_id !== agentId || conversation.user_id !== userId) {
        return NextResponse.json({ error: "Conversa inválida" }, { status: 403 })
      }
    } else {
      const title = message.length > 60 ? `${message.slice(0, 60)}...` : message
      const { data: newConversation, error: createError } = await supabase
        .from("ai_admin_agent_conversations")
        .insert({
          agent_id: agentId,
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

    if (!resolvedConversationId) {
      return NextResponse.json({ error: "Erro ao resolver conversa" }, { status: 500 })
    }

    const conversationIdResolved = resolvedConversationId

    const { error: userMessageError } = await supabase
      .from("ai_admin_agent_messages")
      .insert({
        conversation_id: conversationIdResolved,
        sender: "user",
        content: message,
        metadata: {},
      })

    if (userMessageError) {
      return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY ausente no servidor" }, { status: 500 })
    }

    const settings = await getSystemSettings()
    if (settings?.provider && settings.provider !== "openai") {
      return NextResponse.json({ error: "Provedor configurado não suportado nesta versão" }, { status: 400 })
    }

    const model =
      agent.model ||
      (settings?.model && settings.provider === "openai" ? settings.model : "gpt-4o-mini")
    const openai = new OpenAI({ apiKey: openaiKey })

    await processPendingKbSources({ agentId, limit: 1 }, openaiKey).catch((error) => {
      console.error("KB opportunistic processing failed (admin chat):", error)
    })

    let ragResults: Array<{
      id: string
      title: string
      type: string
      similarity: number
      chunkIndex: number
    }> = []
    let contextMarkdown = ""

    try {
      const retrieval = await retrieveKbContext(supabase, openai, {
        query: message,
        agentId,
        limit: rag?.limit ?? 12,
        similarityThreshold: rag?.similarityThreshold ?? 0.68,
        documentType: rag?.documentType,
      })

      ragResults = retrieval.chunks.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        type: chunk.type,
        similarity: chunk.similarity,
        chunkIndex: chunk.chunkIndex,
      }))
      contextMarkdown = retrieval.contextMarkdown
    } catch (error) {
      console.error("Admin training RAG retrieval error:", error)
    }

    const systemPrompt = `${agent.system_prompt || ""}${
      contextMarkdown
        ? `\n\n## CONTEXTO RELEVANTE\n\n${contextMarkdown}\n\nUse este contexto para responder de forma precisa. Se não for relevante, ignore.`
        : ""
    }`

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: typeof agent.temperature === "number" ? agent.temperature : 0.7,
      max_tokens: 1200,
      stream: true,
    })

    const encoder = new TextEncoder()
    let assistantText = ""

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || ""
            if (!delta) continue
            assistantText += delta
            controller.enqueue(encoder.encode(delta))
          }

          const finalText = assistantText.trim() || "Não consegui gerar uma resposta agora. Tente novamente."

          await supabase.from("ai_admin_agent_messages").insert({
            conversation_id: conversationIdResolved,
            sender: "assistant",
            content: finalText,
            metadata: {
              model,
              rag_documents: ragResults.map((doc) => ({
                id: doc.id,
                title: doc.title,
                type: doc.type,
                similarity: doc.similarity,
                chunk_index: doc.chunkIndex,
              })),
            },
          })

          await supabase
            .from("ai_admin_agent_conversations")
            .update({
              last_message_at: new Date().toISOString(),
            })
            .eq("id", conversationIdResolved)
            .eq("user_id", userId)
        } catch (error) {
          console.error("Admin training stream error:", error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Conversation-Id": conversationIdResolved,
      },
    })
  } catch (error) {
    console.error("Admin training chat error:", error)
    return NextResponse.json({ error: "Falha ao gerar resposta" }, { status: 500 })
  }
}
