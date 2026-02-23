'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"

export interface SubscriptionStats {
  total_mrr: number
  active_subscriptions: number
  total_workspaces: number
  churn_rate: number
  total_active_users: number
  plans_distribution: Record<string, number>
}

export interface SubscriptionItem {
  workspace_id: string
  workspace_name: string
  plan_name: string
  leader_copilot_enabled?: boolean
  price: number
  status?: string
  active_users: number
  plan_limit: number
  created_at: string
  cancelled_at?: string | null
  owner_name?: string
  owner_email?: string
}

export async function getSubscriptionStats(): Promise<{ stats: SubscriptionStats, items: SubscriptionItem[] }> {
  const user = await getAuthUser()
  if (!user) return { stats: { total_mrr: 0, active_subscriptions: 0, total_workspaces: 0, churn_rate: 0, total_active_users: 0, plans_distribution: {} }, items: [] }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { stats: { total_mrr: 0, active_subscriptions: 0, total_workspaces: 0, churn_rate: 0, total_active_users: 0, plans_distribution: {} }, items: [] }

  const supabase = createAdminClient()

  // Fetch workspaces; status/cancelled_at may not exist in schema, so we default later
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name, plan, created_at')
    .order('created_at', { ascending: false })

  if (wsError) {
    console.error('Error fetching workspaces:', wsError)
    return { stats: { total_mrr: 0, active_subscriptions: 0, total_workspaces: 0, churn_rate: 0, total_active_users: 0, plans_distribution: {} }, items: [] }
  }

  // Fetch member counts for all workspaces
  const { data: memberCounts, error: _membersError } = await supabase
    .from('workspace_members')
    .select('workspace_id')

  const memberCountMap = new Map<string, number>()
  if (memberCounts) {
    memberCounts.forEach(m => {
      memberCountMap.set(m.workspace_id, (memberCountMap.get(m.workspace_id) || 0) + 1)
    })
  }

  // Fetch owners for all workspaces
  // We look for access_level = 'owner' OR role = 'owner' (legacy)
  const { data: owners, error: _ownersError } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      users (
        full_name,
        email
      )
    `)
    .or('access_level.eq.owner,role.eq.owner')

  const ownerMap = new Map<string, { name: string, email: string }>()
  if (owners) {
    owners.forEach(o => {
      // users might be an array from the join
      const userData = Array.isArray(o.users) ? o.users[0] : o.users
      if (userData) {
        ownerMap.set(o.workspace_id, { name: userData.full_name || '', email: userData.email || '' })
      }
    })
  }

  // Fetch plans to get prices and limits
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('name, price_monthly, max_users')

  if (plansError) {
    console.error('Error fetching plans:', plansError)
    return { stats: { total_mrr: 0, active_subscriptions: 0, total_workspaces: 0, churn_rate: 0, total_active_users: 0, plans_distribution: {} }, items: [] }
  }

  const planMap = new Map(plans.map(p => [p.name.toLowerCase(), { price: p.price_monthly, limit: p.max_users }]))

  const { data: workspaceFeatures } = await supabase
    .from('workspace_features')
    .select('workspace_id, leader_copilot_enabled')

  const workspaceFeatureMap = new Map<string, boolean>(
    (workspaceFeatures ?? []).map((item) => [item.workspace_id, Boolean(item.leader_copilot_enabled)])
  )
  
  // Add hardcoded plans if missing
  if (!planMap.has('starter')) planMap.set('starter', { price: 0, limit: 5 })
  if (!planMap.has('pro')) planMap.set('pro', { price: 99, limit: 20 })
  if (!planMap.has('enterprise')) planMap.set('enterprise', { price: 299, limit: 100 })

  let totalMrr = 0
  let activeSubscriptions = 0
  let cancelledSubscriptions = 0
  let totalActiveUsers = 0
  const plansDistribution: Record<string, number> = {}
  const items: SubscriptionItem[] = []

  type WorkspaceRow = {
    id: string
    name: string
    plan: string | null
    created_at: string
    status?: string | null
    cancelled_at?: string | null
  }
  const workspaceRows = (workspaces ?? []) as WorkspaceRow[]

  workspaceRows.forEach(ws => {
    const planName = ws.plan || 'starter'
    const planDetails = planMap.get(planName.toLowerCase()) || { price: 0, limit: 0 }
    // status/cancelled_at may not exist; default to active
    const status = ws.status || 'active'
    const cancelledAt = ws.cancelled_at || null
    const activeUsers = memberCountMap.get(ws.id) || 0
    const owner = ownerMap.get(ws.id)
    
    if (status === 'active') {
      totalMrr += planDetails.price
      activeSubscriptions++
      plansDistribution[planName] = (plansDistribution[planName] || 0) + 1
      totalActiveUsers += activeUsers
    } else if (status === 'cancelled') {
      cancelledSubscriptions++
    }

    items.push({
      workspace_id: ws.id,
      workspace_name: ws.name,
      plan_name: planName,
      leader_copilot_enabled: workspaceFeatureMap.get(ws.id) ?? false,
      price: planDetails.price,
      status: status,
      active_users: activeUsers,
      plan_limit: planDetails.limit,
      created_at: ws.created_at,
      cancelled_at: cancelledAt,
      owner_name: owner?.name,
      owner_email: owner?.email
    })
  })

  const totalWorkspaces = workspaces.length
  const churnRate = totalWorkspaces > 0 ? (cancelledSubscriptions / totalWorkspaces) * 100 : 0

  return {
    stats: {
      total_mrr: totalMrr,
      active_subscriptions: activeSubscriptions,
      total_workspaces: totalWorkspaces,
      churn_rate: churnRate,
      total_active_users: totalActiveUsers,
      plans_distribution: plansDistribution
    },
    items
  }
}
