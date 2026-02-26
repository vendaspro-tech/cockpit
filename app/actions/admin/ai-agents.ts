'use server'

import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { revalidatePath } from "next/cache"
import { enqueueKbSource, processPendingKbSources } from "@/lib/ai/kb/ingestion"
import { sha256 } from "@/lib/ai/kb/chunking"
import { getOpenRouterApiKey } from "@/lib/ai/openrouter"

const AgentDocumentTypeSchema = z.enum(["transcript", "pdi", "assessment", "document", "image_extracted"])

const AgentSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional().nullable(),
  systemPrompt: z.string().min(10, "System prompt obrigatório"),
  model: z.string().min(2).default("gpt-4o-mini"),
  temperature: z.number().min(0).max(1).default(0.7),
  productTags: z.array(z.string()).default([]),
  categoryTags: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive"]).default("active"),
})

const AgentDocumentSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  content: z.string().min(10, "Conteúdo obrigatório"),
  type: AgentDocumentTypeSchema.default("document"),
  sourceUrl: z.string().url().or(z.literal("")).optional().nullable(),
})

export type AgentDocumentType = z.infer<typeof AgentDocumentTypeSchema>
export type AgentDocumentInput = z.infer<typeof AgentDocumentSchema>
export type ActionError = { error: string }
export type AgentCreateSuccess = { success: true; agent: AdminAgent }
export type SimpleSuccess = { success: true }
export type AgentCreateResult = ActionError | AgentCreateSuccess
export type AgentActionResult = ActionError | SimpleSuccess

export type AdminAgent = {
  id: string
  name: string
  description: string | null
  system_prompt: string
  model: string
  temperature: number
  product_tags: string[]
  category_tags: string[]
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export type AdminAgentDocument = {
  id: string
  agent_id: string
  title: string
  content: string | null
  type: string
  source_url: string | null
  filename: string | null
  mime_type: string | null
  size_bytes: number | null
  storage_path: string | null
  status: "pending" | "processing" | "ready" | "failed"
  error_message: string | null
  chunk_count: number
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

function normalizeTags(tags: string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const rawTag of tags) {
    const tag = rawTag.trim().replace(/\s+/g, " ")
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(tag)
  }
  return normalized
}

async function requireSystemOwner(): Promise<ActionError | { userId: string }> {
  const user = await getAuthUser()
  if (!user) return { error: "Não autorizado" }
  const owner = await isSystemOwner(user.id)
  if (!owner) return { error: "Não autorizado" }
  const { userId, error } = await ensureSupabaseUser(user.id)
  if (error || !userId) return { error: "Não autorizado" }
  return { userId }
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

export async function createAgent(input: z.infer<typeof AgentSchema>): Promise<AgentCreateResult> {
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
      product_tags: normalizeTags(parsed.data.productTags),
      category_tags: normalizeTags(parsed.data.categoryTags),
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

export async function updateAgent(agentId: string, input: z.infer<typeof AgentSchema>): Promise<AgentActionResult> {
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
      product_tags: normalizeTags(parsed.data.productTags),
      category_tags: normalizeTags(parsed.data.categoryTags),
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

export async function setAgentStatus(
  agentId: string,
  status: "active" | "inactive"
): Promise<AgentActionResult> {
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

export async function deleteAgent(agentId: string): Promise<AgentActionResult> {
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
  const { data: sources, error } = await supabase
    .from("ai_agent_kb_sources")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching agent docs:", error)
    return []
  }

  const sourceRows = (sources ?? []) as any[]
  const sourceIds = sourceRows.map((source) => source.id)

  let chunkCountMap = new Map<string, number>()
  if (sourceIds.length > 0) {
    const { data: chunkRows } = await supabase
      .from("ai_agent_kb_chunks")
      .select("source_id")
      .in("source_id", sourceIds)
    chunkCountMap = (chunkRows ?? []).reduce((map, row: any) => {
      map.set(row.source_id, (map.get(row.source_id) || 0) + 1)
      return map
    }, new Map<string, number>())
  }

  return sourceRows.map((row) => ({
    id: row.id,
    agent_id: row.agent_id,
    title: row.title,
    content: row.inline_content ?? null,
    type: row.type,
    source_url: row.metadata?.source_url || null,
    filename: row.filename ?? null,
    mime_type: row.mime_type ?? null,
    size_bytes: row.size_bytes ?? null,
    storage_path: row.storage_path ?? null,
    status: row.status,
    error_message: row.error_message ?? null,
    chunk_count: chunkCountMap.get(row.id) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata || {},
  })) as AdminAgentDocument[]
}

export async function createAgentDocument(
  agentId: string,
  input: z.infer<typeof AgentDocumentSchema>
): Promise<AgentActionResult> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const parsed = AgentDocumentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }

  let openRouterKey: string
  try {
    openRouterKey = getOpenRouterApiKey()
  } catch {
    return { error: "OPENROUTER_API_KEY ausente no servidor" }
  }

  try {
    const { source } = await enqueueKbSource({
      agentId,
      title: parsed.data.title,
      type: parsed.data.type,
      inlineContent: parsed.data.content,
      checksum: sha256(Buffer.from(parsed.data.content, "utf-8")),
      metadata: {
        source: "manual",
        source_url: parsed.data.sourceUrl ? parsed.data.sourceUrl : null,
      },
    })

    await processPendingKbSources({ sourceId: source.id, limit: 1 }, openRouterKey)
  } catch (error) {
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
): Promise<AgentActionResult> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const parsed = AgentDocumentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }

  let openRouterKey: string
  try {
    openRouterKey = getOpenRouterApiKey()
  } catch {
    return { error: "OPENROUTER_API_KEY ausente no servidor" }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_agent_kb_sources")
    .update({
      title: parsed.data.title,
      type: parsed.data.type,
      inline_content: parsed.data.content,
      checksum_sha256: sha256(Buffer.from(parsed.data.content, "utf-8")),
      status: "pending",
      error_message: null,
      metadata: {
        source: "manual",
        source_url: parsed.data.sourceUrl ? parsed.data.sourceUrl : null,
        reindex_requested_at: new Date().toISOString(),
      },
    })
    .eq("id", documentId)
    .eq("agent_id", agentId)

  if (error) {
    console.error("Error updating agent doc:", error)
    return { error: "Erro ao atualizar documento" }
  }

  await supabase.from("ai_agent_kb_chunks").delete().eq("source_id", documentId)
  try {
    await processPendingKbSources({ sourceId: documentId, limit: 1 }, openRouterKey)
  } catch (processingError) {
    console.error("Error reindexing agent doc:", processingError)
    return { error: "Documento atualizado, mas falhou no reprocessamento" }
  }

  revalidatePath(`/admin/agents/${agentId}`)
  return { success: true }
}

export async function deleteAgentDocument(agentId: string, documentId: string): Promise<AgentActionResult> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return auth

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("ai_agent_kb_sources")
    .select("storage_path")
    .eq("id", documentId)
    .eq("agent_id", agentId)
    .maybeSingle()

  const { error } = await supabase
    .from("ai_agent_kb_sources")
    .delete()
    .eq("id", documentId)
    .eq("agent_id", agentId)

  if (error) {
    console.error("Error deleting agent doc:", error)
    return { error: "Erro ao excluir documento" }
  }

  if (existing?.storage_path) {
    await supabase.storage
      .from("ai-agent-kb-files")
      .remove([existing.storage_path])
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

export type AdminTrainingConversation = {
  id: string
  title: string | null
  last_message_at: string | null
  created_at: string
}

export type AdminTrainingMessage = {
  id: string
  sender: "user" | "assistant" | "system"
  content: string
  metadata: Record<string, any> | null
  created_at: string
}

export async function getAgentTrainingConversationsAdmin(agentId: string): Promise<AdminTrainingConversation[]> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_admin_agent_conversations")
    .select("id, title, last_message_at, created_at")
    .eq("agent_id", agentId)
    .eq("user_id", auth.userId)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (error) {
    console.error("Error fetching admin training conversations:", error)
    return []
  }

  return (data ?? []) as AdminTrainingConversation[]
}

export async function getAdminTrainingMessages(conversationId: string): Promise<AdminTrainingMessage[]> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return []

  const supabase = createAdminClient()
  const { data: conversation, error: conversationError } = await supabase
    .from("ai_admin_agent_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (conversationError || !conversation) {
    return []
  }

  const { data, error } = await supabase
    .from("ai_admin_agent_messages")
    .select("id, sender, content, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching admin training messages:", error)
    return []
  }

  return (data ?? []) as AdminTrainingMessage[]
}

type AdminActionResult = { success: true } | { error: string }

export async function deleteAdminTrainingConversation(conversationId: string): Promise<AdminActionResult> {
  const auth = await requireSystemOwner()
  if ("error" in auth) return { error: auth.error ?? "Não autorizado" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("ai_admin_agent_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", auth.userId)

  if (error) {
    console.error("Error deleting admin training conversation:", error)
    return { error: "Erro ao excluir conversa" }
  }

  return { success: true }
}
