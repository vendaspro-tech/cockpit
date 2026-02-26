import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { processPendingKbSources } from "@/lib/ai/kb/ingestion"
import { sha256 } from "@/lib/ai/kb/chunking"
import { getOpenRouterApiKey } from "@/lib/ai/openrouter"
import {
  isAllowedKbFile,
  KB_MAX_SIZE_BYTES,
  resolveKbContentType,
  sanitizeFileName,
} from "@/lib/ai/kb/files"

export const runtime = "nodejs"

const UpdateSchema = z.object({
  agentId: z.string().uuid(),
  documentId: z.string().uuid(),
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
    const documentId = formData.get("documentId")
    const file = formData.get("file")
    const parsed = UpdateSchema.safeParse({ agentId, documentId })
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

    let openRouterKey: string
    try {
      openRouterKey = getOpenRouterApiKey()
    } catch {
      return NextResponse.json({ error: "OPENROUTER_API_KEY ausente no servidor" }, { status: 500 })
    }

    const supabase = createAdminClient()
    const { data: existing, error: existingError } = await supabase
      .from("ai_agent_kb_sources")
      .select("id, storage_path")
      .eq("id", parsed.data.documentId)
      .eq("agent_id", parsed.data.agentId)
      .maybeSingle()

    if (existingError || !existing) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const safeName = sanitizeFileName(file.name)
    const storagePath = `${parsed.data.agentId}/${Date.now()}-${safeName}`
    const contentType = resolveKbContentType(file)

    const { error: uploadError } = await supabase.storage
      .from("ai-agent-kb-files")
      .upload(storagePath, buffer, { contentType, upsert: false })
    if (uploadError) {
      console.error("KB replace upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao subir arquivo" }, { status: 500 })
    }

    const { error: deleteOldChunksError } = await supabase
      .from("ai_agent_kb_chunks")
      .delete()
      .eq("source_id", parsed.data.documentId)
    if (deleteOldChunksError) {
      console.error("KB delete old chunks error:", deleteOldChunksError)
    }

    const { data: updated, error: updateSourceError } = await supabase
      .from("ai_agent_kb_sources")
      .update({
        title: file.name,
        type: "document",
        filename: file.name,
        mime_type: contentType,
        size_bytes: file.size,
        storage_path: storagePath,
        inline_content: null,
        checksum_sha256: sha256(buffer),
        status: "pending",
        error_message: null,
        metadata: {
          source: "file_upload",
          reindex_requested_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.documentId)
      .eq("agent_id", parsed.data.agentId)
      .select("*")
      .single()

    if (updateSourceError || !updated) {
      console.error("KB update source error:", updateSourceError)
      return NextResponse.json({ error: "Erro ao atualizar documento" }, { status: 500 })
    }

    if (existing.storage_path) {
      await supabase.storage.from("ai-agent-kb-files").remove([existing.storage_path])
    }

    void processPendingKbSources({ sourceId: updated.id, limit: 1 }, openRouterKey).catch((error) => {
      console.error("KB async reprocess kickoff failed:", error)
    })

    return NextResponse.json({
      success: true,
      source: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("KB update route error:", error)
    return NextResponse.json({ error: "Erro ao substituir arquivo" }, { status: 500 })
  }
}
