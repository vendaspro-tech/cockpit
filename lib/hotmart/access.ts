import { createAdminClient } from "@/lib/supabase/admin"
import type { HotmartAccessStatus, WorkspaceHotmartAccessRecordInput, WorkspaceOwnerSyncTarget } from "@/lib/hotmart/types"

export async function countOwnedWorkspaces(ownerUserId: string): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerUserId)
    .or("access_level.eq.owner,role.eq.owner")

  if (error) {
    console.error("Error counting owned workspaces for Hotmart gate:", error)
    return 0
  }

  return count ?? 0
}

export async function getWorkspaceHotmartAccessStatus(workspaceId: string): Promise<HotmartAccessStatus | "missing"> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("workspace_hotmart_access")
    .select("status")
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching workspace Hotmart access status:", error)
    return "missing"
  }

  if (!data?.status) return "missing"
  return data.status as HotmartAccessStatus
}

export async function upsertWorkspaceHotmartAccess(input: WorkspaceHotmartAccessRecordInput) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from("workspace_hotmart_access").upsert(
    {
      workspace_id: input.workspaceId,
      owner_user_id: input.ownerUserId,
      owner_email: input.ownerEmail.trim().toLowerCase(),
      status: input.status,
      last_verified_at: now,
      last_verified_source: input.lastVerifiedSource,
      last_status_reason: input.lastStatusReason ?? null,
      last_error_message: input.lastErrorMessage ?? null,
      last_error_at: input.lastErrorAt ?? null,
      hotmart_customer_id: input.hotmartCustomerId ?? null,
      hotmart_subscription_id: input.hotmartSubscriptionId ?? null,
      hotmart_product_id: input.hotmartProductId ?? null,
      hotmart_offer_id: input.hotmartOfferId ?? null,
      raw_response: input.rawResponse ?? null,
      updated_at: now,
    },
    { onConflict: "workspace_id" }
  )

  if (error) {
    throw error
  }
}

export async function markWorkspaceHotmartAccessError(params: {
  workspaceId: string
  ownerUserId: string
  ownerEmail: string
  lastVerifiedSource: "cron" | "manual"
  errorMessage: string
}) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from("workspace_hotmart_access")
    .select("status")
    .eq("workspace_id", params.workspaceId)
    .maybeSingle()

  const status = (existing?.status as HotmartAccessStatus | undefined) ?? "unknown"

  const { error } = await supabase.from("workspace_hotmart_access").upsert(
    {
      workspace_id: params.workspaceId,
      owner_user_id: params.ownerUserId,
      owner_email: params.ownerEmail.trim().toLowerCase(),
      status,
      last_verified_source: params.lastVerifiedSource,
      last_error_message: params.errorMessage,
      last_error_at: now,
      updated_at: now,
    },
    { onConflict: "workspace_id" }
  )

  if (error) {
    throw error
  }
}

export async function listWorkspaceOwnerSyncTargets(): Promise<WorkspaceOwnerSyncTarget[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      workspace_id,
      user_id,
      access_level,
      role,
      users (
        email
      )
    `)
    .or("access_level.eq.owner,role.eq.owner")

  if (error) {
    throw error
  }

  const seen = new Set<string>()
  const results: WorkspaceOwnerSyncTarget[] = []

  for (const row of data ?? []) {
    const userData = Array.isArray(row.users) ? row.users[0] : row.users
    const email = (userData as { email?: string } | null)?.email?.trim().toLowerCase()
    if (!row.workspace_id || !row.user_id || !email) continue

    const key = `${row.workspace_id}:${row.user_id}`
    if (seen.has(key)) continue
    seen.add(key)

    results.push({
      workspaceId: row.workspace_id,
      ownerUserId: row.user_id,
      ownerEmail: email,
    })
  }

  return results
}

