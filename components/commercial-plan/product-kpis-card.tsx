'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle } from 'lucide-react'
import { PlanProduct } from '@/app/actions/commercial-plans'
import { ProductAnnualKPIs } from '@/app/actions/commercial-plans-calculations'

interface ProductKPIsCardProps {
  planProduct: PlanProduct
  currency?: string
  calculatedKPIs: ProductAnnualKPIs | null
  loading?: boolean
}

export function ProductKPIsCard({ planProduct, currency = 'BRL', calculatedKPIs, loading }: ProductKPIsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value))
  }

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Loading state
  if (loading || !calculatedKPIs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            KPIs do Produto
          </CardTitle>
          <CardDescription>
            Calculando métricas baseadas nas configurações...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (calculatedKPIs.total_revenue === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            KPIs do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Configuração necessária:</strong> Adicione estratégias mensais com configuração de marketing (Investment, CPL, Taxa MQL→SQL) para ver os KPIs calculados.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const kpis = calculatedKPIs

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          KPIs do Produto
        </CardTitle>
        <CardDescription>
          Métricas consolidadas anuais baseadas nas configurações e estratégias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Funil */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              MQLs
            </div>
            <div className="text-2xl font-bold">{formatNumber(kpis.total_mqls)}</div>
            <div className="text-xs text-muted-foreground">Marketing Qualified</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              SQLs
            </div>
            <div className="text-2xl font-bold">{formatNumber(kpis.total_sqls)}</div>
            <div className="text-xs text-green-600">
              {kpis.total_mqls > 0 ? ((kpis.total_sqls / kpis.total_mqls) * 100).toFixed(1) : '0.0'}% conversão
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Vendas
            </div>
            <div className="text-2xl font-bold">{formatNumber(kpis.total_vendas)}</div>
            <div className="text-xs text-green-600">
              {kpis.total_sqls > 0 ? ((kpis.total_vendas / kpis.total_sqls) * 100).toFixed(1) : '0.0'}% conversão
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Revenue
            </div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(kpis.total_revenue)}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(kpis.total_revenue / 12)}/mês
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t" />

        {/* Financial KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">CAC</div>
            <div className="text-xl font-bold">{formatCurrency(kpis.avg_cac)}</div>
            <Badge variant={kpis.avg_cac < planProduct.tmr_calculated ? 'default' : 'destructive'} className="text-xs">
              {kpis.avg_cac < planProduct.tmr_calculated ? 'Saudável' : 'Alto'}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">ROAS</div>
            <div className="text-xl font-bold">{kpis.avg_roas.toFixed(2)}x</div>
            <Badge variant={kpis.avg_roas > 3 ? 'default' : 'secondary'} className="text-xs">
              {kpis.avg_roas > 3 ? 'Excelente' : kpis.avg_roas > 2 ? 'Bom' : 'Regular'}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">ROI</div>
            <div className="text-xl font-bold flex items-center gap-1">
              {kpis.avg_roi > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              {formatPercent(kpis.avg_roi)}
            </div>
            <div className="text-xs text-muted-foreground">Retorno sobre investimento</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Margem Contrib.</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(kpis.total_margem)}
            </div>
            <div className="text-xs text-muted-foreground">
              {kpis.total_revenue > 0 ? ((kpis.total_margem / kpis.total_revenue) * 100).toFixed(1) : '0.0'}% do revenue
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
