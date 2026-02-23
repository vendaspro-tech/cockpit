import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { enqueueKbSource, processPendingKbSources } from "@/lib/ai/kb/ingestion"
import { sha256 } from "@/lib/ai/kb/chunking"
import {
  isAllowedKbFile,
  KB_MAX_SIZE_BYTES,
  resolveKbContentType,
  sanitizeFileName,
} from "@/lib/ai/kb/files"

export const runtime = "nodejs"

const UploadSchema = z.object({
  agentId: z.string().uuid(),
})

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
    if (!isAllowedKbFile(file)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }
    if (file.size > KB_MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo acima de 25MB" }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY ausente no servidor" }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const safeName = sanitizeFileName(file.name)
    const storagePath = `${parsed.data.agentId}/${Date.now()}-${safeName}`

    const supabase = createAdminClient()
    const contentType = resolveKbContentType(file)
    const { error: uploadError } = await supabase.storage
      .from("ai-agent-kb-files")
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (uploadError) {
      console.error("KB upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao subir arquivo" }, { status: 500 })
    }

    const { source, deduplicated } = await enqueueKbSource({
      agentId: parsed.data.agentId,
      title: file.name,
      type: "document",
      filename: file.name,
      mimeType: contentType,
      sizeBytes: file.size,
      storagePath,
      checksum: sha256(buffer),
      metadata: {
        source: "file_upload",
      },
    })

    if (deduplicated) {
      await supabase.storage.from("ai-agent-kb-files").remove([storagePath])
    }

    // Best-effort asynchronous kickoff for this source.
    void processPendingKbSources({ sourceId: source.id, limit: 1 }, openaiKey).catch((error) => {
      console.error("KB async processing kickoff failed:", error)
    })

    return NextResponse.json({
      success: true,
      source: {
        id: source.id,
        title: source.title,
        status: source.status,
        filename: source.filename,
        size_bytes: source.size_bytes,
        created_at: source.created_at,
      },
      deduplicated,
    })
  } catch (error) {
    console.error("KB upload route error:", error)
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 })
  }
}
