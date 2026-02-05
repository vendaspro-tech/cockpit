'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { addMonthStrategy } from '@/app/actions/commercial-plans'
import { Loader2, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BulkStrategyDialogProps {
  planProductId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const MONTHS = [
  { num: 1, name: 'Janeiro' },
  { num: 2, name: 'Fevereiro' },
  { num: 3, name: 'Março' },
  { num: 4, name: 'Abril' },
  { num: 5, name: 'Maio' },
  { num: 6, name: 'Junho' },
  { num: 7, name: 'Julho' },
  { num: 8, name: 'Agosto' },
  { num: 9, name: 'Setembro' },
  { num: 10, name: 'Outubro' },
  { num: 11, name: 'Novembro' },
  { num: 12, name: 'Dezembro' },
]

export function BulkStrategyDialog({
  planProductId,
  open,
  onOpenChange,
  onSuccess
}: BulkStrategyDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'equal' | 'custom'>('equal')
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  
  const [formData, setFormData] = useState({
    strategy: 'perpetuo' as 'perpetuo' | 'lancamento' | 'custom',
    share_month: '100',
    conversion_rate: '',
    productivity_per_day: '',
    working_days: '',
    
    // Marketing fields
    monthly_investment: '',
    cpl: '10',
    mql_to_sql_rate: '25'
  })

  const toggleMonth = (month: number) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month))
    } else {
      setSelectedMonths([...selectedMonths, month].sort((a, b) => a - b))
    }
  }

  const toggleAll = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([])
    } else {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedMonths.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um mês',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    const totalSharePercentage = parseFloat(formData.share_month)
    
    // Calculate share per month
    const sharePerMonth = mode === 'equal' 
      ? (totalSharePercentage / 100) / selectedMonths.length
      : (totalSharePercentage / 100)

    let successCount = 0
    let errorCount = 0

    // Apply strategy to all selected months
    for (const month of selectedMonths) {
      const { error } = await addMonthStrategy(planProductId, {
        month,
        strategy: formData.strategy,
        share_month: sharePerMonth,
        conversion_rate: formData.conversion_rate ? parseFloat(formData.conversion_rate) / 100 : undefined,
        productivity_per_day: formData.productivity_per_day ? parseInt(formData.productivity_per_day) : undefined,
        working_days: formData.working_days ? parseInt(formData.working_days) : undefined,
        
        // Marketing fields
        monthly_investment: parseFloat(formData.monthly_investment) || 0,
        cpl: parseFloat(formData.cpl) || 10,
        mql_to_sql_rate: parseFloat(formData.mql_to_sql_rate) / 100 || 0.25
      })

      if (error) {
        errorCount++
      } else {
        successCount++
      }
    }

    if (errorCount > 0) {
      toast({
        title: 'Erro parcial',
        description: `${successCount} meses configurados, ${errorCount} falharam. Verifique se algum mês já tem 100% configurado.`,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: `Estratégia aplicada em ${successCount} ${successCount === 1 ? 'mês' : 'meses'}.`
      })
    }

    onSuccess()
    onOpenChange(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Preenchimento em Massa
            </DialogTitle>
            <DialogDescription>
              Configure uma estratégia para múltiplos meses de uma vez
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Mode Selection */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'equal' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="equal">Distribuir Igualmente</TabsTrigger>
                <TabsTrigger value="custom">Share Total por Mês</TabsTrigger>
              </TabsList>

              <TabsContent value="equal" className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  O share será <strong>dividido igualmente</strong> entre os meses selecionados
                </p>
                <p className="text-xs text-amber-600">
                  Ex: 100% ÷ 12 meses = 8.33% por mês
                </p>
              </TabsContent>

              <TabsContent value="custom" className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  O share será aplicado <strong>integralmente</strong> em cada mês selecionado
                </p>
                <p className="text-xs text-amber-600">
                  Ex: 50% em cada um dos meses selecionados
                </p>
              </TabsContent>
            </Tabs>

            {/* Month Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Meses</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                >
                  {selectedMonths.length === 12 ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 p-4 border rounded-lg">
                {MONTHS.map((month) => (
                  <div key={month.num} className="flex items-center space-x-2">
                    <Checkbox
                      id={`month-${month.num}`}
                      checked={selectedMonths.includes(month.num)}
                      onCheckedChange={() => toggleMonth(month.num)}
                    />
                    <label
                      htmlFor={`month-${month.num}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {month.name}
                    </label>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {selectedMonths.length} {selectedMonths.length === 1 ? 'mês selecionado' : 'meses selecionados'}
                {mode === 'equal' && selectedMonths.length > 0 && (
                  <span className="text-primary font-medium">
                    {' '}→ {(parseFloat(formData.share_month || '0') / selectedMonths.length).toFixed(1)}% por mês
                  </span>
                )}
              </p>
            </div>

            {/* Strategy Config */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strategy">Tipo de Estratégia *</Label>
                <Select
                  value={formData.strategy}
                  onValueChange={(value: 'perpetuo' | 'lancamento' | 'custom') =>
                    setFormData({ ...formData, strategy: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perpetuo">Perpétuo</SelectItem>
                    <SelectItem value="lancamento">Lançamento</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share">
                  {mode === 'equal' ? 'Share Total (%)' : 'Share por Mês (%)'} *
                </Label>
                <Input
                  id="share"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 100"
                  value={formData.share_month}
                  onChange={(e) => setFormData({ ...formData, share_month: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Optional Parameters */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conversion">Conversão (%)</Label>
                <Input
                  id="conversion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Opcional"
                  value={formData.conversion_rate}
                  onChange={(e) => setFormData({ ...formData, conversion_rate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productivity">Prod/Dia</Label>
                <Input
                  id="productivity"
                  type="number"
                  min="0"
                  placeholder="Opcional"
                  value={formData.productivity_per_day}
                  onChange={(e) => setFormData({ ...formData, productivity_per_day: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Dias Úteis</Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  placeholder="Opcional"
                  value={formData.working_days}
                  onChange={(e) => setFormData({ ...formData, working_days: e.target.value })}
                />
              </div>
            </div>

            {/* Marketing Configuration */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium">Configuração de Marketing</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="investment">Investimento Mensal (R$) *</Label>
                  <Input
                    id="investment"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ex: 30000"
                    value={formData.monthly_investment}
                    onChange={(e) => setFormData({ ...formData, monthly_investment: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Será aplicado em cada mês selecionado
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="bulk_cpl">CPL (R$) *</Label>
                    <Input
                      id="bulk_cpl"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 10"
                      value={formData.cpl}
                      onChange={(e) => setFormData({ ...formData, cpl: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulk_mql">Taxa MQL→SQL (%) *</Label>
                    <Input
                      id="bulk_mql"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Ex: 25"
                      value={formData.mql_to_sql_rate}
                      onChange={(e) => setFormData({ ...formData, mql_to_sql_rate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || selectedMonths.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Aplicando...' : `Aplicar em ${selectedMonths.length} ${selectedMonths.length === 1 ? 'mês' : 'meses'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
