'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommercialPlan } from '@/app/actions/commercial-plans'
import { getOTEConfigurations, configureOTE, getJobTitles, JobTitleData } from '@/app/actions/commercial-plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, DollarSign, Sparkles, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface OTEsTabProps {
  plan: CommercialPlan
}

interface OTEConfig {
  id?: string
  job_title_id: string
  seniority: 'junior' | 'pleno' | 'senior'
  base_salary: number
  commission_rate: number
  bonus_on_target: number
  productivity_per_day: number
}

const SENIORITY_LEVELS = [
  { value: 'junior', label: 'Júnior' },
  { value: 'pleno', label: 'Pleno' },
  { value: 'senior', label: 'Sênior' }
]

const MULTIPLIERS = [
  { value: 0.5, label: '0.5x', description: 'Muito abaixo' },
  { value: 0.7, label: '0.7x', description: 'Abaixo' },
  { value: 1.0, label: '1.0x', description: 'On-target' },
  { value: 1.2, label: '1.2x', description: 'Acima' },
  { value: 1.4, label: '1.4x', description: 'Muito acima' }
]

export function OTEsTab({ plan }: OTEsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState<OTEConfig[]>([])
  const [jobTitles, setJobTitles] = useState<JobTitleData[]>([])
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('')
  const [selectedSeniority, setSelectedSeniority] = useState<'junior' | 'pleno' | 'senior'>('junior')
  const [selectedMultiplier, setSelectedMultiplier] = useState(1.0)

  const [formData, setFormData] = useState({
    base_salary: 0,
    commission_rate: 0,
    bonus_on_target: 0,
    productivity_per_day: 0
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [configsRes, titlesRes] = await Promise.all([
      getOTEConfigurations(plan.id),
      getJobTitles()
    ])
    
    setConfigs(configsRes.data || [])
    setJobTitles(titlesRes.data || [])
    setLoading(false)
  }, [plan.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-fill salary when job title or seniority changes
  useEffect(() => {
    if (selectedJobTitle && jobTitles.length > 0) {
      const jobTitle = jobTitles.find(jt => jt.id === selectedJobTitle)
      if (jobTitle) {
        let baseSalary = 0
        if (selectedSeniority === 'junior') baseSalary = jobTitle.base_salary_junior || 0
        if (selectedSeniority === 'pleno') baseSalary = jobTitle.base_salary_pleno || 0
        if (selectedSeniority === 'senior') baseSalary = jobTitle.base_salary_senior || 0
        
        setFormData(prev => ({ ...prev, base_salary: baseSalary }))
      }
    }
  }, [selectedJobTitle, selectedSeniority, jobTitles])

  const calculateOTE = (baseSalary: number, bonus: number) => {
    return baseSalary + bonus
  }

  const handleUseDefaults = () => {
    // Default values based on role type
    const defaults = {
      base_salary: formData.base_salary || 2500,
      commission_rate: 3,
      bonus_on_target: 1500,
      productivity_per_day: 20
    }
    
    setFormData(defaults)
    toast({
      title: 'Padrões aplicados',
      description: 'Valores padrão do sistema foram aplicados'
    })
  }

  const handleSave = async () => {
    if (!selectedJobTitle) {
      toast({
        title: 'Erro',
        description: 'Selecione um cargo',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)

    const { error } = await configureOTE(plan.id, {
      job_title_id: selectedJobTitle,
      seniority: selectedSeniority,
      ...formData
    })

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'OTE configurado!',
        description: `${jobTitles.find(j => j.id === selectedJobTitle)?.name} ${SENIORITY_LEVELS.find(s => s.value === selectedSeniority)?.label}`
      })
      loadData()
    }

    setSaving(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const baseOTE = calculateOTE(formData.base_salary, formData.bonus_on_target)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">On-Target Earnings (OTEs)</h3>
        <p className="text-sm text-muted-foreground">
          Configure salários, comissões e metas para cada cargo e nível de senioridade
        </p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Configurar OTE</CardTitle>
              <CardDescription>
                Selecione cargo e senioridade. O salário base será preenchido automaticamente.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleUseDefaults}>
              <Sparkles className="mr-2 h-4 w-4" />
              Usar Padrões do Sistema
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo</Label>
              {jobTitles.length === 0 ? (
                <div className="border rounded-md p-3 text-sm text-muted-foreground">
                  Nenhum cargo encontrado. Configure cargos em Job Titles primeiro.
                </div>
              ) : (
                <Select value={selectedJobTitle} onValueChange={setSelectedJobTitle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Senioridade</Label>
              <Select 
                value={selectedSeniority} 
                onValueChange={(v) => setSelectedSeniority(v as 'junior' | 'pleno' | 'senior')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENIORITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* OTE Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_salary">Salário Base (R$)</Label>
              <Input
                id="base_salary"
                type="number"
                min="0"
                step="100"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                placeholder="Ex: 2000"
              />
              {selectedJobTitle && (
                <p className="text-xs text-muted-foreground">
                  ✨ Preenchido automaticamente de Job Titles
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus">Bônus On-Target (R$)</Label>
              <Input
                id="bonus"
                type="number"
                min="0"
                step="100"
                value={formData.bonus_on_target}
                onChange={(e) => setFormData({ ...formData, bonus_on_target: parseFloat(e.target.value) || 0 })}
                placeholder="Ex: 1500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Taxa de Comissão (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                placeholder="Ex: 5"
              />
              <p className="text-xs text-muted-foreground">
                % sobre o valor vendido
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productivity">Produtividade (SQLs/dia)</Label>
              <Input
                id="productivity"
                type="number"
                min="0"
                step="1"
                value={formData.productivity_per_day}
                onChange={(e) => setFormData({ ...formData, productivity_per_day: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 20"
              />
            </div>
          </div>

          {/* OTE Preview with Multipliers */}
          <Card className="bg-primary/5 border-primary">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">OTE Base (1.0x)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Salário Base + Bônus On-Target
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(baseOTE)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(formData.base_salary)} + {formatCurrency(formData.bonus_on_target)}
                  </p>
                </div>
              </div>

              {/* Multipliers */}
              <div className="pt-4 border-t space-y-2">
                <Label className="text-xs text-muted-foreground">Multiplicadores de Performance:</Label>
                <div className="grid grid-cols-5 gap-2">
                  {MULTIPLIERS.map((mult) => (
                    <div key={mult.value} className="text-center">
                      <Badge 
                        variant={mult.value === 1.0 ? 'default' : 'outline'}
                        className="w-full justify-center"
                      >
                        {mult.label}
                      </Badge>
                      <p className="text-xl font-bold mt-1">
                        {formatCurrency(baseOTE * mult.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">{mult.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !selectedJobTitle}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OTE Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de OTEs Configurados</CardTitle>
          <CardDescription>
            Visão geral de todas as configurações por cargo e senioridade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum OTE configurado ainda</p>
              <p className="text-sm mt-1">Configure os OTEs acima para começar</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Senioridade</TableHead>
                    <TableHead className="text-right">Salário Base</TableHead>
                    <TableHead className="text-right">Bônus</TableHead>
                    <TableHead className="text-right">OTE Total</TableHead>
                    <TableHead className="text-center">Comissão</TableHead>
                    <TableHead className="text-center">Produtividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={`${config.job_title_id}-${config.seniority}`}>
                      <TableCell className="font-medium">
                        {jobTitles.find(j => j.id === config.job_title_id)?.name}
                      </TableCell>
                      <TableCell>
                        {SENIORITY_LEVELS.find(s => s.value === config.seniority)?.label}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(config.base_salary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(config.bonus_on_target)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(config.base_salary + config.bonus_on_target)}
                      </TableCell>
                      <TableCell className="text-center">
                        {config.commission_rate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {config.productivity_per_day} SQLs/dia
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">💡 Sobre OTEs:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>OTE (On-Target Earnings):</strong> Remuneração total ao bater 100% da meta</li>
              <li><strong>Auto-fill:</strong> Salário base é preenchido automaticamente de Job Titles</li>
              <li><strong>Multiplicadores:</strong> 0.5x a 1.4x variam conforme performance (50% a 140% da meta)</li>
              <li><strong>Produtividade:</strong> Quantidade média de SQLs gerados por dia útil</li>
              <li><strong>Comissão:</strong> % adicional sobre o valor vendido (aplicado sobre TMR)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
