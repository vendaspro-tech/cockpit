'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth-server'

// =====================================================
// TYPES
// =====================================================

export interface CommercialPlan {
  id: string
  workspace_id: string
  name: string
  year: number
  global_target: number
  currency: string
  use_squads: boolean
  marketing_share: number | null
  commercial_share: number | null
  days_mode: 'business' | 'calendar'
  business_days_config: Record<string, number> | null
  status: 'draft' | 'pending_approval' | 'revision' | 'approved' | 'active' | 'archived'
  created_by: string
  created_at: string
  updated_by: string | null
  updated_at: string
  approved_by: string | null
  approved_at: string | null
  internal_notes: string | null
  mentor_feedback: string | null
}

export interface PlanProduct {
  id: string
  plan_id: string
  product_id: string
  squad_id: string | null
  share_target: number
  
  // TMR Configuration
  gross_ticket: number
  payment_avista_pct: number
  payment_avista_recebimento: number
  payment_parcelado_pct: number
  payment_parcelado_recebimento: number
  payment_recorrente_pct: number
  payment_recorrente_recebimento: number
  refund_rate: number
  chargeback_rate: number
  default_rate: number
  tmr_calculated: number
  
  created_at: string
  product?: {
    id: string
    name: string
    description: string | null
  }
}

export interface MonthStrategy {
  id: string
  plan_product_id: string
  month: number
  strategy: 'perpetuo' | 'lancamento' | 'custom'
  share_month: number
  
  // Strategy parameters
  conversion_rate: number | null
  productivity_per_day: number | null
  working_days: number | null
  
  // Marketing config (per month/strategy)
  monthly_investment: number
  cpl: number
  mql_to_sql_rate: number
  
  created_at: string
}

export interface OTEConfig {
  id: string
  plan_id: string
  job_title_id: string
  seniority: 'junior' | 'pleno' | 'senior'
  base_salary: number
  commission_rate: number
  bonus_on_target: number
  productivity_per_day: number
  created_at: string
}

interface CreatePlanData {
  name: string
  year: number
  global_target: number
  use_squads?: boolean
  marketing_share?: number
  commercial_share?: number
  days_mode?: 'business' | 'calendar'
  business_days_config?: Record<string, number>
}

// =====================================================
// HELPER: Convert auth.users.id to users.id
// =====================================================

async function getUserProfileId(authUserId: string): Promise<string | null> {
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', authUserId)
    .single()
  
  return data?.id || null
}

// =====================================================
// HELPER: Check hierarchy level access
// =====================================================

async function canAccessCommercialPlans(authUserId: string, workspaceId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  console.log('[DEBUG canAccess] authUserId:', authUserId)
  
  // Convert auth.users.id to users.id
  const userId = await getUserProfileId(authUserId)
  
  console.log('[DEBUG canAccess] converted userId:', userId)
  
  if (!userId) return false
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      job_title_id,
      job_titles (
        hierarchy_level
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  console.log('[DEBUG canAccess] data:', JSON.stringify(data))
  console.log('[DEBUG canAccess] hierarchy_level:', (data?.job_titles as any)?.hierarchy_level)

  if (error || !data) {
    return false
  }
  
  const jobTitle = data.job_titles as any
  const result = jobTitle?.hierarchy_level <= 1
  
  console.log('[DEBUG canAccess] result:', result)
  
  return result
}

// =====================================================
// COMMERCIAL PLANS CRUD
// =====================================================

export async function createCommercialPlan(workspaceId: string, data: CreatePlanData) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    console.log('[DEBUG createPlan] user.id (auth):', user.id)
    console.log('[DEBUG createPlan] workspaceId:', workspaceId)

    // Check hierarchy level
    const hasAccess = await canAccessCommercialPlans(user.id, workspaceId)
    
    console.log('[DEBUG createPlan] hasAccess result:', hasAccess)
    
    if (!hasAccess) {
      return { error: 'Apenas cargos estratégicos e táticos podem criar planos comerciais', data: null }
    }

    // Get users.id for foreign key constraints
    const userId = await getUserProfileId(user.id)
    if (!userId) {
      return { error: 'User profile not found', data: null }
    }

    const supabase = createAdminClient()

    const { data: plan, error } = await supabase
      .from('commercial_plans')
      .insert({
        workspace_id: workspaceId,
        name: data.name,
        year: data.year,
        global_target: data.global_target,
        use_squads: data.use_squads ?? false,
        marketing_share: data.marketing_share,
        commercial_share: data.commercial_share,
        days_mode: data.days_mode ?? 'business',
        business_days_config: data.business_days_config ?? {
          jan: 22, feb: 20, mar: 21, apr: 22, may: 22, jun: 21,
          jul: 23, aug: 22, sep: 22, oct: 23, nov: 20, dec: 20
        },
        created_by: userId,  // Use users.id
        updated_by: userId,  // Use users.id
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating commercial plan:', error)
      return { error: error.message, data: null }
    }

    return { data: plan, error: null }
  } catch (error: any) {
    console.error('Error in createCommercialPlan:', error)
    return { error: error.message, data: null }
  }
}

export async function getCommercialPlan(planId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const supabase = createAdminClient()

    const { data: plan, error } = await supabase
      .from('commercial_plans')
      .select(`
        *,
        workspace:workspaces(id, name)
      `)
      .eq('id', planId)
      .single()

    if (error) {
      console.error('Error getting commercial plan:', error)
      return { error: error.message, data: null }
    }

    // Check access - convert auth.users.id to users.id
    const hasAccess = await canAccessCommercialPlans(user.id, plan.workspace_id)
    if (!hasAccess) {
      return { error: 'Access denied', data: null }
    }

    return { data: plan, error: null }
  } catch (error: any) {
    console.error('Error in getCommercialPlan:', error)
    return { error: error.message, data: null }
  }
}

export async function getWorkspaceCommercialPlans(workspaceId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const hasAccess = await canAccessCommercialPlans(user.id, workspaceId)
    
    if (!hasAccess) {
      return { error: 'Access denied', data: null }
    }

    const supabase = createAdminClient()

    const { data: plans, error } = await supabase
      .from('commercial_plans')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting workspace commercial plans:', error)
      return { error: error.message, data: null }
    }

    return { data: plans, error: null }
  } catch (error: any) {
    console.error('Error in getWorkspaceCommercialPlans:', error)
    return { error: error.message, data: null }
  }
}

export async function updateCommercialPlan(planId: string, updates: Partial<CreatePlanData>) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const supabase = createAdminClient()

    // Get plan to check workspace
    const { data: existingPlan } = await supabase
      .from('commercial_plans')
      .select('workspace_id')
      .eq('id', planId)
      .single()

    if (!existingPlan) {
      return { error: 'Plan not found', data: null }
    }

    const hasAccess = await canAccessCommercialPlans(user.id, existingPlan.workspace_id)
    if (!hasAccess) {
      return { error: 'Access denied', data: null }
    }

    // Get users.id for foreign key constraint
    const userId = await getUserProfileId(user.id)
    if (!userId) {
      return { error: 'User profile not found', data: null }
    }

    const { data: plan, error } = await supabase
      .from('commercial_plans')
      .update({
        ...updates,
        updated_by: userId,  // Use users.id, not auth.users.id
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      console.error('Error updating commercial plan:', error)
      return { error: error.message, data: null }
    }

    return { data: plan, error: null }
  } catch (error: any) {
    console.error('Error in updateCommercialPlan:', error)
    return { error: error.message, data: null }
  }
}

export async function deleteCommercialPlan(planId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', success: false }
    }

    const supabase = createAdminClient()

    // Get plan to check workspace and hierarchy
    const { data: existingPlan } = await supabase
      .from('commercial_plans')
      .select('workspace_id')
      .eq('id', planId)
      .single()

    if (!existingPlan) {
      return { error: 'Plan not found', success: false }
    }

    // Only hierarchy_level 0 can delete
    const { data: member } = await supabase
      .from('workspace_members')
      .select(`
        job_titles (hierarchy_level)
      `)
      .eq('workspace_id', existingPlan.workspace_id)
      .eq('user_id', user.id)
      .single()

    const jobTitle = (member as any)?.job_titles
    if (!jobTitle || jobTitle.hierarchy_level !== 0) {
      return { error: 'Apenas nível estratégico pode deletar planos', success: false }
    }

    const { error } = await supabase
      .from('commercial_plans')
      .delete()
      .eq('id', planId)

    if (error) {
      console.error('Error deleting commercial plan:', error)
      return { error: error.message, success: false }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error in deleteCommercialPlan:', error)
    return { error: error.message, success: false }
  }
}

// =====================================================
// PLAN PRODUCTS
// =====================================================

interface AddProductData {
  product_id: string
  squad_id?: string
  share_target: number
  gross_ticket: number
  
  // TMR fields
  payment_avista_pct?: number
  payment_avista_recebimento?: number
  payment_parcelado_pct?: number
  payment_parcelado_recebimento?: number
  payment_recorrente_pct?: number
  payment_recorrente_recebimento?: number
  refund_rate?: number
  chargeback_rate?: number
  default_rate?: number
}

export async function addProductToPlan(planId: string, data: AddProductData) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const supabase = createAdminClient()

    const { data: planProduct, error } = await supabase
      .from('plan_products')
      .insert({
        plan_id: planId,
        product_id: data.product_id,
        squad_id: data.squad_id,
        share_target: data.share_target,
        gross_ticket: data.gross_ticket,
        
        // TMR defaults
        payment_avista_pct: data.payment_avista_pct ?? 0.40,
        payment_avista_recebimento: data.payment_avista_recebimento ?? 1.0,
        payment_parcelado_pct: data.payment_parcelado_pct ?? 0.50,
        payment_parcelado_recebimento: data.payment_parcelado_recebimento ?? 0.85,
        payment_recorrente_pct: data.payment_recorrente_pct ?? 0.10,
        payment_recorrente_recebimento: data.payment_recorrente_recebimento ?? 1.0,
        refund_rate: data.refund_rate ?? 0.05,
        chargeback_rate: data.chargeback_rate ?? 0.02,
        default_rate: data.default_rate ?? 0.03
      })
      .select(`
        *,
        product:products(id, name, description)
      `)
      .single()

    if (error) {
      console.error('Error adding product to plan:', error)
      return { error: error.message, data: null }
    }

    return { data: planProduct, error: null }
  } catch (error: any) {
    console.error('Error in addProductToPlan:', error)
    return { error: error.message, data: null }
  }
}

export async function getPlanProducts(planId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_products')
      .select(`
        *,
        product:products(id, name, description, standard_price),
        squad:squads(id, name)
      `)
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error getting plan products:', error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getPlanProducts:', error)
    return { error: error.message, data: null }
  }
}

export async function updatePlanProduct(planProductId: string, updates: Partial<AddProductData>) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_products')
      .update(updates)
      .eq('id', planProductId)
      .select()
      .single()

    if (error) {
      console.error('Error updating plan product:', error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updatePlanProduct:', error)
    return { error: error.message, data: null }
  }
}

export async function removePlanProduct(planProductId: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('plan_products')
      .delete()
      .eq('id', planProductId)

    if (error) {
      console.error('Error removing plan product:', error)
      return { error: error.message, success: false }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error in removePlanProduct:', error)
    return { error: error.message, success: false }
  }
}

// =====================================================
// MONTH STRATEGIES (Key feature!)
// =====================================================

interface AddStrategyData {
  month: number
  strategy: 'perpetuo' | 'lancamento' | 'custom'
  share_month: number
  conversion_rate?: number
  productivity_per_day?: number
  working_days?: number
  
  // Marketing fields
  monthly_investment?: number
  cpl?: number
  mql_to_sql_rate?: number
}

export async function addMonthStrategy(planProductId: string, data: AddStrategyData) {
  try {
    const supabase = createAdminClient()

    // Validate share doesn't exceed 100%
    const { data: existing } = await supabase
      .from('plan_product_month_strategies')
      .select('share_month')
      .eq('plan_product_id', planProductId)
      .eq('month', data.month)

    const currentTotal = existing?.reduce((sum, s) => sum + Number(s.share_month), 0) ?? 0
    if (currentTotal + data.share_month > 1.0) {
      return { 
        error: `Share total would be ${((currentTotal + data.share_month) * 100).toFixed(0)}%. Must be <= 100%`, 
        data: null 
      }
    }

    const { data: strategy, error } = await supabase
      .from('plan_product_month_strategies')
      .insert({
        plan_product_id: planProductId,
        month: data.month,
        strategy: data.strategy,
        share_month: data.share_month,
        conversion_rate: data.conversion_rate,
        productivity_per_day: data.productivity_per_day,
        working_days: data.working_days,
        
        // Marketing fields
        monthly_investment: data.monthly_investment ?? 0,
        cpl: data.cpl ?? 10,
        mql_to_sql_rate: data.mql_to_sql_rate ?? 0.25
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding month strategy:', error)
      return { error: error.message, data: null }
    }

    return { data: strategy, error: null }
  } catch (error: any) {
    console.error('Error in addMonthStrategy:', error)
    return { error: error.message, data: null }
  }
}

export async function getMonthStrategies(planProductId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_product_month_strategies')
      .select('*')
      .eq('plan_product_id', planProductId)
      .order('month', { ascending: true })
      .order('strategy', { ascending: true })

    if (error) {
      console.error('Error getting month strategies:', error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getMonthStrategies:', error)
    return { error: error.message, data: null }
  }
}

export async function updateMonthStrategy(strategyId: string, updates: Partial<AddStrategyData>) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_product_month_strategies')
      .update(updates)
      .eq('id', strategyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating month strategy:', error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updateMonthStrategy:', error)
    return { error: error.message, data: null }
  }
}

export async function removeMonthStrategy(strategyId: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('plan_product_month_strategies')
      .delete()
      .eq('id', strategyId)

    if (error) {
      console.error('Error removing month strategy:', error)
      return { error: error.message, success: false }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error in removeMonthStrategy:', error)
    return { error: error.message, success: false }
  }
}

// =====================================================
// OTE CONFIGURATIONS
// =====================================================

export async function getOTEConfigurations(planId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_ote_configurations')
      .select('*')
      .eq('plan_id', planId)
      .order('job_title_id', { ascending: true })

    if (error) {
      console.error('Error fetching OTE configurations:', error)
      return { data: null, error: error.message }
    }

    return { data: data as OTEConfig[], error: null }
  } catch (error: any) {
    console.error('Error in getOTEConfigurations:', error)
    return { data: null, error: error.message }
  }
}

export async function configureOTE(
  planId: string,
 config: {
    job_title_id: string
    seniority: 'junior' | 'pleno' | 'senior'
    base_salary: number
    commission_rate: number
    bonus_on_target: number
    productivity_per_day: number
  }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const supabase = createAdminClient()

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('plan_ote_configurations')
      .upsert({
        plan_id: planId,
        ...config
      }, {
        onConflict: 'plan_id,job_title_id,seniority'
      })
      .select()
      .single()

    if (error) {
      console.error('Error configuring OTE:', error)
      return { error: error.message, data: null }
    }

    return { data: data as OTEConfig, error: null }
  } catch (error: any) {
    console.error('Error in configureOTE:', error)
    return { error: error.message, data: null }
  }
}

export async function deleteOTEConfig(configId: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('plan_ote_configurations')
      .delete()
      .eq('id', configId)

    if (error) {
      console.error('Error deleting OTE config:', error)
      return { error: error.message, success: false }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error in deleteOTEConfig:', error)
    return { error: error.message, success: false }
  }
}

// =====================================================
// TEAM STRUCTURE
// =====================================================

export interface TeamStructure {
  id: string
  plan_id: string
  seller_per_supervisor: number
  supervisor_per_coordinator: number
  seniority_distribution: Record<string, Record<string, number>>
  created_at: string
}

export async function getTeamStructure(planId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_team_structure')
      .select('*')
      .eq('plan_id', planId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching team structure:', error)
      return { data: null, error: error.message }
    }

    return { data: data as TeamStructure | null, error: null }
  } catch (error: any) {
    console.error('Error in getTeamStructure:', error)
    return { data: null, error: error.message }
  }
}

export async function updateTeamStructure(
  planId: string,
  config: {
    seller_per_supervisor: number
    supervisor_per_coordinator: number
    seniority_distribution: Record<string, Record<string, number>>
  }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const supabase = createAdminClient()

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('plan_team_structure')
      .upsert({
        plan_id: planId,
        ...config
      }, {
        onConflict: 'plan_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating team structure:', error)
      return { error: error.message, data: null }
    }

    return { data: data as TeamStructure, error: null }
  } catch (error: any) {
    console.error('Error in updateTeamStructure:', error)
    return { error: error.message, data: null }
  }
}

// =====================================================
// MARKETING CONFIGURATION
// =====================================================

export interface MarketingConfig {
  id: string
  plan_id: string
  monthly_investment: number
  cpl: number
  mql_to_sql_rate: number
  expected_roas: number
  created_at: string
}

export async function getMarketingConfig(planId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('plan_marketing_config')
      .select('*')
      .eq('plan_id', planId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching marketing config:', error)
      return { data: null, error: error.message }
    }

    return { data: data as MarketingConfig | null, error: null }
  } catch (error: any) {
    console.error('Error in getMarketingConfig:', error)
    return { data: null, error: error.message }
  }
}

export async function updateMarketingConfig(
  planId: string,
  config: {
    monthly_investment: number
    cpl: number
    mql_to_sql_rate: number
    expected_roas: number
  }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized', data: null }
    }

    const supabase = createAdminClient()

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('plan_marketing_config')
      .upsert({
        plan_id: planId,
        ...config
      }, {
        onConflict: 'plan_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating marketing config:', error)
      return { error: error.message, data: null }
    }

    return { data: data as MarketingConfig, error: null }
  } catch (error: any) {
    console.error('Error in updateMarketingConfig:', error)
    return { error: error.message, data: null }
  }
}

// =====================================================
// JOB TITLES (for OTE)
// =====================================================

export interface JobTitleData {
  id: string
  name: string
  hierarchy_level: number
  base_salary_junior: number | null
  base_salary_pleno: number | null
  base_salary_senior: number | null
}

export async function getJobTitles() {
  try {
    const supabase = createAdminClient()

    // Job titles are GLOBAL (workspace_id IS NULL) - created only in admin route
    const { data, error } = await supabase
      .from('job_titles')
      .select('id, name, hierarchy_level, base_salary_junior, base_salary_pleno, base_salary_senior')
      .is('workspace_id', null)
      .order('hierarchy_level', { ascending: false })

    if (error) {
      console.error('Error fetching job titles:', error)
      return { data: null, error: error.message }
    }

    return { data: data as JobTitleData[], error: null }
  } catch (error: any) {
    console.error('Error in getJobTitles:', error)
    return { data: null, error: error.message }
  }
}
