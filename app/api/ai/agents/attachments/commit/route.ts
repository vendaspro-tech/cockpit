import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { z } from "zod"
import pdfParse from "pdf-parse"

export const runtime = "nodejs"

const CommitSchema = z.object({
  conversationId: z.string().uuid(),
  storagePath: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

const ALLOWED_TYPES = new Set(["text/plain", "text/csv", "application/pdf"])
const BUCKET = "ai-chat-attachments"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CommitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(parsed.data.mimeType)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }

    const { userId } = await ensureSupabaseUser(authData.user.id)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: conversation, error: convoError } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", parsed.data.conversationId)
      .eq("user_id", userId)
      .single()

    if (convoError || !conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(parsed.data.storagePath)

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError)
      return NextResponse.json({ error: "Erro ao baixar arquivo" }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    let extractedText: string | null = null

    if (parsed.data.mimeType === "application/pdf") {
      const parsedPdf = await pdfParse(buffer)
      extractedText = parsedPdf.text?.trim() || null
    } else {
      extractedText = buffer.toString("utf-8").trim()
    }

    const { data: attachment, error: insertError } = await supabase
      .from("ai_conversation_attachments")
      .insert({
        conversation_id: parsed.data.conversationId,
        user_id: userId,
        filename: parsed.data.filename,
        mime_type: parsed.data.mimeType,
        size_bytes: parsed.data.sizeBytes,
        storage_path: parsed.data.storagePath,
        extracted_text: extractedText,
      })
      .select("id, filename, mime_type, size_bytes, created_at")
      .single()

    if (insertError || !attachment) {
      return NextResponse.json({ error: "Erro ao salvar anexo" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      attachment,
    })
  } catch (error) {
    console.error("Attachment commit error:", error)
    return NextResponse.json({ error: "Erro ao processar anexo" }, { status: 500 })
  }
}
