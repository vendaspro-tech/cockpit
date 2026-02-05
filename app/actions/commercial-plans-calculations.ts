'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { PlanProduct, MonthStrategy } from './commercial-plans'

// =====================================================
// TYPES
// =====================================================

export interface ProductMonthKPIs {
  month: number
  month_name: string
  
  // Funil
  mqls: number
  sqls: number
  conversion_mql_sql: number
  vendas: number
  conversion_sql_venda: number
  
  // Financeiro
  revenue: number
  investment: number
  cac: number
  roas: number
  roi: number
  margem_contribuicao: number
}

export interface ProductAnnualKPIs {
  product_id: string
  product_name: string
  
  // Totais anuais
  total_mqls: number
  total_sqls: number
  total_vendas: number
  total_revenue: number
  total_investment: number
  
  // Médias
  avg_cac: number
  avg_roas: number
  avg_roi: number
  total_margem: number
  
  // Por mês
  monthly_breakdown: ProductMonthKPIs[]
}

interface StrategyCalculation {
  strategy: string
  share_month: number
  conversion_rate: number
  sqls_allocated: number
  vendas: number
  revenue: number
}

// =====================================================
// MONTH NAMES
// =====================================================

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

// =====================================================
// CORE CALCULATION FUNCTIONS
// =====================================================

/**
 * Calcula KPIs para um produto em um mês específico
 * Usa a configuração de marketing agregada das estratégias do mês
 */
function calculateProductMonthKPIs(
  planProduct: PlanProduct,
  month: number,
  monthStrategies: MonthStrategy[]
): ProductMonthKPIs {
  
  // If no strategies, return zeros
  if (monthStrategies.length === 0) {
    return {
      month,
      month_name: MONTH_NAMES[month - 1],
      mqls: 0,
      sqls: 0,
      conversion_mql_sql: 0,
      vendas: 0,
      conversion_sql_venda: 0,
      revenue: 0,
      investment: 0,
      cac: 0,
      roas: 0,
      roi: 0,
      margem_contribuicao: 0
    }
  }
  
  // 1. Aggregate investment from all strategies in the month
  const investment = monthStrategies.reduce((sum, s) => sum + (s.monthly_investment || 0), 0)
  
  // 2. Calculate weighted average CPL (based on investment share)
  let weightedCPL = 0
  if (investment > 0) {
    weightedCPL = monthStrategies.reduce((sum, s) => {
      const stratInvestment = s.monthly_investment || 0
      const stratCPL = s.cpl || 10
      return sum + (stratCPL * (stratInvestment / investment))
    }, 0)
  }
  
  // 3. MQLs gerados pelo investimento total
  const mqls = weightedCPL > 0 ? investment / weightedCPL : 0
  
  // 4. Calculate weighted average MQL→SQL rate (based on investment share)
  let weightedMQLtoSQL = 0
  if (investment > 0) {
    weightedMQLtoSQL = monthStrategies.reduce((sum, s) => {
      const stratInvestment = s.monthly_investment || 0
      const stratRate = s.mql_to_sql_rate || 0.25
      return sum + (stratRate * (stratInvestment / investment))
    }, 0)
  }
  
  // 5. SQLs (conversão MQL → SQL)
  const sqls = mqls * weightedMQLtoSQL
  const conversion_mql_sql = weightedMQLtoSQL
  
  // 6. Calcular vendas por estratégia
  const strategyCalculations: StrategyCalculation[] = monthStrategies.map(strategy => {
    // SQLs alocados para esta estratégia baseado no share
    const sqls_allocated = sqls * strategy.share_month
    
    // Taxa de conversão SQL → Venda (usa custom se definido, senão usa default)
    const conversion_rate = strategy.conversion_rate ?? getDefaultConversionRate(strategy.strategy)
    
    // Vendas desta estratégia
    const vendas = sqls_allocated * conversion_rate
    
    // Revenue desta estratégia
    const revenue = vendas * planProduct.tmr_calculated
    
    return {
      strategy: strategy.strategy,
      share_month: strategy.share_month,
      conversion_rate,
      sqls_allocated,
      vendas,
      revenue
    }
  })
  
  // 7. Agregar vendas e revenue de todas as estratégias
  const total_vendas = strategyCalculations.reduce((sum, s) => sum + s.vendas, 0)
  const total_revenue = strategyCalculations.reduce((sum, s) => sum + s.revenue, 0)
  
  // 8. Calcular conversão média SQL → Venda (ponderada pelo share)
  const conversion_sql_venda = sqls > 0 ? total_vendas / sqls : 0
  
  // 9. Métricas financeiras
  const cac = total_vendas > 0 ? investment / total_vendas : 0
  const roas = investment > 0 ? total_revenue / investment : 0
  const roi = investment > 0 ? ((total_revenue - investment) / investment) * 100 : 0
  const margem_contribuicao = total_revenue - investment
  
  return {
    month,
    month_name: MONTH_NAMES[month - 1],
    mqls: Math.round(mqls),
    sqls: Math.round(sqls),
    conversion_mql_sql,
    vendas: Math.round(total_vendas),
    conversion_sql_venda,
    revenue: total_revenue,
    investment,
    cac,
    roas,
    roi,
    margem_contribuicao
  }
}

/**
 * Retorna taxa de conversão padrão por tipo de estratégia
 */
function getDefaultConversionRate(strategy: string): number {
  switch (strategy) {
    case 'perpetuo':
      return 0.06 // 6%
    case 'lancamento':
      return 0.15 // 15%
    case 'custom':
      return 0.08 // 8% default
    default:
      return 0.06
  }
}

/**
 * Calcula KPIs anuais agregados de um produto
 */
function calculateProductAnnualKPIs(
  planProduct: PlanProduct,
  allStrategies: MonthStrategy[]
): ProductAnnualKPIs {
  
  // Agrupar estratégias por mês
  const strategiesByMonth = new Map<number, MonthStrategy[]>()
  for (let month = 1; month <= 12; month++) {
    const monthStrats = allStrategies.filter(s => s.month === month)
    strategiesByMonth.set(month, monthStrats)
  }
  
  // Calcular KPIs para cada mês
  const monthly_breakdown: ProductMonthKPIs[] = []
  for (let month = 1; month <= 12; month++) {
    const monthStrats = strategiesByMonth.get(month) || []
    
    // Se não tem estratégias no mês, considera valores zero
    if (monthStrats.length === 0) {
      monthly_breakdown.push({
        month,
        month_name: MONTH_NAMES[month - 1],
        mqls: 0,
        sqls: 0,
        conversion_mql_sql: 0,
        vendas: 0,
        conversion_sql_venda: 0,
        revenue: 0,
        investment: 0,
        cac: 0,
        roas: 0,
        roi: 0,
        margem_contribuicao: 0
      })
    } else {
      const monthKPIs = calculateProductMonthKPIs(
        planProduct,
        month,
        monthStrats
      )
      monthly_breakdown.push(monthKPIs)
    }
  }
  
  // Agregar totais anuais
  const total_mqls = monthly_breakdown.reduce((sum, m) => sum + m.mqls, 0)
  const total_sqls = monthly_breakdown.reduce((sum, m) => sum + m.sqls, 0)
  const total_vendas = monthly_breakdown.reduce((sum, m) => sum + m.vendas, 0)
  const total_revenue = monthly_breakdown.reduce((sum, m) => sum + m.revenue, 0)
  const total_investment = monthly_breakdown.reduce((sum, m) => sum + m.investment, 0)
  const total_margem = monthly_breakdown.reduce((sum, m) => sum + m.margem_contribuicao, 0)
  
  // Calcular médias
  const avg_cac = total_vendas > 0 ? total_investment / total_vendas : 0
  const avg_roas = total_investment > 0 ? total_revenue / total_investment : 0
  const avg_roi = total_investment > 0 ? ((total_revenue - total_investment) / total_investment) * 100 : 0
  
  const productInfo = planProduct.product as any
  
  return {
    product_id: planProduct.id,
    product_name: productInfo?.name || 'Produto',
    total_mqls,
    total_sqls,
    total_vendas,
    total_revenue,
    total_investment,
    avg_cac,
    avg_roas,
    avg_roi,
    total_margem,
    monthly_breakdown
  }
}

// =====================================================
// SERVER ACTIONS
// =====================================================



/**
 * Calcula KPIs anuais de um produto específico
 */
export async function getProductAnnualKPIs(planProductId: string): Promise<ProductAnnualKPIs | null> {
  try {
    const supabase = createAdminClient()
    
    // Buscar produto do plano
    const { data: planProduct, error: productError } = await supabase
      .from('plan_products')
      .select(`
        *,
        product:products(id, name, description)
      `)
      .eq('id', planProductId)
      .single()
    
    if (productError || !planProduct) {
      console.error('Error fetching plan product:', productError)
      return null
    }
    
    // Buscar todas as estratégias do produto
    const { data: strategies, error: strategiesError } = await supabase
      .from('plan_product_month_strategies')
      .select('*')
      .eq('plan_product_id', planProductId)
      .order('month', { ascending: true })
    
    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return null
    }
    
    // Check if product has any strategies with marketing config
    const hasMarketingConfig = strategies && strategies.length > 0 && 
      strategies.some(s => s.monthly_investment > 0 || s.cpl > 0)
    
    if (!hasMarketingConfig) {
      // Sem config de marketing, retornar zeros
      return {
        product_id: planProduct.id,
        product_name: (planProduct.product as any)?.name || 'Produto',
        total_mqls: 0,
        total_sqls: 0,
        total_vendas: 0,
        total_revenue: 0,
        total_investment: 0,
        avg_cac: 0,
        avg_roas: 0,
        avg_roi: 0,
        total_margem: 0,
        monthly_breakdown: []
      }
    }
    
    // Calcular KPIs usando config do próprio produto
    const kpis = calculateProductAnnualKPIs(
      planProduct as PlanProduct,
      strategies as MonthStrategy[] || []
    )
    
    return kpis
  } catch (error: any) {
    console.error('Error in getProductAnnualKPIs:', error)
    return null
  }
}

/**
 * Recalcula todos os produtos de um plano
 */
export async function recalculatePlanProducts(planId: string): Promise<{
  success: boolean
  results: ProductAnnualKPIs[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()
    
    // Buscar todos os produtos do plano
    const { data: planProducts, error: productsError } = await supabase
      .from('plan_products')
      .select('id')
      .eq('plan_id', planId)
    
    if (productsError || !planProducts) {
      return {
        success: false,
        results: [],
        error: 'Failed to fetch plan products'
      }
    }
    
    // Calcular KPIs para cada produto
    const results: ProductAnnualKPIs[] = []
    for (const product of planProducts) {
      const kpis = await getProductAnnualKPIs(product.id)
      if (kpis) {
        results.push(kpis)
      }
    }
    
    return {
      success: true,
      results
    }
  } catch (error: any) {
    console.error('Error in recalculatePlanProducts:', error)
    return {
      success: false,
      results: [],
      error: error.message
    }
  }
}

/**
 * Valida se a soma dos shares dos produtos não excede 100%
 */
export async function validateProductShares(
  planId: string,
  newShare: number,
  excludeProductId?: string
): Promise<{
  valid: boolean
  currentTotal: number
  wouldExceed: boolean
}> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('plan_products')
      .select('share_target')
      .eq('plan_id', planId)
    
    // Excluir produto se estamos editando (não adicionar o share atual)
    if (excludeProductId) {
      query = query.neq('id', excludeProductId)
    }
    
    const { data: products, error } = await query
    
    if (error) {
      console.error('Error validating shares:', error)
      return { valid: false, currentTotal: 0, wouldExceed: false }
    }
    
    const currentTotal = products?.reduce((sum, p) => sum + Number(p.share_target), 0) || 0
    const newTotal = currentTotal + newShare
    
    return {
      valid: newTotal <= 1.0,
      currentTotal,
      wouldExceed: newTotal > 1.0
    }
  } catch (error: any) {
    console.error('Error in validateProductShares:', error)
    return { valid: false, currentTotal: 0, wouldExceed: false }
  }
}

/**
 * Valida se a soma dos shares das estratégias de um mês é 100%
 */
export async function validateMonthStrategyShares(
  planProductId: string,
  month: number,
  excludeStrategyId?: string
): Promise<{
  valid: boolean
  currentTotal: number
  missing: number
}> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('plan_product_month_strategies')
      .select('share_month')
      .eq('plan_product_id', planProductId)
      .eq('month', month)
    
    if (excludeStrategyId) {
      query = query.neq('id', excludeStrategyId)
    }
    
    const { data: strategies, error } = await query
    
    if (error) {
      console.error('Error validating month shares:', error)
      return { valid: false, currentTotal: 0, missing: 1.0 }
    }
    
    const currentTotal = strategies?.reduce((sum, s) => sum + Number(s.share_month), 0) || 0
    const missing = 1.0 - currentTotal
    
    return {
      valid: Math.abs(missing) < 0.001, // Tolerância para float
      currentTotal,
      missing
    }
  } catch (error: any) {
    console.error('Error in validateMonthStrategyShares:', error)
    return { valid: false, currentTotal: 0, missing: 1.0 }
  }
}
