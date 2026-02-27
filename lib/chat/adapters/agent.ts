import type { ConversationMessage } from "@/app/actions/ai-agents"
import type { ChatMessageVM } from "@/lib/chat/types"

export function mapAgentMessagesToVM(messages: ConversationMessage[]): ChatMessageVM[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.sender === "user" ? "user" : "assistant",
    content: message.content,
    createdAt: message.created_at,
    metadata: message.metadata ?? undefined,
  }))
}
