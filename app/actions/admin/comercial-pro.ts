'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

export async function getProWorkspaces() {
  const user = await getAuthUser()
  if (!user) return []
  const owner = await isSystemOwner(user.id)
  if (!owner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .order('name')

  if (error) {
    console.error("Error fetching workspaces:", error)
    return []
  }
  return data || []
}

export async function getProWorkspaceUsers(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) return []
  const owner = await isSystemOwner(user.id)
  if (!owner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('workspace_members')
    .select('user:users(id, full_name, email)')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error fetching workspace users:', error)
    return []
  }

  type WorkspaceUserRow = { user?: { id: string | null; full_name: string | null; email: string | null } | null }
  const rows = (data ?? []) as unknown as WorkspaceUserRow[]

  return rows
    .map((item) => ({
      id: item.user?.id || null,
      name: item.user?.full_name || item.user?.email || 'Usuário'
    }))
    .filter((u) => u.id)
}

export async function getProActionPlans(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) return []
  const owner = await isSystemOwner(user.id)
  if (!owner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('action_plans')
    .select(`
      id, name, status, deadline, created_at, workspace_id,
      responsible:users!responsible_id(full_name)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching action plans:', error)
    return []
  }
  return data || []
}

export async function createProActionPlan(workspaceId: string, input: {
  name: string
  responsible_id?: string
  deadline?: string | null
  status?: 'not_started' | 'in_progress' | 'completed'
}) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }
  const owner = await isSystemOwner(user.id)
  if (!owner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('action_plans')
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      responsible_id: input.responsible_id,
      deadline: input.deadline || null,
      status: input.status || 'not_started',
      content: {},
      is_template: false
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating action plan (admin):', error)
    return { error: 'Erro ao criar plano' }
  }

  revalidatePath(`/admin/comercial-pro/planos-de-acao`)
  return { success: true, id: data?.id }
}

export async function getProConsultancies(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) return []
  const owner = await isSystemOwner(user.id)
  if (!owner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('consultancies')
    .select(`
      id, workspace_id, date, mentor_id, recording_link, comments, action_plan_id, created_at,
      mentor:users!mentor_id(full_name, email),
      action_plan:action_plans(name)
    `)
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching consultancies (admin):', error)
    return []
  }
  
  // Transform Supabase relation arrays to single objects
  return (data || []).map(item => ({
    ...item,
    mentor: Array.isArray(item.mentor) ? item.mentor[0] || null : item.mentor,
    action_plan: Array.isArray(item.action_plan) ? item.action_plan[0] || null : item.action_plan
  }))
}

export async function createProConsultancy(workspaceId: string, input: {
  date: string
  mentor_id?: string
  recording_link?: string
  comments?: string
  action_plan_id?: string
}) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }
  const owner = await isSystemOwner(user.id)
  if (!owner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('consultancies')
    .insert({
      workspace_id: workspaceId,
      date: input.date,
      mentor_id: input.mentor_id || null,
      recording_link: input.recording_link || null,
      comments: input.comments || null,
      action_plan_id: input.action_plan_id || null
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating consultancy (admin):', error)
    return { error: 'Erro ao criar consultoria' }
  }

  revalidatePath(`/admin/comercial-pro/consultorias`)
  return { success: true, id: data?.id }
}
