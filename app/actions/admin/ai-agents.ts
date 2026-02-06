'use server'

import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { revalidatePath } from "next/cache"
import { OpenAI } from "openai"

const AgentSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional().nullable(),
  systemPrompt: z.string().min(10, "System prompt obrigatório"),
  model: z.string().min(2).default("gpt-4o-mini"),
  temperature: z.number().min(0).max(1).default(0.7),
  status: z.enum(["active", "inactive"]).default("active"),
})

const AgentDocumentSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  content: z.string().min(10, "Conteúdo obrigatório"),
  type: z.enum(["transcript", "pdi", "assessment", "document", "image_extracted"]).default("document"),
  sourceUrl: z.string().url().or(z.literal("")).optional().nullable(),
})

export type AdminAgent = {
  id: string
  name: string
  description: string | null
  system_prompt: string
  model: string
  temperature: number
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export type AdminAgentDocument = {
  id: string
  agent_id: string
  title: string
  content: string
  type: string
  source_url: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

async function requireSystemOwner() {
  const user = await getAuthUser()
  if (!user) return { error: "Não autorizado" }
  const owner = await isSystemOwner(user.id)
  if (!owner) return { error: "Não autorizado" }
  const { userId, error } = await ensureSupabaseUser(user.id)
  if (error || !userId) return { error: "Não autorizado" }
  return { user, userId }
}

export async function getAdminAgents(): Promise<AdminAgent[]> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching agents:", error)
    return []
  }

  return (data ?? []) as AdminAgent[]
}

export async function getAdminAgentById(agentId: string): Promise<AdminAgent | null> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (error) {
    console.error("Error fetching agent:", error)
    return null
  }

  return data as AdminAgent
}

export async function createAgent(input: z.infer<typeof AgentSchema>) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const parsed = AgentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      system_prompt: parsed.data.systemPrompt,
      model: parsed.data.model,
      temperature: parsed.data.temperature,
      status: parsed.data.status,
      created_by: auth.userId,
      updated_by: auth.userId,
    })
    .select("*")
    .single()

  if (error) {
    console.error("Error creating agent:", error)
    return { error: "Erro ao criar agente" }
  }

  revalidatePath("/admin/agents")
  return { success: true, agent: data as AdminAgent }
}

export async function updateAgent(agentId: string, input: z.infer<typeof AgentSchema>) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const parsed = AgentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_agents")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      system_prompt: parsed.data.systemPrompt,
      model: parsed.data.model,
      temperature: parsed.data.temperature,
      status: parsed.data.status,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)

  if (error) {
    console.error("Error updating agent:", error)
    return { error: "Erro ao atualizar agente" }
  }

  revalidatePath("/admin/agents")
  revalidatePath(`/admin/agents/${agentId}`)
  return { success: true }
}

export async function setAgentStatus(agentId: string, status: "active" | "inactive") {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_agents")
    .update({ status, updated_by: auth.userId, updated_at: new Date().toISOString() })
    .eq("id", agentId)

  if (error) {
    console.error("Error updating status:", error)
    return { error: "Erro ao atualizar status" }
  }

  revalidatePath("/admin/agents")
  revalidatePath(`/admin/agents/${agentId}`)
  return { success: true }
}

export async function deleteAgent(agentId: string) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const supabase = createAdminClient()
  const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

  if (error) {
    console.error("Error deleting agent:", error)
    return { error: "Erro ao excluir agente" }
  }

  revalidatePath("/admin/agents")
  return { success: true }
}

export async function getAgentDocuments(agentId: string): Promise<AdminAgentDocument[]> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_agent_knowledge_base")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching agent docs:", error)
    return []
  }

  return (data ?? []) as AdminAgentDocument[]
}

export async function createAgentDocument(agentId: string, input: z.infer<typeof AgentDocumentSchema>) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const parsed = AgentDocumentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return { error: "OPENAI_API_KEY ausente no servidor" }

  const openai = new OpenAI({ apiKey: openaiKey })
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: parsed.data.content,
  })

  const embedding = embeddingResponse.data[0].embedding

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_agent_knowledge_base")
    .insert({
      agent_id: agentId,
      title: parsed.data.title,
      content: parsed.data.content,
      type: parsed.data.type,
      embedding,
      source_url: parsed.data.sourceUrl ? parsed.data.sourceUrl : null,
      metadata: {
        indexed_at: new Date().toISOString(),
        content_length: parsed.data.content.length,
      },
    })

  if (error) {
    console.error("Error creating agent doc:", error)
    return { error: "Erro ao adicionar documento" }
  }

  revalidatePath(`/admin/agents/${agentId}`)
  return { success: true }
}

export async function updateAgentDocument(
  agentId: string,
  documentId: string,
  input: z.infer<typeof AgentDocumentSchema>
) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const parsed = AgentDocumentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return { error: "OPENAI_API_KEY ausente no servidor" }

  const openai = new OpenAI({ apiKey: openaiKey })
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: parsed.data.content,
  })

  const embedding = embeddingResponse.data[0].embedding

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_agent_knowledge_base")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      type: parsed.data.type,
      embedding,
      source_url: parsed.data.sourceUrl ? parsed.data.sourceUrl : null,
      metadata: {
        indexed_at: new Date().toISOString(),
        content_length: parsed.data.content.length,
      },
    })
    .eq("id", documentId)
    .eq("agent_id", agentId)

  if (error) {
    console.error("Error updating agent doc:", error)
    return { error: "Erro ao atualizar documento" }
  }

  revalidatePath(`/admin/agents/${agentId}`)
  return { success: true }
}

export async function deleteAgentDocument(agentId: string, documentId: string) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_agent_knowledge_base")
    .delete()
    .eq("id", documentId)
    .eq("agent_id", agentId)

  if (error) {
    console.error("Error deleting agent doc:", error)
    return { error: "Erro ao excluir documento" }
  }

  revalidatePath(`/admin/agents/${agentId}`)
  return { success: true }
}

export async function getAgentConversationsAdmin(agentId: string) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, last_message_at, created_at, user:users(id, email, full_name)")
    .eq("agent_id", agentId)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (error) {
    console.error("Error fetching conversations:", error)
    return []
  }

  type ConversationUser = { id: string; email: string | null; full_name: string | null }
  type ConversationRow = {
    id: string
    title: string | null
    last_message_at: string | null
    created_at: string
    user: ConversationUser[] | ConversationUser | null
  }

  return (data ?? []).map((row: ConversationRow) => ({
    id: row.id,
    title: row.title,
    last_message_at: row.last_message_at,
    created_at: row.created_at,
    user: Array.isArray(row.user) ? row.user[0] ?? null : row.user ?? null,
  }))
}

export async function getConversationMessagesAdmin(conversationId: string) {
  const auth = await requireSystemOwner()
  if ("error" in auth) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return data ?? []
}
