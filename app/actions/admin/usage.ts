'use server'

import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { isSystemOwner } from '@/lib/auth-utils'
import { getAuthUser } from '@/lib/auth-server'

const UsageFiltersSchema = z.object({
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
  workspaceId: z.string().uuid().optional(),
  plan: z.string().min(1).optional(),
  search: z.string().optional(),
})

export type UsageFilters = z.infer<typeof UsageFiltersSchema>

export interface WorkspaceUsageSummary {
  workspace_id: string
  workspace_name: string
  plan: string
  members_count: number
  active_core_users: number
  activation_rate: number
  assessments_started: number
  assessments_completed: number
  assessments_completion_rate: number
  agent_conversations_started: number
  agent_messages_sent: number
  agent_active_users: number
  pdis_created: number
  pdis_completed: number
  last_core_activity_at: string | null
}

export interface WorkspaceUserUsage {
  user_id: string
  full_name: string | null
  email: string
  core_actions: number
  assessments_actions: number
  agent_actions: number
  pdi_actions: number
}

export interface WorkspaceWeeklyTrendPoint {
  week_start: string
  core_actions: number
  assessments_completed: number
  agent_conversations_started: number
  pdis_completed: number
}

function normalizeFilters(input: UsageFilters) {
  const parsed = UsageFiltersSchema.parse(input)

  return {
    ...parsed,
    workspaceId: parsed.workspaceId,
    plan: parsed.plan && parsed.plan !== 'all' ? parsed.plan : undefined,
    search: parsed.search?.trim() || undefined,
  }
}

function startOfUtcWeek(input: string) {
  const date = new Date(`${input}T00:00:00.000Z`)
  const day = date.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diffToMonday)
  return date.toISOString().slice(0, 10)
}

async function ensureSystemOwnerAccess() {
  const user = await getAuthUser()
  if (!user) return false

  return isSystemOwner(user.id)
}

export async function getUsageFilterOptions(): Promise<{ workspaces: Array<{ id: string; name: string; plan: string }>; plans: string[] }> {
  const allowed = await ensureSystemOwnerAccess()
  if (!allowed) {
    return { workspaces: [], plans: [] }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, plan')
    .order('name', { ascending: true })

  if (error || !data) {
    if (error) {
      console.error('getUsageFilterOptions error:', error)
    }
    return { workspaces: [], plans: [] }
  }

  const planSet = new Set<string>()
  const workspaces = data.map((row: any) => {
    const plan = row.plan || 'starter'
    planSet.add(plan)

    return {
      id: row.id as string,
      name: row.name as string,
      plan,
    }
  })

  return {
    workspaces,
    plans: Array.from(planSet).sort((a, b) => a.localeCompare(b)),
  }
}

export async function getUsageSummary(filters: UsageFilters): Promise<WorkspaceUsageSummary[]> {
  const allowed = await ensureSystemOwnerAccess()
  if (!allowed) return []

  const normalized = normalizeFilters(filters)
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('admin_usage_workspace_summary', {
    date_from: normalized.dateFrom,
    date_to: normalized.dateTo,
    p_workspace_id: normalized.workspaceId ?? null,
    p_plan: normalized.plan ?? null,
  })

  if (error) {
    console.error('getUsageSummary error:', error)
    return []
  }

  const rows = ((data ?? []) as any[]).map((row) => ({
    workspace_id: row.workspace_id,
    workspace_name: row.workspace_name,
    plan: row.plan,
    members_count: Number(row.members_count ?? 0),
    active_core_users: Number(row.active_core_users ?? 0),
    activation_rate: Number(row.activation_rate ?? 0),
    assessments_started: Number(row.assessments_started ?? 0),
    assessments_completed: Number(row.assessments_completed ?? 0),
    assessments_completion_rate: Number(row.assessments_completion_rate ?? 0),
    agent_conversations_started: Number(row.agent_conversations_started ?? 0),
    agent_messages_sent: Number(row.agent_messages_sent ?? 0),
    agent_active_users: Number(row.agent_active_users ?? 0),
    pdis_created: Number(row.pdis_created ?? 0),
    pdis_completed: Number(row.pdis_completed ?? 0),
    last_core_activity_at: row.last_core_activity_at ?? null,
  }))

  if (!normalized.search) {
    return rows
  }

  const search = normalized.search.toLowerCase()
  return rows.filter((row) => row.workspace_name.toLowerCase().includes(search))
}

export async function getWorkspaceUsageDetail(
  workspaceId: string,
  filters: UsageFilters
): Promise<{ users: WorkspaceUserUsage[]; weeklyTrend: WorkspaceWeeklyTrendPoint[] }> {
  const allowed = await ensureSystemOwnerAccess()
  if (!allowed) return { users: [], weeklyTrend: [] }

  const normalized = normalizeFilters(filters)
  const parsedWorkspaceId = z.string().uuid().parse(workspaceId)
  const supabase = createAdminClient()

  const [usersResult, trendResult] = await Promise.all([
    supabase.rpc('admin_usage_workspace_user_top', {
      date_from: normalized.dateFrom,
      date_to: normalized.dateTo,
      p_workspace_id: parsedWorkspaceId,
      p_limit: 10,
    }),
    supabase
      .from('usage_events')
      .select('event_day, event_name')
      .eq('workspace_id', parsedWorkspaceId)
      .gte('occurred_at', normalized.dateFrom)
      .lt('occurred_at', normalized.dateTo),
  ])

  if (usersResult.error) {
    console.error('getWorkspaceUsageDetail users error:', usersResult.error)
  }

  if (trendResult.error) {
    console.error('getWorkspaceUsageDetail trend error:', trendResult.error)
  }

  const users = ((usersResult.data ?? []) as any[]).map((row) => ({
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    core_actions: Number(row.core_actions ?? 0),
    assessments_actions: Number(row.assessments_actions ?? 0),
    agent_actions: Number(row.agent_actions ?? 0),
    pdi_actions: Number(row.pdi_actions ?? 0),
  }))

  const trendMap = new Map<string, WorkspaceWeeklyTrendPoint>()

  for (const row of (trendResult.data ?? []) as Array<{ event_day: string; event_name: string }>) {
    const weekStart = startOfUtcWeek(row.event_day)
    const current = trendMap.get(weekStart) ?? {
      week_start: weekStart,
      core_actions: 0,
      assessments_completed: 0,
      agent_conversations_started: 0,
      pdis_completed: 0,
    }

    current.core_actions += 1
    if (row.event_name === 'assessment_completed') current.assessments_completed += 1
    if (row.event_name === 'agent_conversation_started') current.agent_conversations_started += 1
    if (row.event_name === 'pdi_completed') current.pdis_completed += 1

    trendMap.set(weekStart, current)
  }

  const weeklyTrend = Array.from(trendMap.values()).sort((a, b) => a.week_start.localeCompare(b.week_start))

  return { users, weeklyTrend }
}
