import crypto from "crypto"

import { KB_CHUNK_MAX_TOKENS, KB_CHUNK_OVERLAP_TOKENS } from "@/lib/ai/kb/constants"

export type TextChunk = {
  chunkIndex: number
  content: string
  tokensEst: number
}

export function normalizeKbText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / 4))
}

export function sha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex")
}

export function splitTextIntoChunks(
  text: string,
  maxTokens = KB_CHUNK_MAX_TOKENS,
  overlapTokens = KB_CHUNK_OVERLAP_TOKENS
): TextChunk[] {
  const normalized = normalizeKbText(text)
  if (!normalized) return []

  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const approxTokensPerWord = 1.3
  const maxWords = Math.max(50, Math.floor(maxTokens / approxTokensPerWord))
  const overlapWords = Math.max(10, Math.floor(overlapTokens / approxTokensPerWord))
  const stride = Math.max(1, maxWords - overlapWords)

  const chunks: TextChunk[] = []
  let start = 0
  let index = 0

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length)
    const content = words.slice(start, end).join(" ").trim()
    if (content.length > 0) {
      chunks.push({
        chunkIndex: index,
        content,
        tokensEst: estimateTokens(content),
      })
      index += 1
    }
    if (end >= words.length) break
    start += stride
  }

  return chunks
}
