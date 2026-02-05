'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommercialPlan, PlanProduct, MonthStrategy } from '@/app/actions/commercial-plans'
import { getMonthStrategies, addMonthStrategy, removeMonthStrategy } from '@/app/actions/commercial-plans'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, Zap, Pencil } from 'lucide-react'
import { AddStrategyDialog } from './add-strategy-dialog'
import { BulkStrategyDialog } from './bulk-strategy-dialog'
import { EditStrategyDialog } from './edit-strategy-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface MonthStrategiesTableProps {
  planProduct: PlanProduct
  plan: CommercialPlan
  onUpdate: () => void
}

const MONTHS = [
  { num: 1, short: 'Jan', full: 'Janeiro' },
  { num: 2, short: 'Fev', full: 'Fevereiro' },
  { num: 3, short: 'Mar', full: 'Março' },
  { num: 4, short: 'Abr', full: 'Abril' },
  { num: 5, short: 'Mai', full: 'Maio' },
  { num: 6, short: 'Jun', full: 'Junho' },
  { num: 7, short: 'Jul', full: 'Julho' },
  { num: 8, short: 'Ago', full: 'Agosto' },
  { num: 9, short: 'Set', full: 'Setembro' },
  { num: 10, short: 'Out', full: 'Outubro' },
  { num: 11, short: 'Nov', full: 'Novembro' },
  { num: 12, short: 'Dez', full: 'Dezembro' },
]

const strategyLabels = {
  perpetuo: 'Perpétuo',
  lancamento: 'Lançamento',
  custom: 'Custom'
}

const strategyColors = {
  perpetuo: 'bg-blue-500',
  lancamento: 'bg-purple-500',
  custom: 'bg-green-500'
}

export function MonthStrategiesTable({ planProduct, plan, onUpdate }: MonthStrategiesTableProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [strategies, setStrategies] = useState<MonthStrategy[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<MonthStrategy | null>(null)

  const loadStrategies = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getMonthStrategies(planProduct.id)
    
    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive'
      })
    } else {
      setStrategies(data || [])
    }
    setLoading(false)
  }, [planProduct.id, toast])

  useEffect(() => {
    loadStrategies()
  }, [loadStrategies])

  const handleAddStrategy = (month: number) => {
    setSelectedMonth(month)
    setShowAddDialog(true)
  }

  const handleRemoveStrategy = async (strategyId: string) => {
    const { success, error } = await removeMonthStrategy(strategyId)
    
    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Estratégia removida!',
      description: 'Estratégia removida com sucesso.'
    })

    loadStrategies()
    onUpdate()
  }

  const handleEditStrategy = (strategy: MonthStrategy) => {
    setSelectedStrategy(strategy)
    setShowEditDialog(true)
  }

  // Group strategies by month
  const strategiesByMonth = MONTHS.map(month => {
    const monthStrategies = strategies.filter(s => s.month === month.num)
    const totalShare = monthStrategies.reduce((sum, s) => sum + Number(s.share_month), 0)
    
    // Calculate marketing aggregates
    const totalInvestment = monthStrategies.reduce((sum, s) => sum + (s.monthly_investment || 0), 0)
    
    let avgCPL = 0
    let avgMQLtoSQL = 0
    
    if (totalInvestment > 0 && monthStrategies.length > 0) {
      // Weighted average CPL
      avgCPL = monthStrategies.reduce((sum, s) => {
        const stratInvestment = s.monthly_investment || 0
        const stratCPL = s.cpl || 0
        return sum + (stratCPL * (stratInvestment / totalInvestment))
      }, 0)
      
      // Weighted average MQL→SQL rate
      avgMQLtoSQL = monthStrategies.reduce((sum, s) => {
        const stratInvestment = s.monthly_investment || 0
        const stratRate = s.mql_to_sql_rate || 0
        return sum + (stratRate * (stratInvestment / totalInvestment))
      }, 0)
    }
    
    return {
      ...month,
      strategies: monthStrategies,
      totalShare,
      isComplete: Math.abs(totalShare - 1.0) < 0.001,
      canAdd: totalShare < 1.0,
      // Marketing indicators
      totalInvestment,
      avgCPL,
      avgMQLtoSQL
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Defina as estratégias para cada mês. Você pode ter múltiplas estratégias no mesmo mês.</p>
          <p className="text-xs">
            <strong>Importante:</strong> A soma das shares de cada mês deve ser exatamente 100%
          </p>
        </div>
        <Button
          onClick={() => setShowBulkDialog(true)}
          variant="outline"
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Preenchimento em Massa
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Mês</TableHead>
              <TableHead>Estratégias</TableHead>
              <TableHead className="w-[100px] text-right">Investimento</TableHead>
              <TableHead className="w-[80px] text-right">CPL</TableHead>
              <TableHead className="w-[100px] text-right">MQL→SQL</TableHead>
              <TableHead className="w-[100px] text-center">Share</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategiesByMonth.map((month) => (
              <TableRow key={month.num}>
                <TableCell className="font-medium">{month.short}</TableCell>
                <TableCell>
                  {month.strategies.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Nenhuma estratégia configurada</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {month.strategies.map((strategy) => (
                        <div
                          key={strategy.id}
                          className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
                        >
                          <Badge className={strategyColors[strategy.strategy]} variant="default">
                            {strategyLabels[strategy.strategy]}
                          </Badge>
                          <span className="font-medium">{(strategy.share_month * 100).toFixed(0)}%</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditStrategy(strategy)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar estratégia"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveStrategy(strategy.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Remover estratégia"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {month.totalInvestment > 0 ? (
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(month.totalInvestment)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {month.avgCPL > 0 ? (
                    <span className="font-medium">R$ {month.avgCPL.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {month.avgMQLtoSQL > 0 ? (
                    <span className="font-medium">{(month.avgMQLtoSQL * 100).toFixed(0)}%</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={month.isComplete ? 'default' : 'outline'}
                    className={month.isComplete ? 'bg-green-600' : 'text-yellow-600 border-yellow-600'}
                  >
                    {(month.totalShare * 100).toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddStrategy(month.num)}
                    disabled={!month.canAdd}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded" />
          <span className="text-muted-foreground">100% configurado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-yellow-600 rounded" />
          <span className="text-muted-foreground">Incompleto</span>
        </div>
      </div>

      {selectedMonth && (
        <AddStrategyDialog
          planProductId={planProduct.id}
          month={selectedMonth}
          existingStrategies={strategies.filter(s => s.month === selectedMonth)}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            loadStrategies()
            onUpdate()
          }}
        />
      )}

      <BulkStrategyDialog
        planProductId={planProduct.id}
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        onSuccess={() => {
          loadStrategies()
          onUpdate()
        }}
      />

      {selectedStrategy && (
        <EditStrategyDialog
          strategy={selectedStrategy}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            loadStrategies()
            onUpdate()
          }}
        />
      )}
    </div>
  )
}
