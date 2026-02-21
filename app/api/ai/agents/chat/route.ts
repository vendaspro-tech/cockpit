import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { OpenAI } from "openai"
import { getSystemSettings } from "@/app/actions/admin/settings"
import { retrieveKbContext } from "@/lib/ai/kb/retrieval"
import { processPendingKbSources } from "@/lib/ai/kb/ingestion"

export const runtime = "nodejs"

const ChatRequestSchema = z.object({
  agentId: z.string().uuid(),
  workspaceId: z.string().uuid(),
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

    const { userId } = await ensureSupabaseUser(authData.user.id)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { agentId, workspaceId, conversationId, message, rag } = parsed.data

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
      const title = message.length > 60 ? `${message.slice(0, 60)}...` : message
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
        content: message,
        metadata: {},
      })

    if (messageError) {
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
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
      }))
      contextMarkdown = retrieval.contextMarkdown
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

    const systemPrompt = `${agent.system_prompt || ""}${
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
        { role: "user", content: message },
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
      ragCount: ragResults.length,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Falha ao gerar resposta" }, { status: 500 })
  }
}
