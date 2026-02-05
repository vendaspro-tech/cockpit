// =====================================================
// COMMERCIAL PLAN KPI HELPER FUNCTIONS
// These are pure calculation functions, not server actions
// =====================================================

import { PlanProduct, MonthStrategy } from '@/app/actions/commercial-plans'

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

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface StrategyCalculation {
  strategy: string
  share_month: number
  conversion_rate: number
  sqls_allocated: number
  vendas: number
  revenue: number
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
 * Calcula KPIs para um produto em um mês específico
 * Usa a configuração de marketing agregada das estratégias do mês
 */
export function calculateProductMonthKPIs(
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
