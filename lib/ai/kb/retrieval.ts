import { OpenAI } from "openai"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  KB_CONTEXT_TOKEN_BUDGET,
  KB_DEFAULT_RETRIEVAL_LIMIT,
  KB_DEFAULT_RETRIEVAL_THRESHOLD,
  KB_MAX_CHUNKS_PER_SOURCE,
} from "@/lib/ai/kb/constants"
import { estimateTokens } from "@/lib/ai/kb/chunking"

type KbDocType = "transcript" | "pdi" | "assessment" | "document" | "image_extracted"

type RetrieveOptions = {
  query: string
  agentId: string
  limit?: number
  similarityThreshold?: number
  documentType?: KbDocType
  thresholdFallbacks?: number[]
}

type SearchChunk = {
  chunk_id: string
  source_id: string
  title: string
  content: string
  type: KbDocType
  chunk_index: number
  content_tokens_est: number
  similarity: number
  metadata: Record<string, any> | null
  source_metadata: Record<string, any> | null
}

export type RetrievedChunk = {
  id: string
  sourceId: string
  title: string
  type: string
  content: string
  chunkIndex: number
  similarity: number
  tokens: number
}

export type RetrievalResult = {
  chunks: RetrievedChunk[]
  contextMarkdown: string
  usedThreshold: number
}

function buildContextMarkdown(chunks: RetrievedChunk[]) {
  return chunks
    .map((chunk) => {
      const percent = (chunk.similarity * 100).toFixed(0)
      return `**[${chunk.type.toUpperCase()}] ${chunk.title}** (Relevância: ${percent}% | Trecho #${chunk.chunkIndex})\n${chunk.content}\n[Fonte: ${chunk.title} | chunk ${chunk.chunkIndex}]`
    })
    .join("\n\n---\n\n")
}

function applySourceDiversity(chunks: SearchChunk[]) {
  const sourceCount = new Map<string, number>()
  const selected: SearchChunk[] = []
  for (const chunk of chunks) {
    const count = sourceCount.get(chunk.source_id) || 0
    if (count >= KB_MAX_CHUNKS_PER_SOURCE) continue
    sourceCount.set(chunk.source_id, count + 1)
    selected.push(chunk)
  }
  return selected
}

function applyTokenBudget(chunks: SearchChunk[]) {
  const selected: SearchChunk[] = []
  let used = 0
  for (const chunk of chunks) {
    const tokens = chunk.content_tokens_est || estimateTokens(chunk.content)
    if (used + tokens > KB_CONTEXT_TOKEN_BUDGET) continue
    selected.push(chunk)
    used += tokens
  }
  return selected
}

export async function retrieveKbContext(
  supabase: SupabaseClient,
  openai: OpenAI,
  options: RetrieveOptions
): Promise<RetrievalResult> {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: options.query,
  })

  const queryEmbedding = embeddingResponse.data[0].embedding

  const thresholds = [
    options.similarityThreshold ?? KB_DEFAULT_RETRIEVAL_THRESHOLD,
    ...(options.thresholdFallbacks ?? [0.45, 0.35]),
  ]

  let ranked: SearchChunk[] = []
  let usedThreshold = thresholds[0]
  let lastError: string | null = null

  for (const threshold of thresholds) {
    const { data: chunkRows, error } = await supabase.rpc("search_ai_agent_kb_chunks", {
      query_embedding: queryEmbedding,
      agent_id: options.agentId,
      similarity_threshold: threshold,
      match_count: Math.max((options.limit ?? KB_DEFAULT_RETRIEVAL_LIMIT) * 4, 24),
      doc_type: options.documentType ?? null,
    })

    if (error) {
      lastError = error.message
      continue
    }

    ranked = (chunkRows ?? []) as SearchChunk[]
    usedThreshold = threshold
    if (ranked.length > 0) break
  }

  if (lastError && ranked.length === 0) {
    throw new Error(`Falha na busca de chunks: ${lastError}`)
  }

  const withDiversity = applySourceDiversity(ranked)
  const withBudget = applyTokenBudget(withDiversity)
  const finalRows = withBudget.slice(0, options.limit ?? KB_DEFAULT_RETRIEVAL_LIMIT)

  const chunks: RetrievedChunk[] = finalRows.map((row) => ({
    id: row.chunk_id,
    sourceId: row.source_id,
    title: row.title,
    type: row.type,
    content: row.content,
    chunkIndex: row.chunk_index,
    similarity: row.similarity,
    tokens: row.content_tokens_est || estimateTokens(row.content),
  }))

  return {
    chunks,
    contextMarkdown: buildContextMarkdown(chunks),
    usedThreshold,
  }
}
