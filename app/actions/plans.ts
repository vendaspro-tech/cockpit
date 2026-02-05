'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getUserRole } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getWorkspacePlanUsage(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) {
    return {
      planName: 'Unknown',
      maxUsers: null,
      maxProducts: null,
      currentUsers: 0,
      currentProducts: 0,
      features: {}
    }
  }

  // Verify membership to ensure security since we'll use admin client
  const role = await getUserRole(user.id, workspaceId)
  if (!role) {
    return {
      planName: 'Unknown',
      maxUsers: null,
      maxProducts: null,
      currentUsers: 0,
      currentProducts: 0,
      features: {}
    }
  }

  const supabase = createAdminClient()

  // Get workspace plan details
  const { data: workspace } = await supabase
    .from('workspaces')
    .select(`
      *,
      plan:plans(*)
    `)
    .eq('id', workspaceId)
    .single()

  console.log('getWorkspacePlanUsage', { workspaceId, workspace })

  if (!workspace || !workspace.plan) {
    // If no plan found, return null limits (unlimited)
    // This prevents blocking invitations when plan setup is incomplete
    return {
      planName: 'Free',
      maxUsers: null,
      maxProducts: null,
      currentUsers: 0,
      currentProducts: 0,
      features: {}
    }
  }

  // Get current usage
  const { count: usersCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  console.log('getWorkspacePlanUsage result', { usersCount, productsCount })

  return {
    planName: workspace.plan.name,
    planId: workspace.plan.id,
    maxUsers: workspace.plan.max_users,
    maxProducts: workspace.plan.max_products,
    currentUsers: usersCount || 0,
    currentProducts: productsCount || 0,
    features: workspace.plan.features || {}
  }
}

export async function getAvailablePlans() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('active', true)
    .order('price_monthly', { ascending: true })

  if (error) {
    console.error('Error fetching plans:', error)
    return []
  }

  return data
}

export async function upgradeWorkspacePlan(workspaceId: string, planId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const role = await getUserRole(user.id, workspaceId)
  const canUpdate = role === 'system_owner' || role === 'owner' || role === 'admin'
  
  if (!canUpdate) {
    return { error: 'Permissão insuficiente para alterar o plano' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('workspaces')
    .update({ plan_id: planId })
    .eq('id', workspaceId)

  if (error) {
    console.error('Error updating plan:', error)
    return { error: 'Erro ao atualizar plano' }
  }

  revalidatePath(`/${workspaceId}/settings/billing`)
  return { success: true }
}
