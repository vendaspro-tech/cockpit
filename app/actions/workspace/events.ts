'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/auth-server"

export async function getWorkspaceEvents(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = createAdminClient()

  // 1. Get Internal User ID
  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (userError || !dbUser) {
    console.error('Error fetching user:', userError)
    return []
  }

  // 2. Get User's Profile in this Workspace
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('role, access_level')
    .eq('workspace_id', workspaceId)
    .eq('user_id', dbUser.id)
    .single()

  if (memberError || !member) {
    console.error('Error fetching member:', memberError)
    return []
  }

  // 2. Get Workspace's Plan
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('plan_id')
    .eq('id', workspaceId)
    .single()

  if (workspaceError || !workspace) {
    console.error('Error fetching workspace plan:', workspaceError)
    return []
  }

  // Alguns workspaces antigos podem não ter plan_id definido; nesse caso apenas não mostramos eventos
  if (!workspace.plan_id) {
    return []
  }

  // 3. Fetch Events
  // Logic: Event must belong to the Workspace's Plan
  // AND (Event has NO target profiles OR Event targets User's Profile)
  
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      *,
      event_plans (
        plan_id,
        plans (
          id,
          name,
          color
        )
      ),
      event_categories: event_categories!events_category_id_fkey (id, name, color),
      event_instructors: event_instructors!events_instructor_id_fkey (id, name, email, title)
    `)
    .order('start_time', { ascending: true })

  if (eventsError) {
    console.error('Error fetching events:', eventsError)
    return []
  }

  type EventPlanJoin = {
    plan_id: string
    plans?: { id: string; name: string; color: string | null } | null
  }
  type EventRow = {
    event_plans?: EventPlanJoin[] | null
    target_profiles?: string[] | null
    event_categories?: { name: string | null; color: string | null } | null
    event_instructors?: { name: string | null } | null
    category?: string | null
    instructor_name?: string | null
  } & Record<string, unknown>

  const userProfile = member.role
  const eventRows = (events ?? []) as EventRow[]

  return eventRows
    // filter by plan via event_plans
    .filter((event) => {
      const planIds = (event.event_plans || []).map((p) => p.plan_id)
      return planIds.includes(workspace.plan_id)
    })
    // filter by profile
    .filter((event) => {
      const targets = event.target_profiles || []
      if (targets.length === 0) return true
      return targets.includes(userProfile)
    })
    .map((event) => ({
      ...event,
      plan_ids: (event.event_plans || []).map((p) => p.plan_id),
      plans: (event.event_plans || [])
        .map((p) => p.plans)
        .filter(Boolean),
      category: event.event_categories?.name || event.category,
      category_color: event.event_categories?.color,
      instructor_name: event.event_instructors?.name || event.instructor_name
    }))
}
