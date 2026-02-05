/**
 * Hierarchy-based Access Control
 *
 * PRD Section 2.1: Visibilidade de dados sensíveis é regida pela Hierarquia de Cargos
 *
 * Regra: Usuario(N) vê dados de Usuario(>N)
 *
 * - Nível 0 - Estratégico: Gerente Comercial (vê todos abaixo)
 * - Nível 1 - Tático: Coordenador, Sales Ops, Enablement (vê Nível 2 e 3)
 * - Nível 2 - Operacional: Supervisor (vê Nível 3)
 * - Nível 3 - Execução: SDR, Closer, etc. (vê apenas seus próprios dados)
 */

import type { SupabaseClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

interface UserHierarchyInfo {
  userId: string
  jobTitleId: string | null
  hierarchyLevel: number | null
  jobTitleName: string | null
}

/**
 * Get user's hierarchy level from their job title
 */
export async function getUserHierarchyLevel(
  userId: string,
  workspaceId: string,
  client?: SupabaseClient
): Promise<number | null> {
  const supabase = client ?? (await createClient())

  const { data: member } = await supabase
    .from('workspace_members')
    .select(`
      job_title_id,
      job_titles:job_title_id (
        hierarchy_level
      )
    `)
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!member) return null

  const jobTitle = member.job_titles as any
  return jobTitle?.hierarchy_level ?? 3
}

/**
 * Get detailed hierarchy info for a user
 */
export async function getUserHierarchyInfo(
  userId: string,
  workspaceId: string,
  client?: SupabaseClient
): Promise<UserHierarchyInfo | null> {
  const supabase = client ?? (await createClient())

  const { data: member } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      job_title_id,
      job_titles:job_title_id (
        hierarchy_level,
        name
      )
    `)
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!member) {
    return {
      userId,
      jobTitleId: null,
      hierarchyLevel: null,
      jobTitleName: null
    }
  }

  const jobTitle = member.job_titles as any
  const hierarchyLevel = jobTitle?.hierarchy_level ?? 3

  return {
    userId,
    jobTitleId: member.job_title_id,
    hierarchyLevel,
    jobTitleName: jobTitle?.name ?? null
  }
}

/**
 * Check if user A can view user B's sensitive data based on hierarchy
 *
 * Rule: Usuario(N) can view Usuario(>N)
 *
 * @param viewerUserId - User who wants to view data
 * @param targetUserId - User whose data is being viewed
 * @param workspaceId - Workspace context
 * @returns true if viewer can see target's data
 */
export async function canViewUserData(
  viewerUserId: string,
  targetUserId: string,
  workspaceId: string,
  client?: SupabaseClient
): Promise<boolean> {
  // User can always view their own data
  if (viewerUserId === targetUserId) return true

  const [viewerInfo, targetInfo] = await Promise.all([
    getUserHierarchyInfo(viewerUserId, workspaceId, client),
    getUserHierarchyInfo(targetUserId, workspaceId, client)
  ])

  const viewerLevel = viewerInfo?.hierarchyLevel ?? 3
  const targetLevel = targetInfo?.hierarchyLevel ?? 3

  // Viewer can see target if viewer's level is LOWER (more senior)
  // Level 0 (Gerente) can see everyone
  // Level 1 (Coordenador) can see levels 2 and 3
  // Level 2 (Supervisor) can see level 3
  // Level 3 (Execution) can only see themselves
  return viewerLevel < targetLevel
}

/**
 * Get all users that the viewer can see based on hierarchy
 *
 * @param viewerUserId - User who is viewing
 * @param workspaceId - Workspace context
 * @returns Array of user IDs that can be viewed
 */
export async function getVisibleUsers(
  viewerUserId: string,
  workspaceId: string,
  client?: SupabaseClient
): Promise<string[]> {
  const viewerInfo = await getUserHierarchyInfo(viewerUserId, workspaceId, client)

  if (!viewerInfo) {
    // No hierarchy info = can only see self
    return [viewerUserId]
  }

  const supabase = client ?? (await createClient())

  // Get all workspace members with their hierarchy levels
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      job_titles:job_title_id (
        hierarchy_level
      )
    `)
    .eq('workspace_id', workspaceId)

  if (!members) return [viewerUserId]

  const viewerLevel = viewerInfo.hierarchyLevel ?? 3

  const visibleUserIds = members
    .filter(member => {
      // Always include self
      if (member.user_id === viewerUserId) return true

      const jobTitle = member.job_titles as any
      const targetLevel = jobTitle?.hierarchy_level ?? 3

      // Can view if target's level is higher (less senior)
      return viewerLevel < targetLevel
    })
    .map(member => member.user_id)

  return visibleUserIds
}

/**
 * Check if user has permission based on role (for workspace actions)
 * This is different from hierarchy-based visibility
 *
 * @param userId - User to check
 * @param workspaceId - Workspace context
 * @param requiredRole - Required role (owner, admin, member)
 */
export async function hasWorkspaceRole(
  userId: string,
  workspaceId: string,
  requiredRole: 'owner' | 'admin' | 'member',
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = client ?? (await createClient())

  // Check if user is super admin
  const { data: user } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', userId)
    .single()

  if (user?.is_super_admin) return true

  // Check workspace membership role
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!member) return false

  const roleHierarchy = { owner: 3, admin: 2, member: 1 }
  const userRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}
