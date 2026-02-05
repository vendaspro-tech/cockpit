'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export type ActionPlan = {
  id: string
  workspace_id: string
  name: string
  responsible_id: string | null
  deadline: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  content: Record<string, unknown>
  is_template: boolean
  template_id: string | null
  created_at: string
  responsible?: {
    full_name: string | null
    email: string | null
  }
}

export type Consultancy = {
  id: string
  workspace_id: string
  date: string
  mentor_id: string | null
  recording_link: string | null
  comments: string | null
  action_plan_id: string | null
  created_at: string
  mentor?: {
    full_name: string | null
    email: string | null
  }
  action_plan?: {
    name: string
  }
}

export async function getActionPlans(workspaceId: string) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('action_plans')
    .select(`
      *,
      responsible:users!responsible_id(full_name, email)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching action plans:', error)
    return []
  }

  return data as ActionPlan[]
}

export async function createActionPlan(workspaceId: string, data: Partial<ActionPlan>) {
  const supabase = createAdminClient()
  
  const { data: createdPlan, error } = await supabase
    .from('action_plans')
    .insert({
      workspace_id: workspaceId,
      name: data.name,
      responsible_id: data.responsible_id,
      deadline: data.deadline,
      status: data.status || 'not_started',
      content: data.content || {},
      is_template: data.is_template || false,
      template_id: data.template_id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating action plan:', error)
    return { error: 'Failed to create action plan' }
  }

  revalidatePath(`/${workspaceId}/comercial-pro/action-plans`)
  return { success: true, id: createdPlan.id }
}

export async function updateActionPlan(id: string, workspaceId: string, data: Partial<ActionPlan>) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('action_plans')
    .update({
      name: data.name,
      responsible_id: data.responsible_id,
      deadline: data.deadline,
      status: data.status,
      content: data.content,
      is_template: data.is_template,
      template_id: data.template_id
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error updating action plan:', error)
    return { error: 'Failed to update action plan' }
  }

  revalidatePath(`/${workspaceId}/comercial-pro/action-plans`)
  return { success: true }
}

export async function deleteActionPlan(id: string, workspaceId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('action_plans')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error deleting action plan:', error)
    return { error: 'Failed to delete action plan' }
  }

  revalidatePath(`/${workspaceId}/comercial-pro/action-plans`)
  return { success: true }
}

export async function getConsultancies(workspaceId: string) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('consultancies')
    .select(`
      *,
      mentor:users!mentor_id(full_name, email),
      action_plan:action_plans(name)
    `)
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching consultancies:', error)
    return []
  }

  return data as Consultancy[]
}
