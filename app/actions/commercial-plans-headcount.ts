// =====================================================
// TEAM HEADCOUNT CALCULATIONS
// =====================================================

import { createAdminClient } from '@/lib/supabase/admin'
import type { MonthStrategy, PlanProduct } from './commercial-plans'
import { calculateProductMonthKPIs } from '@/lib/commercial-plan-helpers'

export interface MonthHeadcount {
  month: number
  month_name: string
  sqls: number
  vendas: number
  sellers_needed: number
  supervisors_needed: number
  coordinators_needed: number
  
  // Breakdown por senioridade
  sellers_by_seniority: { junior: number; pleno: number; senior: number }
  supervisors_by_seniority: { junior: number; pleno: number; senior: number }
  coordinators_by_seniority: { junior: number; pleno: number; senior: number }
  
  total_headcount: number
}

export interface TeamStructure {
  seller_per_supervisor: number
  supervisor_per_coordinator: number
  seniority_distribution: {
    seller?: { junior: number; pleno: number; senior: number }
    supervisor?: { junior: number; pleno: number; senior: number }
    coordinator?: { junior: number; pleno: number; senior: number }
  }
}

/**
 * Distribui headcount por senioridade
 */
function distributeBySeniority(
  total: number,
  distribution: { junior: number; pleno: number; senior: number }
): { junior: number; pleno: number; senior: number } {
  return {
    junior: Math.ceil(total * distribution.junior),
    pleno: Math.ceil(total * distribution.pleno),
    senior: Math.ceil(total * distribution.senior)
  }
}

/**
 * Calcula headcount mensal baseado em vendas
 */
export async function calculateMonthlyHeadcount(
  planId: string,
  teamStructure: TeamStructure
): Promise<{ success: boolean; data?: MonthHeadcount[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Buscar todos os produtos do plano
    const { data: products, error: productsError } = await supabase
      .from('plan_products')
      .select('*')
      .eq('plan_id', planId)
    
    if (productsError || !products) {
      return { success: false, error: 'Erro ao buscar produtos' }
    }
    
    if (products.length === 0) {
      return { success: false, error: 'Nenhum produto configurado no plano' }
    }
    
    // Buscar todas as estratégias de todos os produtos
    const productIds = products.map(p => p.id)
    const { data: allStrategies, error: strategiesError } = await supabase
      .from('plan_product_month_strategies')
      .select('*')
      .in('plan_product_id', productIds)
    
    if (strategiesError) {
      return { success: false, error: 'Erro ao buscar estratégias' }
    }
    
    if (!allStrategies || allStrategies.length === 0) {
      return { success: false, error: 'Nenhuma estratégia configurada' }
    }
    
    // Calcular KPIs para cada produto
    const productKPIs: { [month: number]: { sqls: number; vendas: number; strategies: MonthStrategy[] } } = {}
    
    for (const product of products) {
      const strategies = allStrategies.filter((s: MonthStrategy) => s.plan_product_id === product.id)
      
      for (let month = 1; month <= 12; month++) {
        if (!productKPIs[month]) {
          productKPIs[month] = { sqls: 0, vendas: 0, strategies: [] }
        }
        
        const monthStrategies = strategies.filter((s: MonthStrategy) => s.month === month)
        
        if (monthStrategies.length > 0) {
          const monthKPIs = calculateProductMonthKPIs(product as PlanProduct, month, monthStrategies)
          productKPIs[month].sqls += monthKPIs.sqls
          productKPIs[month].vendas += monthKPIs.vendas
          productKPIs[month].strategies.push(...monthStrategies)
        }
      }
    }
    
    // Calcular headcount para cada mês
    const MONTH_NAMES = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    
    const monthlyHeadcount: MonthHeadcount[] = []
    
    for (let month = 1; month <= 12; month++) {
      const kpis = productKPIs[month]
      
      if (!kpis || kpis.vendas === 0) {
        // Mês sem vendas, headcount zero
        monthlyHeadcount.push({
          month,
          month_name: MONTH_NAMES[month - 1],
          sqls: 0,
          vendas: 0,
          sellers_needed: 0,
          supervisors_needed: 0,
          coordinators_needed: 0,
          sellers_by_seniority: { junior: 0, pleno: 0, senior: 0 },
          supervisors_by_seniority: { junior: 0, pleno: 0, senior: 0 },
          coordinators_by_seniority: { junior: 0, pleno: 0, senior: 0 },
          total_headcount: 0
        })
        continue
      }
      
      // Calcular produtividade média ponderada do mês
      let totalInvestment = 0
      let weightedProductivity = 0
      let weightedWorkingDays = 0
      
      for (const strategy of kpis.strategies) {
        const investment = strategy.monthly_investment || 0
        totalInvestment += investment
        
        if (investment > 0) {
          const weight = investment / (totalInvestment || 1)
          weightedProductivity += (strategy.productivity_per_day || 20) * weight
          weightedWorkingDays += (strategy.working_days || 22) * weight
        }
      }
      
      // Se não há investimento, usar defaults
      if (totalInvestment === 0) {
        weightedProductivity = 20
        weightedWorkingDays = 22
      }
      
      // Calcular vendedores necessários
      const sqlsPerSellerMonth = weightedProductivity * weightedWorkingDays
      const sellersNeeded = Math.ceil(kpis.sqls / sqlsPerSellerMonth)
      
      // Calcular liderança
      const supervisorsNeeded = Math.ceil(sellersNeeded / teamStructure.seller_per_supervisor)
      const coordinatorsNeeded = Math.ceil(supervisorsNeeded / teamStructure.supervisor_per_coordinator)
      
      // Distribuir por senioridade
      const sellerDist = teamStructure.seniority_distribution.seller || { junior: 0.3, pleno: 0.5, senior: 0.2 }
      const supervisorDist = teamStructure.seniority_distribution.supervisor || { junior: 0.2, pleno: 0.5, senior: 0.3 }
      const coordinatorDist = teamStructure.seniority_distribution.coordinator || { junior: 0, pleno: 0.4, senior: 0.6 }
      
      const sellersBySeniority = distributeBySeniority(sellersNeeded, sellerDist)
      const supervisorsBySeniority = distributeBySeniority(supervisorsNeeded, supervisorDist)
      const coordinatorsBySeniority = distributeBySeniority(coordinatorsNeeded, coordinatorDist)
      
      monthlyHeadcount.push({
        month,
        month_name: MONTH_NAMES[month - 1],
        sqls: kpis.sqls,
        vendas: kpis.vendas,
        sellers_needed: sellersNeeded,
        supervisors_needed: supervisorsNeeded,
        coordinators_needed: coordinatorsNeeded,
        sellers_by_seniority: sellersBySeniority,
        supervisors_by_seniority: supervisorsBySeniority,
        coordinators_by_seniority: coordinatorsBySeniority,
        total_headcount: sellersNeeded + supervisorsNeeded + coordinatorsNeeded
      })
    }
    
    return { success: true, data: monthlyHeadcount }
  } catch (error: any) {
    console.error('Error in calculateMonthlyHeadcount:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}
