import { createAdminClient } from "@/lib/supabase/admin"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { redirect } from "next/navigation"

type GetUserRoleOptions = {
  createIfMissing?: boolean
  defaultAccessLevel?: string
}

export async function getUserRole(
  userId: string,
  workspaceId: string,
  options: GetUserRoleOptions = {}
) {
  const supabase = createAdminClient()

  const { userId: supabaseUserId } = await ensureSupabaseUser(userId)
  if (!supabaseUserId) return null

  // Get Supabase user ID and super admin status
  const { data: user } = await supabase
    .from("users")
    .select("id, is_super_admin")
    .eq("id", supabaseUserId)
    .single()

  if (!user) return null

  // If super admin, return special role
  if (user.is_super_admin) return "system_owner"

  // Get role in workspace
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role, access_level")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()

  const resolvedRole = member?.role || member?.access_level || null

  if (!resolvedRole && options.createIfMissing) {
    const accessLevel = options.defaultAccessLevel || "owner"
    const { error: insertError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: supabaseUserId,
        access_level: accessLevel,
        role: null,
      })

    if (insertError) {
      return null
    }

    return accessLevel
  }

  return resolvedRole
}

export async function requireSystemOwner(userId: string, workspaceId: string) {
  const role = await getUserRole(userId, workspaceId)

  if (role !== "system_owner") {
    redirect(`/${workspaceId}/kpis`)
  }

  return role
}

export async function isSystemOwner(userId: string) {
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("supabase_user_id", userId)
    .single()

  return user?.is_super_admin || false
}

/**
 * Extract workspace ID from API request headers or cookies
 * Used primarily for API routes that need workspace context
 */
export async function getUserWorkspaceId(request: Request): Promise<string | null> {
  try {
    // Try to get from headers first
    const workspaceId = request.headers.get('x-workspace-id')
    if (workspaceId) return workspaceId

    // Try to get from URL search params
    const url = new URL(request.url)
    const urlWorkspaceId = url.searchParams.get('workspaceId')
    if (urlWorkspaceId) return urlWorkspaceId

    // Try to parse from request body (for POST requests)
    if (request.method === 'POST') {
      const clonedRequest = request.clone()
      try {
        const body = await clonedRequest.json()
        if (body?.workspaceId) return body.workspaceId
      } catch {
        // Body is not JSON or already consumed
      }
    }

    return null
  } catch {
    return null
  }
}
