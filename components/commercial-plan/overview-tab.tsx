'use client'

import { useState } from 'react'
import { CommercialPlan, updateCommercialPlan } from '@/app/actions/commercial-plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { TrendingUp, Users, DollarSign, Target, Loader2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OverviewTabProps {
  plan: CommercialPlan
  onUpdate: () => void
}

const statusLabels = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando Aprovação',
  revision: 'Em Revisão',
  approved: 'Aprovado',
  active: 'Ativo',
  archived: 'Arquivado'
}

const statusColors = {
  draft: 'bg-gray-500',
  pending_approval: 'bg-yellow-500',
  revision: 'bg-orange-500',
  approved: 'bg-green-500',
  active: 'bg-blue-500',
  archived: 'bg-gray-400'
}

export function OverviewTab({ plan, onUpdate }: OverviewTabProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    global_target: plan.global_target.toString(),
    use_squads: plan.use_squads,
    marketing_share: ((plan.marketing_share || 0) * 100).toString(),
    commercial_share: ((plan.commercial_share || 0) * 100).toString()
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: plan.currency
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleMarketingShareChange = (value: string) => {
    const marketingValue = parseFloat(value) || 0
    const commercialValue = 100 - marketingValue
    setFormData({
      ...formData,
      marketing_share: value,
      commercial_share: commercialValue.toString()
    })
  }

  const handleCommercialShareChange = (value: string) => {
    const commercialValue = parseFloat(value) || 0
    const marketingValue = 100 - commercialValue
    setFormData({
      ...formData,
      commercial_share: value,
      marketing_share: marketingValue.toString()
    })
  }

  const handleSave = async () => {
    setSaving(true)

    // Parse values
    const marketingShare = parseFloat(formData.marketing_share) / 100
    let commercialShare = parseFloat(formData.commercial_share) / 100

    // Force sum to be exactly 1.0 to satisfy DB constraint
    const total = marketingShare + commercialShare
    if (Math.abs(total - 1.0) > 0.0001) {
      // Adjust commercial_share to make total = 1.0
      commercialShare = 1.0 - marketingShare
    }

    const { error } = await updateCommercialPlan(plan.id, {
      global_target: parseFloat(formData.global_target),
      use_squads: formData.use_squads,
      marketing_share: marketingShare,
      commercial_share: commercialShare
    })

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Alterações salvas!',
        description: 'As configurações do plano foram atualizadas.'
      })
      onUpdate()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-muted-foreground">Ano {plan.year}</p>
        </div>
        <Badge className={statusColors[plan.status]}>
          {statusLabels[plan.status]}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Global</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(parseFloat(formData.global_target) || 0)}</div>
            <p className="text-xs text-muted-foreground">Ano {plan.year}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MQLs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Configurar marketing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SQLs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Aguardando cálculo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Aguardando cálculo</p>
          </CardContent>
        </Card>
      </div>

      {/* Compact Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração do Plano</CardTitle>
              <CardDescription>Edite os parâmetros principais</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Meta Global */}
            <div className="space-y-2">
              <Label htmlFor="global_target" className="text-xs">Meta Global (R$)</Label>
              <Input
                id="global_target"
                type="text"
                value={formatNumber(parseFloat(formData.global_target) || 0)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, global_target: numericValue })
                }}
                className="h-9"
              />
            </div>

            {/* Usar Squads */}
            <div className="space-y-2">
              <Label htmlFor="use_squads" className="text-xs">Usar Squads</Label>
              <div className="flex items-center h-9">
                <Switch
                  id="use_squads"
                  checked={formData.use_squads}
                  onCheckedChange={(checked) => setFormData({ ...formData, use_squads: checked })}
                />
                <span className="ml-2 text-sm">{formData.use_squads ? 'Sim' : 'Não'}</span>
              </div>
            </div>

            {/* Split Marketing */}
            <div className="space-y-2">
              <Label htmlFor="marketing_share" className="text-xs">Marketing</Label>
              <div className="relative">
                <Input
                  id="marketing_share"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.marketing_share}
                  onChange={(e) => handleMarketingShareChange(e.target.value)}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Split Comercial */}
            <div className="space-y-2">
              <Label htmlFor="commercial_share" className="text-xs">Comercial</Label>
              <div className="relative">
                <Input
                  id="commercial_share"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commercial_share}
                  onChange={(e) => handleCommercialShareChange(e.target.value)}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auditoria</CardTitle>
            <CardDescription>Histórico de alterações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Criado em:</p>
              <p className="font-medium">{formatDate(plan.created_at)}</p>
            </div>

            {plan.updated_at && plan.updated_at !== plan.created_at && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Última atualização:</p>
                <p className="font-medium">{formatDate(plan.updated_at)}</p>
              </div>
            )}

            {plan.approved_at && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Aprovado em:</p>
                <p className="font-medium">{formatDate(plan.approved_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modo de Dias</CardTitle>
            <CardDescription>Configuração de calendário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">
                {plan.days_mode === 'business' ? 'Dias Úteis' : 'Dias Corridos'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
          <CardDescription>Configure seu plano comercial</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Adicione produtos na aba <strong>Produtos</strong></li>
            <li>Configure o TMR (Ticket Médio Recebido) de cada produto</li>
            <li>Defina as estratégias mensais (Perpétuo/Lançamento)</li>
            <li>Configure os OTEs por cargo e senioridade</li>
            <li>Revise os KPIs calculados</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
