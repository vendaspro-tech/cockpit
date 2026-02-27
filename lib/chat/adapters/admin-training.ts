import type { AdminTrainingMessage } from "@/app/actions/admin/ai-agents"
import type { ChatMessageVM } from "@/lib/chat/types"

export function mapAdminTrainingMessagesToVM(messages: AdminTrainingMessage[]): ChatMessageVM[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.sender === "user" ? "user" : "assistant",
    content: message.content,
    createdAt: message.created_at,
    metadata: message.metadata ?? undefined,
  }))
}
