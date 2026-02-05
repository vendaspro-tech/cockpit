'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Users,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import {  getSquadKPIs,
  type SquadKPIs
} from '@/app/actions/commercial-plans-squads'

interface SquadKPIsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  squadId: string
  squadName: string
}

export function SquadKPIsModal({
  open,
  onOpenChange,
  planId,
  squadId,
  squadName
}: SquadKPIsModalProps) {
  const [loading, setLoading] = useState(false)
  const [kpis, setKpis] = useState<SquadKPIs | null>(null)

  const loadKPIs = useCallback(async () => {
    setLoading(true)
    const result = await getSquadKPIs(planId, squadId)
    
    if (result.data) {
      setKpis(result.data)
    }
    
    setLoading(false)
  }, [planId, squadId])

  useEffect(() => {
    if (open) {
      loadKPIs()
    }
  }, [open, loadKPIs])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KPIs Consolidados - {squadName}</DialogTitle>
          <DialogDescription>
            Métricas agregadas de todos os produtos vinculados ao squad
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Carregando KPIs...
          </div>
        ) : !kpis ? (
          <div className="py-12 text-center text-muted-foreground">
            Erro ao carregar KPIs
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="breakdown">Por Produto</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Main KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span>MQLs</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(kpis.total_mqls)}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span>SQLs</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(kpis.total_sqls)}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>Vendas</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(kpis.total_sales)}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(kpis.total_revenue)}</p>
                </Card>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Conv. MQL → SQL</p>
                  <p className="text-xl font-semibold">
                    {formatPercentage(kpis.avg_conversion_mql_sql)}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Conv. SQL → Venda</p>
                  <p className="text-xl font-semibold">
                    {formatPercentage(kpis.avg_conversion_sql_sale)}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">CAC Médio</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(kpis.avg_cac)}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">ROAS</p>
                  <p className="text-xl font-semibold">
                    {kpis.avg_roas.toFixed(2)}x
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">ROI</p>
                  <p className="text-xl font-semibold">
                    {formatPercentage(kpis.avg_roi)}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Margem Média</p>
                  <p className="text-xl font-semibold">
                    {formatPercentage(kpis.avg_margin)}
                  </p>
                </Card>
              </div>

              {/* Placeholder for Charts */}
              {kpis.monthly_data.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Timeline (Últimos 12 meses)</h3>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                    Gráfico de timeline (implementar com Recharts)
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown" className="space-y-4">
              {kpis.products_breakdown.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                  Nenhum produto vinculado ao squad
                </Card>
              ) : (
                <Card>
                  <div className="divide-y">
                    {kpis.products_breakdown.map((product) => (
                      <div key={product.product_id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{product.product_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatPercentage(product.share_of_squad)} do squad
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">MQLs</p>
                            <p className="font-semibold">{formatNumber(product.mqls)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">SQLs</p>
                            <p className="font-semibold">{formatNumber(product.sqls)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Vendas</p>
                            <p className="font-semibold">{formatNumber(product.sales)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Info about data */}
              <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="h-5 w-5 inline-block mr-2" />
                <span>
                  KPIs calculados a partir das estratégias mensais de cada produto
                </span>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
