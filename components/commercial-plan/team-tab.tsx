'use client'

import { useState, useEffect } from 'react'
import { CommercialPlan } from '@/app/actions/commercial-plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TeamTabProps {
  plan: CommercialPlan
}

interface OTEConfig {
  id: string
  role: string
  junior_ote: number
  pleno_ote: number
  senior_ote: number
  display_order: number
}

const DEFAULT_ROLES: Omit<OTEConfig, 'id'>[] = [
  { role: 'Vendedor', junior_ote: 3000, pleno_ote: 3500, senior_ote: 4000, display_order: 1 },
  { role: 'SDR', junior_ote: 2500, pleno_ote: 3000, senior_ote: 3500, display_order: 2 },
  { role: 'Closer', junior_ote: 4000, pleno_ote: 5000, senior_ote: 6000, display_order: 3 },
  { role: 'Inside Sales', junior_ote: 3500, pleno_ote: 4500, senior_ote: 5500, display_order: 4 },
  { role: 'Supervisor', junior_ote: 5000, pleno_ote: 6000, senior_ote: 7000, display_order: 5 },
  { role: 'Coordenador', junior_ote: 8000, pleno_ote: 9000, senior_ote: 10000, display_order: 6 }
]

export function TeamTab({ plan }: TeamTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [otes, setOtes] = useState<OTEConfig[]>([])

  // TODO: Load from database
  useEffect(() => {
    // Mock initial load
    setOtes(DEFAULT_ROLES.map((role, i) => ({ ...role, id: `temp-${i}` })))
  }, [plan.id])

  const handleAddRole = () => {
    const newRole: OTEConfig = {
      id: `temp-${Date.now()}`,
      role: 'Novo Cargo',
      junior_ote: 0,
      pleno_ote: 0,
      senior_ote: 0,
      display_order: otes.length + 1
    }
    setOtes([...otes, newRole])
  }

  const handleRemoveRole = (id: string) => {
    setOtes(otes.filter(ote => ote.id !== id))
  }

  const handleUpdateRole = (id: string, field: keyof OTEConfig, value: string | number) => {
    setOtes(otes.map(ote => ote.id === id ? { ...ote, [field]: value } : ote))
  }

  const handleUseDefaults = () => {
    setOtes(DEFAULT_ROLES.map((role, i) => ({ ...role, id: `temp-${i}` })))
    toast({
      title: 'Padrões aplicados',
      description: 'Valores padrão do mercado foram aplicados.'
    })
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save to database
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: 'OTEs salvos!',
      description: 'Configuração de remuneração atualizada com sucesso.'
    })
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Configuração de Remuneração (OTE)</h3>
        <p className="text-sm text-muted-foreground">
          Defina o OTE (On-Target Earnings) por cargo e senioridade
        </p>
      </div>

      {/* OTE Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de OTE</CardTitle>
          <CardDescription>
            Configure remuneração mensal (fixo + variável esperado) por cargo e nível de senioridade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Cargo</TableHead>
                  <TableHead className="text-right">Júnior</TableHead>
                  <TableHead className="text-right">Pleno</TableHead>
                  <TableHead className="text-right">Sênior</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum cargo configurado. Clique em &quot;Adicionar Cargo&quot; ou use os padrões do mercado.
                    </TableCell>
                  </TableRow>
                ) : (
                  otes.map((ote) => (
                    <TableRow key={ote.id}>
                      <TableCell>
                        <Input
                          value={ote.role}
                          onChange={(e) => handleUpdateRole(ote.id, 'role', e.target.value)}
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={ote.junior_ote}
                            onChange={(e) => handleUpdateRole(ote.id, 'junior_ote', parseInt(e.target.value) || 0)}
                            className="text-right"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={ote.pleno_ote}
                            onChange={(e) => handleUpdateRole(ote.id, 'pleno_ote', parseInt(e.target.value) || 0)}
                            className="text-right"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={ote.senior_ote}
                            onChange={(e) => handleUpdateRole(ote.id, 'senior_ote', parseInt(e.target.value) || 0)}
                            className="text-right"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(ote.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddRole}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cargo
            </Button>
            <Button variant="secondary" onClick={handleUseDefaults}>
              Usar Padrões do Mercado
            </Button>
          </div>

          {/* Info */}
          <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
            <p className="font-semibold">💡 Sobre OTE (On-Target Earnings):</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>OTE = Salário fixo + variável/comissão esperado</li>
              <li>Use valores <strong>mensais</strong></li>
              <li>Senioridade define faixa de remuneração</li>
              <li>Valores são usados para calcular custo de folha</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Squad Integration Preview (when enabled) */}
      {plan.use_squads && (
        <Card className="border-blue-500/50 bg-blue-50/5">
          <CardHeader>
            <CardTitle className="text-base">Preview de Custos</CardTitle>
            <CardDescription>
              Baseado nos squads vinculados ao plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidade em construção. Aqui será exibido o custo total baseado nas pessoas nos squads.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Configuração de OTE
        </Button>
      </div>
    </div>
  )
}
