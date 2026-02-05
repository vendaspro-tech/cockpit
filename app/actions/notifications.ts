'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { SystemAlert } from "./system-alerts"
import { getAuthUser } from "@/lib/auth-server"

export interface Notification extends SystemAlert {
  status: 'new' | 'read' | 'archived'
  read_at?: string | null
  archived_at?: string | null
}

export async function getUserNotifications(workspaceId: string): Promise<Notification[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = createAdminClient()

  // 1. Get User DB ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!userData) return []

  // 2. Get User Role
  const { data: memberData } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userData.id)
    .single()

  const userRole = memberData?.role

  // 3. Fetch Active Alerts
  const now = new Date().toISOString()
  const { data: alerts } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false })

  if (!alerts) return []

  // 4. Filter by Role
  const relevantAlerts = alerts.filter(alert => {
    if (alert.target_role === 'all') return true
    if (!userRole) return false
    return alert.target_role === userRole
  })

  // 5. Fetch User Status
  const { data: statuses } = await supabase
    .from('user_alert_status')
    .select('alert_id, read_at, archived_at')
    .eq('user_id', userData.id)

  const statusMap = new Map(statuses?.map(s => [s.alert_id, s]) || [])

  // 6. Merge and Categorize
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return relevantAlerts.map(alert => {
    const status = statusMap.get(alert.id)
    const readAt = status?.read_at
    const archivedAt = status?.archived_at

    let notificationStatus: 'new' | 'read' | 'archived' = 'new'

    if (archivedAt) {
      notificationStatus = 'archived'
    } else if (readAt) {
      const readDate = new Date(readAt)
      if (readDate < thirtyDaysAgo) {
        notificationStatus = 'archived'
      } else {
        notificationStatus = 'read'
      }
    }

    return {
      ...alert,
      status: notificationStatus,
      read_at: readAt,
      archived_at: archivedAt
    }
  })
}

export async function markNotificationAsRead(alertId: string) {
  const user = await getAuthUser()
  if (!user) return

  const supabase = createAdminClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!userData) return

  const now = new Date().toISOString()

  // Upsert status
  await supabase
    .from('user_alert_status')
    .upsert({
      user_id: userData.id,
      alert_id: alertId,
      read_at: now
    }, {
      onConflict: 'user_id, alert_id'
    })

  revalidatePath('/[workspaceId]/notifications', 'page')
}

export async function archiveNotification(alertId: string) {
  const user = await getAuthUser()
  if (!user) return

  const supabase = createAdminClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!userData) return

  const now = new Date().toISOString()

  // Upsert status (preserve read_at if exists, or set it if not)
  // Actually, upsert replaces unless we select first.
  // But we can just update if exists, or insert.
  // Or use upsert with ignoreDuplicates? No.
  // We want to set archived_at.
  // If we just upsert archived_at, we might lose read_at if we don't include it.
  // So we should fetch first or use a smarter query.
  // Supabase upsert replaces the row.
  
  // Let's fetch existing first to be safe and simple.
  const { data: existing } = await supabase
    .from('user_alert_status')
    .select('*')
    .eq('user_id', userData.id)
    .eq('alert_id', alertId)
    .single()

  await supabase
    .from('user_alert_status')
    .upsert({
      user_id: userData.id,
      alert_id: alertId,
      read_at: existing?.read_at || now, // If archiving, it's implicitly read
      archived_at: now
    }, {
      onConflict: 'user_id, alert_id'
    })

  revalidatePath('/[workspaceId]/notifications', 'page')
}
