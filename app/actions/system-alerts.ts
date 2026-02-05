'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/auth-server"
import { getUserRole } from "@/lib/auth-utils"

export interface SystemAlert {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  target_role: string
  start_date: string
  end_date: string
}

export async function getActiveSystemAlerts(workspaceId: string): Promise<SystemAlert[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = createAdminClient()

  const userRole = await getUserRole(user.id, workspaceId)
  if (!userRole) return []

  // 2. Fetch active alerts
  const now = new Date().toISOString()

  const { data: alerts, error } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)

  if (error) {
    console.error('❌ Error fetching system alerts:', error)
    return []
  }

  // 3. Filter by role
  // If target_role is 'all', everyone sees it.
  // If target_role matches userRole, they see it.
  
  const filteredAlerts = alerts.filter(alert => {
    if (alert.target_role === 'all') return true
    if (userRole === 'system_owner') return true
    return alert.target_role === userRole
  })

  return filteredAlerts
}
