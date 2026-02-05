'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCommercialPlan } from '@/app/actions/commercial-plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

interface NewPlanFormProps {
  workspaceId: string
}

export function NewPlanForm({ workspaceId }: NewPlanFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    global_target: '',
    use_squads: false,
    marketing_share: 0.4,
    commercial_share: 0.6,
    days_mode: 'business' as 'business' | 'calendar'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await createCommercialPlan(workspaceId, {
        name: formData.name,
        year: formData.year,
        global_target: parseFloat(formData.global_target),
        use_squads: formData.use_squads,
        marketing_share: formData.marketing_share,
        commercial_share: formData.commercial_share,
        days_mode: formData.days_mode
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
        title: 'Plano criado!',
        description: 'Plano comercial criado com sucesso.'
      })

      router.push(`/${workspaceId}/commercial-plan/${data.id}`)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Configure as informações principais do plano comercial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Plano Comercial 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Meta Global (R$) *</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 12000000"
                value={formData.global_target}
                onChange={(e) => setFormData({ ...formData, global_target: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.global_target && !isNaN(parseFloat(formData.global_target))
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(parseFloat(formData.global_target))
                  : 'Digite o valor da meta anual'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atribuição Marketing/Comercial</CardTitle>
            <CardDescription>
              Divisão entre leads vindos de marketing e gerados pelo comercial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marketing">Marketing (%)</Label>
                <Input
                  id="marketing"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.marketing_share * 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) / 100
                    setFormData({
                      ...formData,
                      marketing_share: val,
                      commercial_share: 1 - val
                    })
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commercial">Comercial (%)</Label>
                <Input
                  id="commercial"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commercial_share * 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) / 100
                    setFormData({
                      ...formData,
                      commercial_share: val,
                      marketing_share: 1 - val
                    })
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use_squads">Usar Squads</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar estrutura por squads (times)
                </p>
              </div>
              <Switch
                id="use_squads"
                checked={formData.use_squads}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, use_squads: checked })
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Modo de Dias</Label>
              <RadioGroup
                value={formData.days_mode}
                onValueChange={(value: 'business' | 'calendar') =>
                  setFormData({ ...formData, days_mode: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="business" id="business" />
                  <Label htmlFor="business" className="font-normal cursor-pointer">
                    Dias Úteis (22 dias/mês padrão)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calendar" id="calendar" />
                  <Label htmlFor="calendar" className="font-normal cursor-pointer">
                    Dias Corridos (31, 28, 30... conforme calendário)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Plano
          </Button>
        </div>
      </div>
    </form>
  )
}
