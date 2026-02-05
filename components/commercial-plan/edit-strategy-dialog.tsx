'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MonthStrategy, updateMonthStrategy } from '@/app/actions/commercial-plans'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EditStrategyDialogProps {
  strategy: MonthStrategy
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function EditStrategyDialog({
  strategy,
  open,
  onOpenChange,
  onSuccess
}: EditStrategyDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    strategy: strategy.strategy,
    share_month: (strategy.share_month * 100).toString(),
    conversion_rate: strategy.conversion_rate ? (strategy.conversion_rate * 100).toString() : '',
    productivity_per_day: strategy.productivity_per_day?.toString() || '',
    working_days: strategy.working_days?.toString() || '',
    
    // Marketing fields
    monthly_investment: strategy.monthly_investment.toString(),
    cpl: strategy.cpl.toString(),
    mql_to_sql_rate: (strategy.mql_to_sql_rate * 100).toString()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await updateMonthStrategy(strategy.id, {
      strategy: formData.strategy,
      share_month: parseFloat(formData.share_month) / 100,
      conversion_rate: formData.conversion_rate ? parseFloat(formData.conversion_rate) / 100 : undefined,
      productivity_per_day: formData.productivity_per_day ? parseInt(formData.productivity_per_day) : undefined,
      working_days: formData.working_days ? parseInt(formData.working_days) : undefined,
      
      // Marketing fields
      monthly_investment: parseFloat(formData.monthly_investment) || 0,
      cpl: parseFloat(formData.cpl) || 10,
      mql_to_sql_rate: parseFloat(formData.mql_to_sql_rate) / 100 || 0.25
    })

    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Estratégia atualizada!',
      description: `Estratégia de ${MONTH_NAMES[strategy.month]} atualizada com sucesso.`
    })

    onSuccess()
    onOpenChange(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Estratégia - {MONTH_NAMES[strategy.month]}</DialogTitle>
            <DialogDescription>
              Modifique a configuração desta estratégia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perpetuo">Perpétuo (vendas contínuas)</SelectItem>
                  <SelectItem value="lancamento">Lançamento (campanha)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share">Share do Mês (%) *</Label>
              <Input
                id="share"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Ex: 60"
                value={formData.share_month}
                onChange={(e) => setFormData({ ...formData, share_month: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Percentual deste mês destinado a esta estratégia
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conversion">Conversão (%)</Label>
                <Input
                  id="conversion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 6"
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
                  placeholder="Ex: 20"
                  value={formData.productivity_per_day}
                  onChange={(e) => setFormData({ ...formData, productivity_per_day: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Dias</Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  placeholder="Ex: 22"
                  value={formData.working_days}
                  onChange={(e) => setFormData({ ...formData, working_days: e.target.value })}
                />
              </div>
            </div>

            {/* Marketing Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Configuração de Marketing</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="investment">Investimento do Mês (R$) *</Label>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cpl">CPL (R$) *</Label>
                    <Input
                      id="cpl"
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
                    <Label htmlFor="conversion_mql">Taxa MQL→SQL (%) *</Label>
                    <Input
                      id="conversion_mql"
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
