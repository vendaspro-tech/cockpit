import pdfParse from "pdf-parse"
import { OpenAI } from "openai"
import { createOpenRouterClient, getOpenRouterEmbeddingModel } from "@/lib/ai/openrouter"

import { KB_PROCESS_BATCH_SIZE } from "@/lib/ai/kb/constants"
import { normalizeKbText, sha256, splitTextIntoChunks } from "@/lib/ai/kb/chunking"
import { createAdminClient } from "@/lib/supabase/admin"

type KbSourceStatus = "pending" | "processing" | "ready" | "failed"
type KbDocType = "transcript" | "pdi" | "assessment" | "document" | "image_extracted"

export type KbSourceRow = {
  id: string
  agent_id: string
  title: string
  type: KbDocType
  filename: string | null
  mime_type: string | null
  size_bytes: number | null
  storage_path: string | null
  inline_content: string | null
  checksum_sha256: string
  status: KbSourceStatus
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

type ProcessPendingOptions = {
  agentId?: string
  sourceId?: string
  limit?: number
}

type ProcessResult = {
  processed: number
  succeeded: number
  failed: number
  sourceIds: string[]
}

function isPdf(mimeType: string | null, filename: string | null) {
  if (mimeType === "application/pdf") return true
  const ext = filename?.toLowerCase().split(".").pop()
  return ext === "pdf"
}

async function extractTextFromBuffer(params: {
  buffer: Buffer
  mimeType: string | null
  filename: string | null
}): Promise<string> {
  if (isPdf(params.mimeType, params.filename)) {
    const parsed = await pdfParse(params.buffer)
    return normalizeKbText(parsed.text || "")
  }
  return normalizeKbText(params.buffer.toString("utf-8"))
}

function sanitizeError(error: unknown) {
  const raw = error instanceof Error ? error.message : "Erro desconhecido"
  return raw.length > 500 ? `${raw.slice(0, 500)}...` : raw
}

async function getSourceContentBuffer(source: KbSourceRow): Promise<Buffer> {
  if (source.inline_content) {
    return Buffer.from(source.inline_content, "utf-8")
  }
  if (!source.storage_path) {
    throw new Error("Fonte sem conteúdo inline nem storage_path")
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from("ai-agent-kb-files").download(source.storage_path)
  if (error || !data) {
    throw new Error(`Falha ao baixar arquivo da KB: ${error?.message || "arquivo indisponível"}`)
  }
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function embedChunks(openai: OpenAI, chunks: string[]) {
  const response = await openai.embeddings.create({
    model: getOpenRouterEmbeddingModel(),
    input: chunks,
  })
  return response.data.map((item) => item.embedding)
}

export async function enqueueKbSource(params: {
  agentId: string
  title: string
  type?: KbDocType
  filename?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  storagePath?: string | null
  inlineContent?: string | null
  metadata?: Record<string, any>
  checksum?: string
}): Promise<{ source: KbSourceRow; deduplicated: boolean }> {
  const supabase = createAdminClient()

  const checksum =
    params.checksum ||
    sha256(
      params.inlineContent
        ? Buffer.from(params.inlineContent, "utf-8")
        : `${params.storagePath || ""}:${params.filename || ""}:${params.sizeBytes || 0}`
    )

  const { data: existing } = await supabase
    .from("ai_agent_kb_sources")
    .select("*")
    .eq("agent_id", params.agentId)
    .eq("checksum_sha256", checksum)
    .maybeSingle()

  if (existing) {
    return { source: existing as KbSourceRow, deduplicated: true }
  }

  const { data, error } = await supabase
    .from("ai_agent_kb_sources")
    .insert({
      agent_id: params.agentId,
      title: params.title,
      type: params.type || "document",
      filename: params.filename ?? null,
      mime_type: params.mimeType ?? null,
      size_bytes: params.sizeBytes ?? null,
      storage_path: params.storagePath ?? null,
      inline_content: params.inlineContent ?? null,
      checksum_sha256: checksum,
      status: "pending",
      error_message: null,
      metadata: {
        ...(params.metadata || {}),
        enqueued_at: new Date().toISOString(),
      },
    })
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(`Erro ao enfileirar fonte da KB: ${error?.message || "insert falhou"}`)
  }

  return { source: data as KbSourceRow, deduplicated: false }
}

export async function processKbSource(sourceId: string, _openRouterApiKey: string): Promise<{ chunks: number }> {
  const supabase = createAdminClient()
  const openai = createOpenRouterClient()

  const { data: source, error: sourceError } = await supabase
    .from("ai_agent_kb_sources")
    .select("*")
    .eq("id", sourceId)
    .maybeSingle()

  if (sourceError || !source) {
    throw new Error("Fonte de KB não encontrada")
  }

  await supabase
    .from("ai_agent_kb_sources")
    .update({
      status: "processing",
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId)

  try {
    const buffer = await getSourceContentBuffer(source as KbSourceRow)
    const extracted = source.inline_content
      ? normalizeKbText(source.inline_content)
      : await extractTextFromBuffer({
          buffer,
          mimeType: source.mime_type,
          filename: source.filename,
        })

    if (!extracted) {
      throw new Error("Não foi possível extrair texto da fonte")
    }

    const chunks = splitTextIntoChunks(extracted)
    if (chunks.length === 0) {
      throw new Error("Não foi possível dividir o documento em chunks")
    }

    const chunkContents = chunks.map((chunk) => chunk.content)
    const embeddings: number[][] = []
    for (let index = 0; index < chunkContents.length; index += KB_PROCESS_BATCH_SIZE) {
      const batch = chunkContents.slice(index, index + KB_PROCESS_BATCH_SIZE)
      const batchEmbeddings = await embedChunks(openai, batch)
      embeddings.push(...batchEmbeddings)
    }

    await supabase.from("ai_agent_kb_chunks").delete().eq("source_id", sourceId)

    const rows = chunks.map((chunk, index) => ({
      source_id: sourceId,
      agent_id: source.agent_id,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      content_tokens_est: chunk.tokensEst,
      embedding: embeddings[index],
      metadata: {
        chunk_index: chunk.chunkIndex,
      },
    }))

    const { error: insertError } = await supabase.from("ai_agent_kb_chunks").insert(rows)
    if (insertError) {
      throw new Error(insertError.message)
    }

    await supabase
      .from("ai_agent_kb_sources")
      .update({
        status: "ready",
        error_message: null,
        metadata: {
          ...(source.metadata || {}),
          indexed_at: new Date().toISOString(),
          chunk_count: rows.length,
          content_length: extracted.length,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId)

    return { chunks: rows.length }
  } catch (error) {
    await supabase
      .from("ai_agent_kb_sources")
      .update({
        status: "failed",
        error_message: sanitizeError(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId)
    throw error
  }
}

export async function processPendingKbSources(
  options: ProcessPendingOptions,
  openaiApiKey: string
): Promise<ProcessResult> {
  const supabase = createAdminClient()
  const limit = Math.min(Math.max(options.limit ?? KB_PROCESS_BATCH_SIZE, 1), 20)
  let query = supabase
    .from("ai_agent_kb_sources")
    .select("*")
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit)

  if (options.agentId) {
    query = query.eq("agent_id", options.agentId)
  }
  if (options.sourceId) {
    query = query.eq("id", options.sourceId)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Falha ao buscar pendências da KB: ${error.message}`)
  }

  const sources = (data ?? []) as KbSourceRow[]
  let succeeded = 0
  let failed = 0

  for (const source of sources) {
    try {
      await processKbSource(source.id, openaiApiKey)
      succeeded += 1
    } catch (error) {
      console.error("KB processing error:", { sourceId: source.id, error })
      failed += 1
    }
  }

  return {
    processed: sources.length,
    succeeded,
    failed,
    sourceIds: sources.map((source) => source.id),
  }
}
