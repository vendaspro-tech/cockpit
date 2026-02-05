'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

export interface UserWithDetails {
  id: string
  email: string
  full_name: string
  supabase_user_id: string
  created_at: string
  is_super_admin: boolean
  workspaces_count: number
  status: string
  access_levels: string[]
  profiles: string[]
}

export interface UserWorkspaceMembership {
  workspace_id: string
  workspace_name: string
  member_id: string
  access_level: string
  job_title_id: string | null
  job_title_name: string | null
  hierarchy_level: number | null
}

export async function getUsers(): Promise<UserWithDetails[]> {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  type UserRow = {
    id: string
    email: string
    full_name: string
    supabase_user_id: string
    created_at: string
    is_super_admin?: boolean | null
    status?: string | null
  }

  const userRows = (users ?? []) as UserRow[]

  // Fetch workspace details for each user
  const enrichedUsers = await Promise.all(userRows.map(async (u) => {
    const { data: members, error: _memberError } = await supabase
      .from('workspace_members')
      .select(`
        access_level,
        role,
        roles (
          name
        )
      `)
      .eq('user_id', u.id)

    // Fallback for access_level if migration hasn't run or data is missing
    // We can infer from 'role' if access_level is missing, but let's assume migration runs.
    // If access_level is missing, we might get nulls.

    const accessLevels = Array.from(new Set(members?.map(m => m.access_level).filter(Boolean) as string[]))
    // @ts-expect-error - Supabase types might not know about the join yet
    const profiles = Array.from(new Set(members?.map(m => m.roles?.name).filter(Boolean) as string[]))

    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      supabase_user_id: u.supabase_user_id,
      created_at: u.created_at,
      is_super_admin: u.is_super_admin || false,
      workspaces_count: members?.length || 0,
      status: u.status || 'active',
      access_levels: accessLevels,
      profiles: profiles
    }
  }))

  return enrichedUsers
}

export async function toggleUserSuperAdmin(userId: string, isSuperAdmin: boolean) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  // Prevent removing own super admin status if you are the only one? 
  // Or just prevent removing own status generally to avoid locking yourself out.
  if (user.id === userId && !isSuperAdmin) {
    return { error: 'Você não pode remover seu próprio acesso de Super Admin.' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({ is_super_admin: isSuperAdmin })
    .eq('id', userId)

  if (error) {
    console.error('Error toggling super admin:', error)
    return { error: 'Erro ao atualizar status de Super Admin' }
  }

  revalidatePath(`/admin/users`)
  return { success: true }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned') {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  // Evita que o usuário se bloqueie sozinho
  if (user.id === userId && status !== 'active') {
    return { error: 'Você não pode inativar ou banir a si mesmo.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user status:', error)
    return { error: 'Erro ao atualizar status do usuário' }
  }

  revalidatePath(`/admin/users`)
  return { success: true }
}

export async function deleteUser(userId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }
  
  if (user.id === userId) {
    return { error: 'Você não pode excluir a si mesmo.' }
  }

  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting user:', error)
    return { error: 'Erro ao excluir usuário' }
  }

  revalidatePath(`/admin/users`)
  return { success: true }
}

// Get all workspace memberships for a user (admin only)
export async function getUserWorkspaceMemberships(userId: string): Promise<UserWorkspaceMembership[]> {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      workspace_id,
      access_level,
      job_title_id,
      workspaces!inner(name),
      job_titles(id, name, hierarchy_level)
    `)
    .eq('user_id', userId)
    .order('workspaces(name)')

  if (error) {
    console.error('Error fetching user workspace memberships:', error)
    return []
  }

  return data.map((m: any) => ({
    workspace_id: m.workspace_id,
    workspace_name: m.workspaces.name,
    member_id: m.id,
    access_level: m.access_level || 'member',
    job_title_id: m.job_title_id,
    job_title_name: m.job_titles?.name || null,
    hierarchy_level: m.job_titles?.hierarchy_level ?? null
  }))
}

// Update member job title (admin only - can edit any workspace)
export async function updateMemberJobTitleAdmin(
  memberId: string, 
  jobTitleId: string | null
) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('workspace_members')
    .update({ job_title_id: jobTitleId })
    .eq('id', memberId)

  if (error) {
    console.error('Error updating member job title:', error)
    return { error: 'Erro ao atualizar cargo do membro' }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
