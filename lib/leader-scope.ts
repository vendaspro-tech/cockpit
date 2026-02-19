import type { SupabaseClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

import type { LeaderScopeUser } from "@/lib/types/leader-copilot"

type EligibilityResult = {
  eligible: boolean
  internalUserId: string | null
  reason: string | null
}

type InternalUserRow = {
  id: string
}

type MembershipRow = {
  user_id: string
  job_titles: {
    name: string | null
    slug: string | null
  } | null
}

const ELIGIBLE_SLUGS = new Set([
  "supervisor-comercial",
  "coordenador-comercial",
  "gerente-comercial",
])

const ELIGIBLE_NAMES = new Set([
  "supervisor comercial",
  "coordenador comercial",
  "gerente comercial",
])

async function getClient(client?: SupabaseClient) {
  if (client) return client
  return createClient()
}

export async function getInternalUserId(authUserId: string, client?: SupabaseClient): Promise<string | null> {
  const supabase = await getClient(client)
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_user_id", authUserId)
    .maybeSingle()

  return (data as InternalUserRow | null)?.id ?? null
}

export async function isLeaderCopilotEnabled(workspaceId: string, client?: SupabaseClient): Promise<boolean> {
  const supabase = await getClient(client)
  const { data, error } = await supabase.rpc("is_leader_copilot_enabled", {
    workspace_id_param: workspaceId,
  })

  if (error) {
    console.error("Error checking leader copilot feature flag:", error)
    return false
  }

  return Boolean(data)
}

export async function assertLeaderEligible(
  workspaceId: string,
  authUserId: string,
  client?: SupabaseClient
): Promise<EligibilityResult> {
  const supabase = await getClient(client)
  const internalUserId = await getInternalUserId(authUserId, supabase)

  if (!internalUserId) {
    return { eligible: false, internalUserId: null, reason: "Usuário interno não encontrado" }
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, job_titles:job_title_id(name, slug)")
    .eq("workspace_id", workspaceId)
    .eq("user_id", internalUserId)
    .maybeSingle()

  if (error || !data) {
    return { eligible: false, internalUserId, reason: "Usuário não pertence ao workspace" }
  }

  const member = data as unknown as MembershipRow
  const slug = member.job_titles?.slug?.toLowerCase().trim() ?? ""
  const name = member.job_titles?.name?.toLowerCase().trim() ?? ""

  if (!ELIGIBLE_SLUGS.has(slug) && !ELIGIBLE_NAMES.has(name)) {
    return { eligible: false, internalUserId, reason: "Cargo não elegível" }
  }

  return { eligible: true, internalUserId, reason: null }
}

async function getSquadScopedUsers(
  workspaceId: string,
  leaderInternalUserId: string,
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = await getClient(client)

  const { data: squads, error: squadsError } = await supabase
    .from("squads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("leader_id", leaderInternalUserId)

  if (squadsError) {
    console.error("Error fetching squads for leader scope:", squadsError)
    return [leaderInternalUserId]
  }

  const squadIds = (squads ?? []).map((s: { id: string }) => s.id)
  if (squadIds.length === 0) {
    return [leaderInternalUserId]
  }

  const { data: squadMembers, error: membersError } = await supabase
    .from("squad_members")
    .select("user_id")
    .in("squad_id", squadIds)

  if (membersError) {
    console.error("Error fetching squad members for leader scope:", membersError)
    return [leaderInternalUserId]
  }

  const userIds = new Set<string>([leaderInternalUserId])
  for (const row of squadMembers ?? []) {
    userIds.add((row as { user_id: string }).user_id)
  }

  return Array.from(userIds)
}

export async function getLeaderScopedUserIds(
  workspaceId: string,
  authUserId: string,
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = await getClient(client)
  const eligibility = await assertLeaderEligible(workspaceId, authUserId, supabase)

  if (!eligibility.eligible || !eligibility.internalUserId) {
    return []
  }

  const initialScopedIds = await getSquadScopedUsers(workspaceId, eligibility.internalUserId, supabase)

  const filtered = await Promise.all(
    initialScopedIds.map(async (targetUserId) => {
      const { data, error } = await supabase.rpc("can_view_user_in_workspace", {
        viewer_user_id: eligibility.internalUserId,
        target_user_id: targetUserId,
        workspace_id_param: workspaceId,
      })

      if (error) {
        console.error("Error validating hierarchy scope:", error)
        return null
      }

      if (Boolean(data)) return targetUserId
      return null
    })
  )

  const visibleIds = filtered.filter((id): id is string => Boolean(id))
  if (!visibleIds.includes(eligibility.internalUserId)) {
    visibleIds.push(eligibility.internalUserId)
  }

  return Array.from(new Set(visibleIds))
}

export async function assertTargetInLeaderScope(
  workspaceId: string,
  authUserId: string,
  targetInternalUserId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const scopedIds = await getLeaderScopedUserIds(workspaceId, authUserId, client)
  return scopedIds.includes(targetInternalUserId)
}

export async function getLeaderScopeUsers(
  workspaceId: string,
  authUserId: string,
  client?: SupabaseClient
): Promise<LeaderScopeUser[]> {
  const supabase = await getClient(client)
  const scopedIds = await getLeaderScopedUserIds(workspaceId, authUserId, supabase)

  if (scopedIds.length === 0) return []

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, supabase_user_id")
    .in("id", scopedIds)

  if (error || !data) {
    console.error("Error fetching scoped users:", error)
    return []
  }

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("user_id, job_titles:job_title_id(name, slug)")
    .eq("workspace_id", workspaceId)
    .in("user_id", scopedIds)

  const jobByUser = new Map<string, { name: string | null; slug: string | null }>()
  for (const item of memberships ?? []) {
    const row = item as unknown as MembershipRow
    jobByUser.set(row.user_id, {
      name: row.job_titles?.name ?? null,
      slug: row.job_titles?.slug ?? null,
    })
  }

  return data.map((row) => {
    const user = row as { id: string; full_name: string | null; email: string | null; supabase_user_id: string }
    const job = jobByUser.get(user.id)

    return {
      id: user.id,
      auth_user_id: user.supabase_user_id,
      name: user.full_name || user.email || "Usuário",
      email: user.email,
      job_title: job?.name ?? null,
      job_title_slug: job?.slug ?? null,
    }
  })
}

export async function canAccessLeaderCopilot(
  workspaceId: string,
  authUserId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = await getClient(client)
  const [enabled, eligibility] = await Promise.all([
    isLeaderCopilotEnabled(workspaceId, supabase),
    assertLeaderEligible(workspaceId, authUserId, supabase),
  ])

  return enabled && eligibility.eligible
}
