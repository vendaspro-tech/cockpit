'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { getUserRole } from '@/lib/auth-utils'

export type NotificationSource = 'system_alert' | 'bug_report' | 'workspace_notification'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  status: 'new' | 'read' | 'archived'
  read_at?: string | null
  archived_at?: string | null
  start_date: string
  end_date: string
  created_at: string
  source: NotificationSource
}

export async function getUserNotifications(workspaceId: string): Promise<Notification[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!userData) return []

  const userRole = await getUserRole(user.id, workspaceId)

  const nowIso = new Date().toISOString()

  const [{ data: alerts }, { data: statuses }, { data: bugNotifications }, { data: workspaceNotifications }] = await Promise.all([
    supabase
      .from('system_alerts')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_alert_status')
      .select('alert_id, read_at, archived_at')
      .eq('user_id', userData.id),
    supabase
      .from('bug_report_notifications')
      .select(
        'id, title, message, type, read_at, archived_at, created_at, bug_report:bug_report_id(id, workspace_id)'
      )
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('workspace_user_notifications')
      .select('id, title, message, type, read_at, archived_at, created_at, workspace_id')
      .eq('user_id', userData.id)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
  ])

  const statusMap = new Map((statuses ?? []).map((status) => [status.alert_id, status]))

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const systemNotifications: Notification[] = (alerts ?? [])
    .filter((alert) => {
      if (alert.target_role === 'all') return true
      if (userRole === 'system_owner') return true
      if (!userRole) return false
      return alert.target_role === userRole
    })
    .map((alert) => {
      const status = statusMap.get(alert.id)
      const readAt = status?.read_at ?? null
      const archivedAt = status?.archived_at ?? null

      let notificationStatus: 'new' | 'read' | 'archived' = 'new'
      if (archivedAt) {
        notificationStatus = 'archived'
      } else if (readAt) {
        notificationStatus = new Date(readAt) < thirtyDaysAgo ? 'archived' : 'read'
      }

      return {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        type: alert.type,
        status: notificationStatus,
        read_at: readAt,
        archived_at: archivedAt,
        start_date: alert.start_date,
        end_date: alert.end_date,
        created_at: alert.created_at,
        source: 'system_alert',
      }
    })

  const bugItems: Notification[] = (bugNotifications ?? [])
    .filter((notification) => {
      const report = Array.isArray(notification.bug_report)
        ? notification.bug_report[0]
        : notification.bug_report

      return report?.workspace_id === workspaceId
    })
    .map((notification) => {
      const archivedAt = notification.archived_at ?? null
      const readAt = notification.read_at ?? null

      const status: 'new' | 'read' | 'archived' = archivedAt
        ? 'archived'
        : readAt
          ? 'read'
          : 'new'

      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        status,
        read_at: readAt,
        archived_at: archivedAt,
        start_date: notification.created_at,
        end_date: notification.created_at,
        created_at: notification.created_at,
        source: 'bug_report',
      }
    })

  const workspaceItems: Notification[] = (workspaceNotifications ?? []).map((notification) => {
    const archivedAt = notification.archived_at ?? null
    const readAt = notification.read_at ?? null

    const status: 'new' | 'read' | 'archived' = archivedAt
      ? 'archived'
      : readAt
        ? 'read'
        : 'new'

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      status,
      read_at: readAt,
      archived_at: archivedAt,
      start_date: notification.created_at,
      end_date: notification.created_at,
      created_at: notification.created_at,
      source: 'workspace_notification',
    }
  })

  return [...systemNotifications, ...bugItems, ...workspaceItems].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export async function markNotificationAsRead(
  notificationId: string,
  source: NotificationSource,
  workspaceId: string
) {
  const user = await getAuthUser()
  if (!user) return

  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!userData) return

  const nowIso = new Date().toISOString()

  if (source === 'system_alert') {
    await supabase.from('user_alert_status').upsert(
      {
        user_id: userData.id,
        alert_id: notificationId,
        read_at: nowIso,
      },
      {
        onConflict: 'user_id, alert_id',
      }
    )
  } else if (source === 'bug_report') {
    await supabase
      .from('bug_report_notifications')
      .update({ read_at: nowIso })
      .eq('id', notificationId)
      .eq('user_id', userData.id)
  } else {
    await supabase
      .from('workspace_user_notifications')
      .update({ read_at: nowIso })
      .eq('id', notificationId)
      .eq('user_id', userData.id)
  }

  revalidatePath(`/${workspaceId}/notifications`)
}

export async function archiveNotification(
  notificationId: string,
  source: NotificationSource,
  workspaceId: string
) {
  const user = await getAuthUser()
  if (!user) return

  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!userData) return

  const nowIso = new Date().toISOString()

  if (source === 'system_alert') {
    const { data: existing } = await supabase
      .from('user_alert_status')
      .select('read_at')
      .eq('user_id', userData.id)
      .eq('alert_id', notificationId)
      .maybeSingle()

    await supabase.from('user_alert_status').upsert(
      {
        user_id: userData.id,
        alert_id: notificationId,
        read_at: existing?.read_at || nowIso,
        archived_at: nowIso,
      },
      {
        onConflict: 'user_id, alert_id',
      }
    )
  } else if (source === 'bug_report') {
    const { data: existing } = await supabase
      .from('bug_report_notifications')
      .select('read_at')
      .eq('id', notificationId)
      .eq('user_id', userData.id)
      .maybeSingle()

    await supabase
      .from('bug_report_notifications')
      .update({
        read_at: existing?.read_at || nowIso,
        archived_at: nowIso,
      })
      .eq('id', notificationId)
      .eq('user_id', userData.id)
  } else {
    const { data: existing } = await supabase
      .from('workspace_user_notifications')
      .select('read_at')
      .eq('id', notificationId)
      .eq('user_id', userData.id)
      .maybeSingle()

    await supabase
      .from('workspace_user_notifications')
      .update({
        read_at: existing?.read_at || nowIso,
        archived_at: nowIso,
      })
      .eq('id', notificationId)
      .eq('user_id', userData.id)
  }

  revalidatePath(`/${workspaceId}/notifications`)
}
