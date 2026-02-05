"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

export type AgentCard = {
  id: string
  name: string
  description: string | null
  status: "active" | "inactive"
}

export type ConversationSummary = {
  id: string
  title: string | null
  last_message_at: string | null
  created_at: string
}

export type ConversationMessage = {
  id: string
  sender: "user" | "assistant" | "system"
  content: string
  created_at: string
  metadata: Record<string, any>
}

export type ConversationAttachment = {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

const DeleteConversationSchema = z.object({
  conversationId: z.string().uuid(),
})

export async function getActiveAgents(): Promise<AgentCard[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_agents")
    .select("id, name, description, status")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching agents:", error)
    return []
  }

  return (data ?? []) as AgentCard[]
}

export async function getAgent(agentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_agents")
    .select("id, name, description, system_prompt, status")
    .eq("id", agentId)
    .single()

  if (error) {
    console.error("Error fetching agent:", error)
    return null
  }

  return data
}

export async function getUserConversations(agentId: string, workspaceId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, last_message_at, created_at")
    .eq("agent_id", agentId)
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (error) {
    console.error("Error fetching conversations:", error)
    return []
  }

  return (data ?? []) as ConversationSummary[]
}

export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_messages")
    .select("id, sender, content, created_at, metadata")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return (data ?? []) as ConversationMessage[]
}

export async function getConversationAttachments(conversationId: string): Promise<ConversationAttachment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_conversation_attachments")
    .select("id, filename, mime_type, size_bytes, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching attachments:", error)
    return []
  }

  return (data ?? []) as ConversationAttachment[]
}

export async function deleteConversation(input: z.infer<typeof DeleteConversationSchema>) {
  const parsed = DeleteConversationSchema.safeParse(input)
  if (!parsed.success) return { error: "Conversa inválida" }

  const user = await getAuthUser()
  if (!user) return { error: "Não autorizado" }

  await ensureSupabaseUser(user.id)
  const supabase = await createClient()
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", parsed.data.conversationId)

  if (error) {
    console.error("Error deleting conversation:", error)
    return { error: "Erro ao excluir conversa" }
  }

  revalidatePath(`/`)
  return { success: true }
}
