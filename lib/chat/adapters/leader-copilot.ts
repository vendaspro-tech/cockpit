import type { LeaderConversationMessage } from "@/app/actions/leader-copilot"
import type { ChatMessageVM } from "@/lib/chat/types"

export function mapLeaderCopilotMessagesToVM(messages: LeaderConversationMessage[]): ChatMessageVM[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.sender === "user" ? "user" : "assistant",
    content: message.content,
    createdAt: message.created_at,
    metadata: message.metadata ?? undefined,
  }))
}
