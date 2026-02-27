export type ChatRole = "user" | "assistant"

export type ChatMessageVM = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export type ChatSessionStatus = "idle" | "sending" | "streaming" | "error"

export type LegacyChatMessage = {
  id: string
  sender: string
  content: string
  created_at: string
  metadata?: Record<string, unknown> | null
}
