import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import pdfParse from "pdf-parse"
import { OpenAI } from "openai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"

export const runtime = "nodejs"

const UpdateSchema = z.object({
  agentId: z.string().uuid(),
  documentId: z.string().uuid(),
})

const MAX_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set(["text/plain", "text/csv", "application/pdf"])

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

async function extractText(file: File, buffer: Buffer) {
  if (file.type === "application/pdf") {
    const parsed = await pdfParse(buffer)
    return parsed.text?.trim() || ""
  }
  return buffer.toString("utf-8").trim()
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createClient()
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const owner = await isSystemOwner(authData.user.id)
    if (!owner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const formData = await request.formData()
    const agentId = formData.get("agentId")
    const documentId = formData.get("documentId")
    const file = formData.get("file")
    const parsed = UpdateSchema.safeParse({ agentId, documentId })
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

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY ausente no servidor" }, { status: 500 })
    }

    const supabase = createAdminClient()
    const { data: existing, error: existingError } = await supabase
      .from("ai_agent_knowledge_base")
      .select("id, storage_path")
      .eq("id", parsed.data.documentId)
      .eq("agent_id", parsed.data.agentId)
      .maybeSingle()

    if (existingError || !existing) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const content = await extractText(file, buffer)
    if (!content) {
      return NextResponse.json({ error: "Não foi possível extrair texto do arquivo" }, { status: 400 })
    }

    const safeName = sanitizeFileName(file.name)
    const storagePath = `${parsed.data.agentId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from("ai-agent-kb-files")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })
    if (uploadError) {
      console.error("KB replace upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao subir arquivo" }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: openaiKey })
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    })
    const embedding = embeddingResponse.data[0]?.embedding

    const { data: updated, error: updateError } = await supabase
      .from("ai_agent_knowledge_base")
      .update({
        title: file.name,
        content,
        type: "document",
        embedding,
        metadata: {
          indexed_at: new Date().toISOString(),
          content_length: content.length,
          source: "file_upload",
        },
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.documentId)
      .eq("agent_id", parsed.data.agentId)
      .select("*")
      .single()

    if (updateError || !updated) {
      console.error("KB update error:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar documento" }, { status: 500 })
    }

    if (existing.storage_path) {
      await supabase.storage.from("ai-agent-kb-files").remove([existing.storage_path])
    }

    return NextResponse.json({ success: true, document: updated })
  } catch (error) {
    console.error("KB update route error:", error)
    return NextResponse.json({ error: "Erro ao substituir arquivo" }, { status: 500 })
  }
}
