import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import pdfParse from "pdf-parse"
import { OpenAI } from "openai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"

export const runtime = "nodejs"

const UploadSchema = z.object({
  agentId: z.string().uuid(),
})

const MAX_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
  "application/pdf",
  "application/octet-stream",
])
const ALLOWED_EXTENSIONS = new Set(["pdf", "txt", "csv"])

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function getExtension(name: string) {
  const value = name.toLowerCase().split(".").pop()
  return value || ""
}

function isAllowedFile(file: File) {
  const ext = getExtension(file.name)
  if (!ALLOWED_EXTENSIONS.has(ext)) return false
  return file.type === "" || ALLOWED_MIME_TYPES.has(file.type)
}

function resolveContentType(file: File) {
  const ext = getExtension(file.name)
  if (ext === "pdf") return "application/pdf"
  if (ext === "csv") return "text/csv"
  return "text/plain"
}

async function extractText(file: File, buffer: Buffer) {
  if (file.type === "application/pdf" || getExtension(file.name) === "pdf") {
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
    const file = formData.get("file")

    const parsed = UploadSchema.safeParse({ agentId })
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 })
    }
    if (!isAllowedFile(file)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo acima de 25MB" }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY ausente no servidor" }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const content = await extractText(file, buffer)
    if (!content) {
      return NextResponse.json({ error: "Não foi possível extrair texto do arquivo" }, { status: 400 })
    }

    const safeName = sanitizeFileName(file.name)
    const storagePath = `${parsed.data.agentId}/${Date.now()}-${safeName}`

    const supabase = createAdminClient()
    const contentType = resolveContentType(file)
    const { error: uploadError } = await supabase.storage
      .from("ai-agent-kb-files")
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (uploadError) {
      console.error("KB upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao subir arquivo" }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: openaiKey })
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    })
    const embedding = embeddingResponse.data[0]?.embedding

    const { data: document, error: insertError } = await supabase
      .from("ai_agent_knowledge_base")
      .insert({
        agent_id: parsed.data.agentId,
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
        mime_type: contentType,
        size_bytes: file.size,
        storage_path: storagePath,
      })
      .select("*")
      .single()

    if (insertError || !document) {
      console.error("KB insert error:", insertError)
      return NextResponse.json({ error: "Erro ao salvar documento" }, { status: 500 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error("KB upload route error:", error)
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 })
  }
}
