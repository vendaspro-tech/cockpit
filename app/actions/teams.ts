'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth-server"

const JobTitleSchema = z.object({
  name: z.string().min(1, "Nome do cargo é obrigatório"),
})

export async function getJobTitles(workspaceId: string) {
  const supabase = await createClient()
  
  // Job titles are now global (admin-only)
  const { data, error } = await supabase
    .from('job_titles')
    .select('*')
    .eq('is_global', true)
    .order('hierarchy_level', { ascending: true })
    .order('name')

  if (error) {
    console.error('Error fetching job titles:', JSON.stringify(error, null, 2))
    console.error('Error details:', { message: error.message, code: error.code, details: error.details })
    return []
  }

  return data
}

import { getUserRole } from "@/lib/auth-utils"
import { ensureSupabaseUser } from "@/lib/supabase/user"

export async function updateMemberJobTitle(workspaceId: string, memberId: string, jobTitleId: string | null) {
  const supabase = await createClient()

  // Verify if member belongs to workspace (security check)
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single()

  if (memberError || !member) {
    return { error: 'Membro não encontrado' }
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({ job_title_id: jobTitleId })
    .eq('id', memberId)

  if (error) {
    console.error('Error updating member job title:', error)
    return { error: 'Erro ao atualizar cargo do membro' }
  }

  revalidatePath(`/${workspaceId}/teams`)
  return { success: true }
}

export async function getTeamMembers(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      user:users(id, full_name, email, supabase_user_id),
      job_title:job_titles(id, name)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at')

  if (error) {
    console.error('Error fetching team members:', JSON.stringify(error, null, 2))
    return []
  }

  return data
}

export async function updateMemberRole(workspaceId: string, memberId: string, newRoleSlug: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  // Check if current user is owner/admin
  const currentUserRole = await getUserRole(user.id, workspaceId)
  if (currentUserRole !== 'system_owner' && currentUserRole !== 'owner' && currentUserRole !== 'admin') {
    return { error: 'Permissão insuficiente para alterar cargos' }
  }

  const supabase = await createClient()

  // Verify if member belongs to workspace
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('id, role, access_level, user_id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single()

  if (memberError || !member) {
    return { error: 'Membro não encontrado' }
  }

  if (member.access_level === 'owner' && currentUserRole === 'admin') {
    return { error: 'Apenas proprietários podem alterar outro proprietário' }
  }

  const { userId: currentUserId } = await ensureSupabaseUser(user.id)
  if (currentUserId && member.user_id === currentUserId && newRoleSlug === 'member' && currentUserRole === 'owner') {
    return { error: 'Você não pode rebaixar seu próprio acesso' }
  }

  // Prevent changing own role if it leads to losing admin access (optional safety check, but maybe too complex for now)
  // For now, just update.

  const { error } = await supabase
    .from('workspace_members')
    .update({ access_level: newRoleSlug })
    .eq('id', memberId)

  if (error) {
    console.error('Error updating member role:', error)
    return { error: 'Erro ao atualizar função do membro' }
  }

  revalidatePath(`/${workspaceId}/teams`)
  revalidatePath(`/${workspaceId}/settings`)
  return { success: true }
}

export async function removeMemberFromWorkspace(workspaceId: string, memberId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const currentUserRole = await getUserRole(user.id, workspaceId)
  if (currentUserRole !== 'system_owner' && currentUserRole !== 'owner' && currentUserRole !== 'admin') {
    return { error: 'Permissão insuficiente para remover membros' }
  }

  const supabase = await createClient()

  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('id, access_level, user_id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single()

  if (memberError || !member) {
    return { error: 'Membro não encontrado' }
  }

  if (member.access_level === 'owner' && currentUserRole === 'admin') {
    return { error: 'Apenas proprietários podem remover outro proprietário' }
  }

  const { userId: currentUserId } = await ensureSupabaseUser(user.id)
  if (currentUserId && member.user_id === currentUserId) {
    return { error: 'Você não pode remover a si mesmo' }
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Error removing member:', error)
    return { error: 'Erro ao remover membro do workspace' }
  }

  revalidatePath(`/${workspaceId}/teams`)
  revalidatePath(`/${workspaceId}/settings`)
  return { success: true }
}

export async function getAvailableRoles() {
  const supabase = await createClient()

  // Only return the 3 system access levels (not job titles)
  const { data, error } = await supabase
    .from('roles')
    .select('slug, name, description')
    .in('slug', ['owner', 'admin', 'member'])
    .order('slug')

  if (error) {
    console.error('Error fetching roles:', error)
    return []
  }

  return data || []
}
