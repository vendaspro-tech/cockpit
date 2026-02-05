import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { z } from "zod"
import pdfParse from "pdf-parse"

export const runtime = "nodejs"

const UploadSchema = z.object({
  agentId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
})

const MAX_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/pdf",
])

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const agentId = formData.get("agentId")
    const workspaceId = formData.get("workspaceId")
    const conversationId = formData.get("conversationId")

    const parsed = UploadSchema.safeParse({
      agentId,
      workspaceId,
      conversationId: conversationId || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo acima de 25MB" }, { status: 400 })
    }

    const { userId } = await ensureSupabaseUser(authData.user.id)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let resolvedConversationId = parsed.data.conversationId

    if (!resolvedConversationId) {
      const { data: newConversation, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          agent_id: parsed.data.agentId,
          workspace_id: parsed.data.workspaceId,
          user_id: userId,
          title: "Anexos",
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError || !newConversation) {
        return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
      }

      resolvedConversationId = newConversation.id
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText: string | null = null

    if (file.type === "application/pdf") {
      const parsedPdf = await pdfParse(buffer)
      extractedText = parsedPdf.text?.trim() || null
    } else {
      extractedText = buffer.toString("utf-8").trim()
    }

    const safeName = sanitizeFileName(file.name)
    const storagePath = `${resolvedConversationId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from("ai-chat-attachments")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao subir arquivo" }, { status: 500 })
    }

    const { data: attachment, error: insertError } = await supabase
      .from("ai_conversation_attachments")
      .insert({
        conversation_id: resolvedConversationId,
        user_id: userId,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: storagePath,
        extracted_text: extractedText,
      })
      .select("id, filename, mime_type, size_bytes, created_at")
      .single()

    if (insertError || !attachment) {
      return NextResponse.json({ error: "Erro ao salvar anexo" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      conversationId: resolvedConversationId,
      attachment,
    })
  } catch (error) {
    console.error("Attachment upload error:", error)
    return NextResponse.json({ error: "Erro ao processar anexo" }, { status: 500 })
  }
}
