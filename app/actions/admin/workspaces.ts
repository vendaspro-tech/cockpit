'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

export interface WorkspaceWithDetails {
  id: string
  name: string
  plan: string
  created_at: string
  member_count: number
  owner_email?: string
  owner_name?: string
}

export async function getWorkspaces(): Promise<WorkspaceWithDetails[]> {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  // Fetch workspaces
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching workspaces:', error)
    return []
  }

  // Fetch member counts and owners for each workspace
  // This is a bit N+1 but for an admin dashboard with reasonable number of workspaces it's fine.
  // Alternatively we could write a complex join or a view.
  
  type OwnerUser = { email: string | null; full_name: string | null }
  const workspaceRows = (workspaces ?? []) as Array<{
    id: string
    name: string
    plan: string
    created_at: string
  }>

  const enrichedWorkspaces = await Promise.all(workspaceRows.map(async (ws) => {
    // Get member count
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', ws.id)

    // Get owner(s) - just taking the first one found
    let ownerData: OwnerUser | null = null

    const { data: ownerRow } = await supabase
      .from('workspace_members')
      .select('user:users(email, full_name)')
      .eq('workspace_id', ws.id)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    ownerData = (ownerRow?.user ?? null) as OwnerUser | null

    // Fallback para dados legados onde o campo era access_level
    if (!ownerData) {
      const { data: legacyOwner } = await supabase
        .from('workspace_members')
        .select('user:users(email, full_name)')
        .eq('workspace_id', ws.id)
        .eq('access_level', 'owner')
        .limit(1)
        .maybeSingle()

      ownerData = (legacyOwner?.user ?? null) as OwnerUser | null
    }

    return {
      id: ws.id,
      name: ws.name,
      plan: ws.plan,
      created_at: ws.created_at,
      member_count: count || 0,
      owner_email: ownerData?.email ?? undefined,
      owner_name: ownerData?.full_name ?? undefined
    }
  }))

  return enrichedWorkspaces
}

export async function deleteWorkspace(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) {
    console.error('Error deleting workspace:', error)
    return { error: 'Erro ao excluir workspace' }
  }

  revalidatePath(`/admin/workspaces`)
  return { success: true }
}

export async function updateWorkspacePlan(workspaceId: string, plan: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('workspaces')
    .update({ plan })
    .eq('id', workspaceId)

  if (error) {
    console.error('Error updating workspace plan:', error)
    return { error: 'Erro ao atualizar plano' }
  }

  revalidatePath(`/admin/workspaces`)
  return { success: true }
}

export async function updateWorkspaceStatus(
  workspaceId: string,
  status: 'active' | 'suspended' | 'cancelled'
) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const payload: { status: 'active' | 'suspended' | 'cancelled'; cancelled_at?: string | null } = { status }

  // Atualiza o cancelled_at para manter rastreabilidade
  if (status === 'cancelled') {
    payload.cancelled_at = new Date().toISOString()
  } else {
    payload.cancelled_at = null
  }

  const { error } = await supabase
    .from('workspaces')
    .update(payload)
    .eq('id', workspaceId)

  if (error) {
    console.error('Error updating workspace status:', error)
    return { error: 'Erro ao atualizar status do workspace' }
  }

  revalidatePath(`/admin/workspaces`)
  return { success: true }
}
