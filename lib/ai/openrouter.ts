import OpenAI from "openai"

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"

const LEGACY_MODEL_MAP: Record<string, string> = {
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "gpt-4o": "openai/gpt-4o",
  "text-embedding-3-small": "openai/text-embedding-3-small",
  "whisper-1": "openai/whisper-1",
}

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ausente no servidor")
  }
  return apiKey
}

export function normalizeOpenRouterModel(model?: string | null, fallback = "openai/gpt-4o-mini") {
  if (!model) return fallback
  return LEGACY_MODEL_MAP[model] || model
}

export function getOpenRouterEmbeddingModel() {
  return normalizeOpenRouterModel(
    process.env.OPENROUTER_EMBEDDING_MODEL,
    "openai/text-embedding-3-small"
  )
}

export function getOpenRouterTranscriptionModel() {
  return normalizeOpenRouterModel(process.env.OPENROUTER_TRANSCRIPTION_MODEL, "openai/whisper-1")
}

export function createOpenRouterClient() {
  const headers: Record<string, string> = {}

  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME
  }

  return new OpenAI({
    apiKey: getOpenRouterApiKey(),
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: Object.keys(headers).length ? headers : undefined,
  })
}
