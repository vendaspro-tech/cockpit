'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommercialPlan, getPlanProducts } from '@/app/actions/commercial-plans'
import { getProductAnnualKPIs } from '@/app/actions/commercial-plans-calculations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Target, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface FinanceTabProps {
  plan: CommercialPlan
}

interface ProductKPIs {
  product_name: string
  mqls: number
  sqls: number
  vendas: number
  revenue: number
  investment: number
  cac: number
  roas: number
  roi: number
  margem: number
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function FinanceTab({ plan }: FinanceTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [productsKPIs, setProductsKPIs] = useState<ProductKPIs[]>([])

  const loadFinanceData = useCallback(async () => {
    setLoading(true)
    
    try {
      // Get all products
      const { data: products } = await getPlanProducts(plan.id)
      
      if (!products || products.length === 0) {
        setLoading(false)
        return
      }

      // Get KPIs for each product
      const kpisPromises = products.map(async (product) => {
        const kpis = await getProductAnnualKPIs(product.id)
        
        if (!kpis) return null
        
        return {
          product_name: (product.product as any)?.name || 'Produto',
          mqls: kpis.total_mqls,
          sqls: kpis.total_sqls,
          vendas: kpis.total_vendas,
          revenue: kpis.total_revenue,
          investment: kpis.total_investment,
          cac: kpis.total_vendas > 0 ? kpis.total_investment / kpis.total_vendas : 0,
          roas: kpis.total_investment > 0 ? kpis.total_revenue / kpis.total_investment : 0,
          roi: kpis.total_investment > 0 
            ? ((kpis.total_revenue - kpis.total_investment) / kpis.total_investment) * 100 
            : 0,
          margem: kpis.total_revenue - kpis.total_investment
        }
      })

      const kpisResults = await Promise.all(kpisPromises)
      const validKPIs = kpisResults.filter((k): k is ProductKPIs => k !== null)
      
      setProductsKPIs(validKPIs)
    } catch (error) {
      console.error('Error loading finance data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados financeiros.',
        variant: 'destructive'
      })
    }
    
    setLoading(false)
  }, [plan.id, toast])

  useEffect(() => {
    loadFinanceData()
  }, [loadFinanceData])

  // Calculate totals
  const totals = productsKPIs.reduce((acc, p) => ({
    mqls: acc.mqls + p.mqls,
    sqls: acc.sqls + p.sqls,
    vendas: acc.vendas + p.vendas,
    revenue: acc.revenue + p.revenue,
    investment: acc.investment + p.investment,
    margem: acc.margem + p.margem
  }), { mqls: 0, sqls: 0, vendas: 0, revenue: 0, investment: 0, margem: 0 })

  const yearlyCAC = totals.vendas > 0 ? totals.investment / totals.vendas : 0
  const yearlyROAS = totals.investment > 0 ? totals.revenue / totals.investment : 0
  const yearlyROI = totals.investment > 0 ? ((totals.revenue - totals.investment) / totals.investment) * 100 : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: plan.currency
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (productsKPIs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum produto configurado</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Adicione produtos com estratégias mensais configuradas para visualizar os KPIs financeiros consolidados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Finanças e KPIs Consolidados</h3>
        <p className="text-sm text-muted-foreground">
          Métricas financeiras agregadas de todos os produtos do plano
        </p>
      </div>

      {/* Annual KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Revenue Anual
              </div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totals.revenue)}</div>
              <div className="text-xs text-muted-foreground">Meta: {formatCurrency(plan.global_target)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">CAC</div>
              <div className="text-2xl font-bold">{formatCurrency(yearlyCAC)}</div>
              <Badge variant={yearlyCAC < 500 ? 'default' : 'secondary'} className="text-xs">
                {yearlyCAC < 500 ? 'Saudável' : 'Alto'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">ROAS</div>
              <div className="text-2xl font-bold">{yearlyROAS.toFixed(2)}x</div>
              <Badge variant={yearlyROAS > 3 ? 'default' : 'secondary'} className="text-xs">
                {yearlyROAS > 3 ? 'Excelente' : 'Aceitável'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">ROI</div>
              <div className="text-2xl font-bold">{yearlyROI > 0 ? '+' : ''}{yearlyROI.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Retorno anual</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Margem</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.margem)}</div>
              <div className="text-xs text-muted-foreground">
                {((totals.margem / totals.revenue) * 100).toFixed(1)}% do revenue
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown por Produto</CardTitle>
          <CardDescription>
            Detalhamento de métricas financeiras por produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">MQLs</TableHead>
                  <TableHead className="text-right">SQLs</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Investment</TableHead>
                  <TableHead className="text-right">CAC</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsKPIs.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{formatNumber(product.mqls)}</TableCell>
                    <TableCell className="text-right">{formatNumber(product.sqls)}</TableCell>
                    <TableCell className="text-right">{formatNumber(product.vendas)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.investment)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.cac)}</TableCell>
                    <TableCell className="text-right">{product.roas.toFixed(2)}x</TableCell>
                    <TableCell className="text-right">
                      {product.roi > 0 ? '+' : ''}{product.roi.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.mqls)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.sqls)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.vendas)}</TableCell>
                  <TableCell className="text-right text-primary">{formatCurrency(totals.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.investment)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(yearlyCAC)}</TableCell>
                  <TableCell className="text-right">{yearlyROAS.toFixed(2)}x</TableCell>
                  <TableCell className="text-right">
                    {yearlyROI > 0 ? '+' : ''}{yearlyROI.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
