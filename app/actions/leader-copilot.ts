"use server"

import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/auth-server"
import { canAccessLeaderCopilot } from "@/lib/leader-scope"
import { getLeaderCopilotAgentId } from "@/lib/ai/leader-copilot-agent"
import type { PendingAction } from "@/lib/types/leader-copilot"

export type LeaderConversationSummary = {
  id: string
  title: string | null
  last_message_at: string | null
  created_at: string
}

export type LeaderConversationMessage = {
  id: string
  sender: "user" | "assistant" | "system"
  content: string
  created_at: string
  metadata: Record<string, any>
}

export async function getLeaderCopilotConversations(workspaceId: string): Promise<LeaderConversationSummary[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const hasAccess = await canAccessLeaderCopilot(workspaceId, user.id, supabase)
  if (!hasAccess) return []

  const agentId = await getLeaderCopilotAgentId()
  if (!agentId) return []

  const { data: internalUser } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_user_id", user.id)
    .maybeSingle()

  if (!internalUser) return []

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, last_message_at, created_at")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("user_id", internalUser.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (error) {
    console.error("Error fetching leader copilot conversations:", error)
    return []
  }

  return (data ?? []) as LeaderConversationSummary[]
}

export async function getLeaderCopilotMessages(conversationId: string): Promise<LeaderConversationMessage[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("workspace_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (!conversation) return []

  const hasAccess = await canAccessLeaderCopilot(conversation.workspace_id, user.id, supabase)
  if (!hasAccess) return []

  const { data, error } = await supabase
    .from("ai_messages")
    .select("id, sender, content, created_at, metadata")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching leader copilot messages:", error)
    return []
  }

  return (data ?? []) as LeaderConversationMessage[]
}

export async function getPendingActionsForConversation(conversationId: string): Promise<PendingAction[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("workspace_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (!conversation) return []

  const hasAccess = await canAccessLeaderCopilot(conversation.workspace_id, user.id, supabase)
  if (!hasAccess) return []

  const { data: internalUser } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_user_id", user.id)
    .maybeSingle()

  if (!internalUser) return []

  const { data, error } = await supabase
    .from("ai_pending_actions")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("actor_user_id", internalUser.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending actions:", error)
    return []
  }

  return (data ?? []) as PendingAction[]
}
