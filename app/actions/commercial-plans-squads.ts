'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth-server'
import { 
  createSquad, 
  updateSquad, 
  deleteSquad, 
  addSquadMember, 
  removeSquadMember, 
  getAvailableUsersForSquad 
} from './squads'

// =====================================================
// TYPES - SIMPLIFIED
// =====================================================

export interface CreateSquadSimpleData {
  name: string
  leader_id?: string
  description?: string
  color?: string
}

export interface UpdateSquadSimpleData {
  name?: string
  leader_id?: string
  description?: string
  color?: string
}

export interface PlanSquadSimple {
  // Squad fields
  squad_id: string
  squad_name: string
  leader_id: string | null
  leader_name: string | null
  leader_email: string | null
  description: string | null
  color: string
  member_count: number
  created_at: string
  
  // Calculated from products
  share_calculated: number // Sum of product shares linked to this squad
  products: Array<{
    id: string
    name: string
    share_target: number
  }>
  
  // Members
  members: Array<{
    user_id: string
    full_name: string
    email: string
  }>
}

export interface AvailableProduct {
  id: string
  name: string
  share_target: number
  current_squad_id: string | null
  current_squad_name: string | null
}

export interface SquadKPIs {
  // Totals
  total_mqls: number
  total_sqls: number
  total_revenue: number
  total_sales: number
  
  // Averages (weighted by share)
  avg_conversion_mql_sql: number
  avg_conversion_sql_sale: number
  avg_cac: number
  avg_roas: number
  avg_roi: number
  avg_margin: number
  
  // Breakdown by product
  products_breakdown: Array<{
    product_id: string
    product_name: string
    mqls: number
    sqls: number
    revenue: number
    sales: number
    share_of_squad: number // % of this product in squad share
  }>
  
  // Timeline (last 12 months)
  monthly_data: Array<{
    month: string
    mqls: number
    sqls: number
    revenue: number
    sales: number
  }>
}


// =====================================================
// PLAN SQUADS - SIMPLIFIED MANAGEMENT
// =====================================================

/**
 * Get all squads from workspace with calculated share from products
 */
export async function getPlanSquads(planId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    // Get plan to verify access and get workspace_id
    const { data: plan } = await supabase
      .from('commercial_plans')
      .select('workspace_id, use_squads')
      .eq('id', planId)
      .single()

    if (!plan) {
      return { data: null, error: 'Plan not found' }
    }

    if (!plan.use_squads) {
      return { data: [], error: null }
    }

    // Get all squads from workspace
    const { data: squads, error: squadsError } = await supabase
      .from('squads')
      .select(`
        id,
        name,
        leader_id,
        description,
        color,
        created_at,
        leader:users!leader_id (
          id,
          full_name,
          email
        )
      `)
      .eq('workspace_id', plan.workspace_id)
      .order('name')

    if (squadsError) {
      console.error('Error fetching squads:', squadsError)
      return { data: null, error: squadsError.message }
    }

    if (!squads || squads.length === 0) {
      return { data: [], error: null }
    }

    const squadIds = squads.map(s => s.id)

    // Get members with user details for each squad
    const { data: members } = await supabase
      .from('squad_members')
      .select(`
        squad_id,
        user:users (
          id,
          full_name,
          email
        )
      `)
      .in('squad_id', squadIds)

    const memberCounts: Record<string, number> = {}
    const membersBySquad: Record<string, any[]> = {}
    
    members?.forEach(m => {
      if (!m.squad_id) return
      
      // Count members
      memberCounts[m.squad_id] = (memberCounts[m.squad_id] || 0) + 1
      
      // Accumulate member details
      if (!membersBySquad[m.squad_id]) {
        membersBySquad[m.squad_id] = []
      }
      const user = m.user as any
      if (user) {
        membersBySquad[m.squad_id].push({
          user_id: user.id,
          full_name: user.full_name || 'Unnamed',
          email: user.email
        })
      }
    })

    // Get products linked to each squad in this plan
    const { data: products } = await supabase
      .from('plan_products')
      .select(`
        squad_id,
        share_target,
        product:products (id, name)
      `)
      .eq('plan_id', planId)
      .not('squad_id', 'is', null)

    const productsBySquad: Record<string, any[]> = {}
    const shareBySquad: Record<string, number> = {}

    products?.forEach(p => {
      if (!p.squad_id) return
      
      // Accumulate products
      if (!productsBySquad[p.squad_id]) {
        productsBySquad[p.squad_id] = []
      }
      productsBySquad[p.squad_id].push({
        id: (p.product as any).id,
        name: (p.product as any).name,
        share_target: p.share_target
      })
      
      // Accumulate share
      shareBySquad[p.squad_id] = (shareBySquad[p.squad_id] || 0) + Number(p.share_target)
    })

    // Transform to PlanSquadSimple
    const result: PlanSquadSimple[] = squads.map(squad => {
      const leader = squad.leader as any

      return {
        squad_id: squad.id,
        squad_name: squad.name,
        leader_id: squad.leader_id || null,
        leader_name: leader?.full_name || null,
        leader_email: leader?.email || null,
        description: squad.description || null,
        color: squad.color || '#3b82f6',
        member_count: memberCounts[squad.id] || 0,
        created_at: squad.created_at,
        
        // Calculated
        share_calculated: shareBySquad[squad.id] || 0,
        products: productsBySquad[squad.id] || [],
        members: membersBySquad[squad.id] || []
      }
    })

    return { data: result, error: null }
  } catch (error: any) {
    console.error('Exception in getPlanSquads:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Create a new squad (no plan config needed anymore)
 */
export async function createPlanSquad(
  workspaceId: string,
  data: CreateSquadSimpleData
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Simply create squad using existing action
    const result = await createSquad(workspaceId, {
      name: data.name,
      leader_id: data.leader_id,
      description: data.description,
      color: data.color || '#3b82f6'
    })

    return result
  } catch (error: any) {
    console.error('Exception in createPlanSquad:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Update squad (simplified - just squad data)
 */
export async function updatePlanSquad(
  squadId: string,
  data: UpdateSquadSimpleData
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Simply update squad using existing action
    const result = await updateSquad(squadId, data)
    return result
  } catch (error: any) {
    console.error('Exception in updatePlanSquad:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Delete a squad (check for products first)
 */
export async function deletePlanSquad(squadId: string, planId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', success: false }
    }

    const supabase = createAdminClient()

    // Check if products are linked to this squad in this plan
    const { data: linkedProducts } = await supabase
      .from('plan_products')
      .select('id')
      .eq('plan_id', planId)
      .eq('squad_id', squadId)
      .limit(1)

    if (linkedProducts && linkedProducts.length > 0) {
      return { 
        error: 'Não é possível remover o squad. Existem produtos vinculados a ele. Desvincule os produtos primeiro.', 
        success: false 
      }
    }

    // Delete squad using existing action
    const deleteResult = await deleteSquad(squadId)
    
    if (deleteResult.error) {
      return { error: deleteResult.error, success: false }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Exception in deletePlanSquad:', error)
    return { error: 'Internal server error', success: false }
  }
}

// =====================================================
// RE-EXPORT MEMBER MANAGEMENT (unchanged)
// =====================================================

export async function addMemberToPlanSquad(squadId: string, userId: string) {
  return addSquadMember(squadId, userId)
}

export async function removeMemberFromPlanSquad(squadId: string, userId: string) {
  return removeSquadMember(squadId, userId)
}

export async function getAvailableUsersForPlan(workspaceId: string) {
  return getAvailableUsersForSquad(workspaceId)
}

export async function getWorkspaceMembersForSquadLeader(workspaceId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(`
        user:users (
          id,
          full_name,
          email
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('user(full_name)', { ascending: true })

    if (error) {
      console.error('Error fetching workspace members:', error)
      return { data: null, error: error.message }
    }

    const users = members?.map(m => (m.user as any)).filter(Boolean) || []
    return { data: users, error: null }
  } catch (error: any) {
    console.error('Exception in getWorkspaceMembersForSquadLeader:', error)
    return { data: null, error: 'Internal server error' }
  }
}

// =====================================================
// PRODUCT LINKING
// =====================================================

/**
 * Get available products for a plan (to link to squads)
 */
export async function getAvailableProducts(planId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: planProducts, error } = await supabase
      .from('plan_products')
      .select(`
        id,
        share_target,
        squad_id,
        product:products (id, name),
        squad:squads (id, name)
      `)
      .eq('plan_id', planId)
      .order('product(name)', { ascending: true })

    if (error) {
      console.error('Error fetching available products:', error)
      return { data: null, error: error.message }
    }

    const result: AvailableProduct[] = planProducts?.map(pp => ({
      id: pp.id,
      name: (pp.product as any)?.name || 'Unknown',
      share_target: pp.share_target,
      current_squad_id: pp.squad_id,
      current_squad_name: (pp.squad as any)?.name || null
    })) || []

    return { data: result, error: null }
  } catch (error: any) {
    console.error('Exception in getAvailableProducts:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Link products to a squad
 */
export async function linkProductsToSquad(
  planId: string,
  squadId: string,
  productIds: string[]
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    // Step 1: Unlink all products from this squad in this plan
    const { error: unlinkError } = await supabase
      .from('plan_products')
      .update({ squad_id: null })
      .eq('plan_id', planId)
      .eq('squad_id', squadId)

    if (unlinkError) {
      console.error('Error unlinking products:', unlinkError)
      return { success: false, error: unlinkError.message }
    }

    // Step 2: Link selected products to squad
    if (productIds.length > 0) {
      const { error: linkError } = await supabase
        .from('plan_products')
        .update({ squad_id: squadId })
        .in('id', productIds)
        .eq('plan_id', planId)

      if (linkError) {
        console.error('Error linking products:', linkError)
        return { success: false, error: linkError.message }
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Exception in linkProductsToSquad:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// =====================================================
// SQUAD KPIs CONSOLIDATION
// =====================================================

/**
 * Get consolidated KPIs for a squad (aggregated from products)
 * NOTE: This is a placeholder. Real implementation needs product_month_strategies data
 */
export async function getSquadKPIs(
  planId: string,
  squadId: string
): Promise<{ data: SquadKPIs | null, error: string | null }> {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    // Get products linked to this squad
    const { data: planProducts } = await supabase
      .from('plan_products')
      .select(`
        id,
        share_target,
        product:products (id, name)
      `)
      .eq('plan_id', planId)
      .eq('squad_id', squadId)

    if (!planProducts || planProducts.length === 0) {
      // No products, return zeros
      return {
        data: {
          total_mqls: 0,
          total_sqls: 0,
          total_revenue: 0,
          total_sales: 0,
          avg_conversion_mql_sql: 0,
          avg_conversion_sql_sale: 0,
          avg_cac: 0,
          avg_roas: 0,
          avg_roi: 0,
          avg_margin: 0,
          products_breakdown: [],
          monthly_data: []
        },
        error: null
      }
    }

    // TODO: Query product_month_strategies to get real KPIs
    // For now, return mock structure
    const totalShare = planProducts.reduce((sum, p) => sum + Number(p.share_target), 0)

    const productsBreakdown = planProducts.map(pp => ({
      product_id: (pp.product as any).id,
      product_name: (pp.product as any).name,
      mqls: 0,
      sqls: 0,
      revenue: 0,
      sales: 0,
      share_of_squad: totalShare > 0 ? (pp.share_target / totalShare) : 0
    }))

    return {
      data: {
        total_mqls: 0,
        total_sqls: 0,
        total_revenue: 0,
        total_sales: 0,
        avg_conversion_mql_sql: 0,
        avg_conversion_sql_sale: 0,
        avg_cac: 0,
        avg_roas: 0,
        avg_roi: 0,
        avg_margin: 0,
        products_breakdown: productsBreakdown,
        monthly_data: []
      },
      error: null
    }
  } catch (error: any) {
    console.error('Exception in getSquadKPIs:', error)
    return { data: null, error: 'Internal server error' }
  }
}
