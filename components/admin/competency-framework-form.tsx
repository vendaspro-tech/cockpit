'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, GripVertical, AlertCircle, Brain, Target, Workflow, Pencil, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createCompetencyFramework, updateCompetencyFramework } from "@/app/actions/admin/competency-frameworks"
import type { CompetencyFramework, CompetencyDefinition } from "@/lib/types/competency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CompetencyFrameworkFormProps {
  framework?: CompetencyFramework & { job_titles?: any }
  workspaceId?: string | null
  jobTitles: Array<{ id: string; name: string; hierarchy_level: number }>
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

const defaultWeights = {
  behavioral: 50,
  technical_def: 30,
  process: 20
}

const defaultScoringRanges = {
  junior: { min: 0, max: 60 },
  pleno: { min: 61, max: 80 },
  senior: { min: 81, max: 100 }
}

const DIMENSION_LABELS = {
  behavioral: "Comportamental",
  technical: "Técnica (DEF)",
  process: "Processos"
} as const

// Default DEF competencies (Método de Avaliação de Forças Comerciais)
const defaultDEFCompetencies: CompetencyDefinition[] = [
  {
    id: 1,
    name: "Descoberta de Necessidades",
    description: "Capacidade de identificar e entender as reais necessidades do cliente através de perguntas estratégicas e escuta ativa"
  },
  {
    id: 2,
    name: "Educação e Consultoria",
    description: "Habilidade em educar o cliente sobre o mercado e propor soluções que agreguem valor além do produto"
  },
  {
    id: 3,
    name: "Valoração de Diferenciais",
    description: "Competência para comunicar o valor único da solução e diferenciar-se da concorrência de forma relevante"
  },
  {
    id: 4,
    name: "Negociação e Fechamento",
    description: "Capacidade de conduzir o processo de negociação, superar objeções e fechar negócios de forma ética e eficiente"
  }
]

export function CompetencyFrameworkForm({
  framework,
  workspaceId,
  jobTitles,
  open,
  onOpenChange,
  onCompleted
}: CompetencyFrameworkFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedJobTitleId, setSelectedJobTitleId] = useState<string>("")

  const [weights, setWeights] = useState(defaultWeights)
  const [scoringRanges, setScoringRanges] = useState(defaultScoringRanges)

  const [behavioralCompetencies, setBehavioralCompetencies] = useState<CompetencyDefinition[]>([])
  const [technicalCompetencies, setTechnicalCompetencies] = useState<CompetencyDefinition[]>([])
  const [processCompetencies, setProcessCompetencies] = useState<CompetencyDefinition[]>([])

  const [newBehavioral, setNewBehavioral] = useState({ name: "", description: "" })
  const [newTechnical, setNewTechnical] = useState({ name: "", description: "" })
  const [newProcess, setNewProcess] = useState({ name: "", description: "" })

  // Helper to normalize scoring ranges from database nested structure to flat UI structure
  // Database: { behavioral: {junior: [min,max]}, technical_def: {...}, process: {...}, global: {...} }
  // UI: { junior: {min, max}, pleno: {min, max}, senior: {min, max} }
  const normalizeScoringRanges = (ranges: any) => {
    if (!ranges) return { ...defaultScoringRanges }

    // Use global ranges for the UI (simplification - could be enhanced to show per-dimension ranges)
    const globalRanges = ranges.global || ranges.behavioral || ranges

    const normalizeLevel = (level: any, defaultLevel: { min: number; max: number }) => {
      if (!level) return defaultLevel
      if (Array.isArray(level) && level.length === 2) {
        return { min: level[0] || 0, max: level[1] || 100 }
      }
      if (level && typeof level === 'object' && 'min' in level && 'max' in level) {
        return { min: level.min || 0, max: level.max || 100 }
      }
      return defaultLevel
    }

    return {
      junior: normalizeLevel(globalRanges.junior, defaultScoringRanges.junior),
      pleno: normalizeLevel(globalRanges.pleno, defaultScoringRanges.pleno),
      senior: normalizeLevel(globalRanges.senior, defaultScoringRanges.senior)
    }
  }

  const resetForm = () => {
    setSelectedJobTitleId("")
    setWeights(defaultWeights)
    setScoringRanges(defaultScoringRanges)
    setBehavioralCompetencies([])
    setTechnicalCompetencies([...defaultDEFCompetencies]) // Pre-populate with default DEF competencies
    setProcessCompetencies([])
    setNewBehavioral({ name: "", description: "" })
    setNewTechnical({ name: "", description: "" })
    setNewProcess({ name: "", description: "" })
  }

  useEffect(() => {
    if (framework) {
      setSelectedJobTitleId(framework.job_title_id)

      // Convert weights from decimal (0.50) to percentage (50)
      const dbWeights = framework.weights || defaultWeights
      const uiWeights = {
        behavioral: Math.round(dbWeights.behavioral * 100),
        technical_def: Math.round(dbWeights.technical_def * 100),
        process: Math.round(dbWeights.process * 100)
      }
      setWeights(uiWeights)

      setScoringRanges(normalizeScoringRanges(framework.scoring_ranges))
      setBehavioralCompetencies(framework.behavioral_competencies || [])
      setTechnicalCompetencies(framework.technical_def_competencies || [])
      setProcessCompetencies(framework.process_competencies || [])
    } else {
      resetForm()
    }
  }, [framework, open])

  const handleWeightChange = (type: 'behavioral' | 'technical_def' | 'process', value: number) => {
    // Simply update the weight without auto-adjusting others
    setWeights({ ...weights, [type]: value })
  }

  const addCompetency = (
    type: 'behavioral' | 'technical' | 'process',
    competency: { name: string; description: string }
  ) => {
    if (!competency.name.trim()) return

    const newComp: CompetencyDefinition = {
      id: Date.now(),
      name: competency.name.trim(),
      description: competency.description.trim() || undefined
    }

    switch (type) {
      case 'behavioral':
        setBehavioralCompetencies([...behavioralCompetencies, newComp])
        setNewBehavioral({ name: "", description: "" })
        break
      case 'technical':
        setTechnicalCompetencies([...technicalCompetencies, newComp])
        setNewTechnical({ name: "", description: "" })
        break
      case 'process':
        setProcessCompetencies([...processCompetencies, newComp])
        setNewProcess({ name: "", description: "" })
        break
    }
  }

  const removeCompetency = (type: 'behavioral' | 'technical' | 'process', id: string | number) => {
    switch (type) {
      case 'behavioral':
        setBehavioralCompetencies(behavioralCompetencies.filter(c => c.id !== id))
        break
      case 'technical':
        setTechnicalCompetencies(technicalCompetencies.filter(c => c.id !== id))
        break
      case 'process':
        setProcessCompetencies(processCompetencies.filter(c => c.id !== id))
        break
    }
  }

  const updateCompetency = (
    type: 'behavioral' | 'technical' | 'process',
    id: string | number,
    field: 'name' | 'description',
    value: string
  ) => {
    const updateList = (list: CompetencyDefinition[]) =>
      list.map(c => c.id === id ? { ...c, [field]: value } : c)

    switch (type) {
      case 'behavioral':
        setBehavioralCompetencies(updateList(behavioralCompetencies))
        break
      case 'technical':
        setTechnicalCompetencies(updateList(technicalCompetencies))
        break
      case 'process':
        setProcessCompetencies(updateList(processCompetencies))
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedJobTitleId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um cargo"
      })
      return
    }

    if (hasDimensionGaps) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Adicione competências nas dimensões: ${missingDimensions.map((dim) => dim.label).join(", ")}`
      })
      return
    }

    const totalWeight = weights.behavioral + weights.technical_def + weights.process
    if (totalWeight !== 100) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Os pesos devem somar 100% (atual: ${totalWeight}%)`
      })
      return
    }

    if (hasZeroWeightDimensions) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Defina um peso maior que 0% para: ${zeroWeightDimensions.map((dim) => dim.label).join(", ")}`
      })
      return
    }

    setIsSubmitting(true)

    // Get job title name for template name
    const jobTitle = jobTitles.find(jt => jt.id === selectedJobTitleId)
    const templateName = `Matriz de Competências - ${jobTitle?.name || 'Template'}`

    // Convert scoring ranges from flat UI structure to nested database structure
    // UI: { junior: {min, max}, pleno: {min, max}, senior: {min, max} }
    // Database: { behavioral: {junior: [min,max]}, technical_def: {...}, process: {...}, global: {...} }
    const convertToArrayFormat = (ranges: any) => {
      const convertLevel = (level: any) => {
        if (level && typeof level === 'object' && 'min' in level && 'max' in level) {
          return [level.min, level.max]
        }
        return [0, 100]
      }

      // For now, use the same ranges for all dimensions
      // TODO: Future enhancement - allow per-dimension range configuration
      const juniorRange = convertLevel(ranges.junior)
      const plenoRange = convertLevel(ranges.pleno)
      const seniorRange = convertLevel(ranges.senior)

      return {
        behavioral: {
          junior: juniorRange,
          pleno: plenoRange,
          senior: seniorRange
        },
        technical_def: {
          junior: juniorRange,
          pleno: plenoRange,
          senior: seniorRange
        },
        process: {
          junior: juniorRange,
          pleno: plenoRange,
          senior: seniorRange
        },
        global: {
          junior: juniorRange,
          pleno: plenoRange,
          senior: seniorRange
        }
      }
    }

    // Convert weights from percentage (50) to decimal (0.50) for database
    const dbWeights = {
      behavioral: weights.behavioral / 100,
      technical_def: weights.technical_def / 100,
      process: weights.process / 100
    }

    const data = {
      workspace_id: null, // Global templates have no workspace
      job_title_id: selectedJobTitleId,
      name: templateName,
      weights: dbWeights,
      behavioral_competencies: behavioralCompetencies,
      technical_def_competencies: technicalCompetencies,
      process_competencies: processCompetencies,
      scoring_ranges: convertToArrayFormat(scoringRanges),
      is_template: true,
      is_active: true,
      version: 1,
      published_at: new Date().toISOString()
    }

    const result = framework
      ? await updateCompetencyFramework(framework.id, data as any)
      : await createCompetencyFramework(data as any)

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: framework ? "Erro ao atualizar" : "Erro ao criar",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: framework
          ? "Framework atualizado com sucesso"
          : "Framework criado com sucesso"
      })
      onOpenChange(false)
      onCompleted?.()
    }

    setIsSubmitting(false)
  }

  const totalWeight = weights.behavioral + weights.technical_def + weights.process
  const dimensionMeta = [
    { key: 'behavioral', label: DIMENSION_LABELS.behavioral, count: behavioralCompetencies.length, weight: weights.behavioral },
    { key: 'technical', label: DIMENSION_LABELS.technical, count: technicalCompetencies.length, weight: weights.technical_def },
    { key: 'process', label: DIMENSION_LABELS.process, count: processCompetencies.length, weight: weights.process }
  ]
  const missingDimensions = dimensionMeta.filter((dim) => dim.count === 0)
  const zeroWeightDimensions = dimensionMeta.filter((dim) => dim.weight === 0)
  const hasDimensionGaps = missingDimensions.length > 0
  const hasZeroWeightDimensions = zeroWeightDimensions.length > 0
  const isWeightValid = totalWeight === 100
  const canSubmit =
    !hasDimensionGaps &&
    !hasZeroWeightDimensions &&
    isWeightValid &&
    (framework ? true : Boolean(selectedJobTitleId))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[70vw] w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {framework ? 'Editar Framework de Competências' : 'Novo Framework de Competências'}
          </DialogTitle>
          <DialogDescription>
            Configure as competências e pesos para avaliação de senioridade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title Selection */}
          <div className="space-y-2">
            <Label htmlFor="job-title">Cargo *</Label>
            {framework ? (
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {framework.job_titles?.name || jobTitles.find(jt => jt.id === selectedJobTitleId)?.name || 'Cargo não encontrado'}
              </div>
            ) : (
              <Select
                value={selectedJobTitleId}
                onValueChange={setSelectedJobTitleId}
              >
                <SelectTrigger id="job-title">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map((jt) => (
                    <SelectItem key={jt.id} value={jt.id}>
                      {jt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {framework && (
              <p className="text-xs text-muted-foreground">
                O cargo não pode ser alterado após a criação do template
              </p>
            )}
          </div>

          {/* Weights Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pesos das Dimensões</CardTitle>
              <CardDescription>
                Ajuste a importância de cada dimensão (total deve ser 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Comportamental</Label>
                  <Badge variant={weights.behavioral > 0 ? "default" : "secondary"}>
                    {weights.behavioral}%
                  </Badge>
                </div>
                <Slider
                  value={[weights.behavioral]}
                  onValueChange={([value]) => handleWeightChange('behavioral', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Técnica (DEF)</Label>
                  <Badge variant={weights.technical_def > 0 ? "default" : "secondary"}>
                    {weights.technical_def}%
                  </Badge>
                </div>
                <Slider
                  value={[weights.technical_def]}
                  onValueChange={([value]) => handleWeightChange('technical_def', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Processos</Label>
                  <Badge variant={weights.process > 0 ? "default" : "secondary"}>
                    {weights.process}%
                  </Badge>
                </div>
                <Slider
                  value={[weights.process]}
                  onValueChange={([value]) => handleWeightChange('process', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {!isWeightValid && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Total: {totalWeight}% (deve ser 100%)</span>
                </div>
              )}

              {hasZeroWeightDimensions && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Ajuste os pesos para: {zeroWeightDimensions.map((dim) => dim.label).join(", ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competencies Tabs */}
          <Tabs defaultValue={framework ? "behavioral" : "technical"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="behavioral" className="gap-2">
                <Brain className="h-4 w-4" />
                Comportamental ({behavioralCompetencies.length})
              </TabsTrigger>
              <TabsTrigger value="technical" className="gap-2">
                <Target className="h-4 w-4" />
                Técnica DEF ({technicalCompetencies.length})
              </TabsTrigger>
              <TabsTrigger value="process" className="gap-2">
                <Workflow className="h-4 w-4" />
                Processos ({processCompetencies.length})
              </TabsTrigger>
            </TabsList>

            {hasDimensionGaps && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Adicione pelo menos uma competência em: {missingDimensions.map((dim) => dim.label).join(", ")}
                </span>
              </div>
            )}

            <TabsContent value="behavioral" className="space-y-4 mt-4">
              <CompetencyTable
                competencies={behavioralCompetencies}
                onRemove={(id) => removeCompetency('behavioral', id)}
                onUpdate={(id, field, value) => updateCompetency('behavioral', id, field, value)}
              />
              <CompetencyInput
                value={newBehavioral}
                onChange={setNewBehavioral}
                onAdd={() => addCompetency('behavioral', newBehavioral)}
                placeholder="Ex: Controle Emocional"
              />
            </TabsContent>

            <TabsContent value="technical" className="space-y-4 mt-4">
              <CompetencyTable
                competencies={technicalCompetencies}
                onRemove={(id) => removeCompetency('technical', id)}
                onUpdate={(id, field, value) => updateCompetency('technical', id, field, value)}
              />
              <CompetencyInput
                value={newTechnical}
                onChange={setNewTechnical}
                onAdd={() => addCompetency('technical', newTechnical)}
                placeholder="Ex: Descoberta de Necessidades"
              />
            </TabsContent>

            <TabsContent value="process" className="space-y-4 mt-4">
              <CompetencyTable
                competencies={processCompetencies}
                onRemove={(id) => removeCompetency('process', id)}
                onUpdate={(id, field, value) => updateCompetency('process', id, field, value)}
              />
              <CompetencyInput
                value={newProcess}
                onChange={setNewProcess}
                onAdd={() => addCompetency('process', newProcess)}
                placeholder="Ex: Gestão de Pipeline"
              />
            </TabsContent>
          </Tabs>

          {/* Scoring Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faixas de Senioridade</CardTitle>
              <CardDescription>
                Configure as pontuações mínimas e máximas para cada nível
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Júnior</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={scoringRanges.junior.min}
                      onChange={(e) => setScoringRanges({
                        ...scoringRanges,
                        junior: { ...scoringRanges.junior, min: Number(e.target.value) }
                      })}
                      min={0}
                      max={100}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={scoringRanges.junior.max}
                      onChange={(e) => setScoringRanges({
                        ...scoringRanges,
                        junior: { ...scoringRanges.junior, max: Number(e.target.value) }
                      })}
                      min={0}
                      max={100}
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pleno</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={scoringRanges.pleno.min}
                      onChange={(e) => setScoringRanges({
                        ...scoringRanges,
                        pleno: { ...scoringRanges.pleno, min: Number(e.target.value) }
                      })}
                      min={0}
                      max={100}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={scoringRanges.pleno.max}
                      onChange={(e) => setScoringRanges({
                        ...scoringRanges,
                        pleno: { ...scoringRanges.pleno, max: Number(e.target.value) }
                      })}
                      min={0}
                      max={100}
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sênior</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={scoringRanges.senior.min}
                      onChange={(e) => setScoringRanges({
                        ...scoringRanges,
                        senior: { ...scoringRanges.senior, min: Number(e.target.value) }
                      })}
                      min={0}
                      max={100}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={scoringRanges.senior.max}
                      onChange={(e) => setScoringRanges({
                        ...scoringRanges,
                        senior: { ...scoringRanges.senior, max: Number(e.target.value) }
                      })}
                      min={0}
                      max={100}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? "Salvando..." : framework ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Helper Components

interface CompetencyListProps {
  competencies: CompetencyDefinition[]
  onRemove: (id: string | number) => void
  onUpdate: (id: string | number, field: 'name' | 'description', value: string) => void
}

function CompetencyTable({ competencies, onRemove, onUpdate }: CompetencyListProps) {
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const startEdit = (comp: CompetencyDefinition) => {
    setEditingId(comp.id)
    setEditName(comp.name)
    setEditDescription(comp.description || '')
  }

  const saveEdit = (id: string | number) => {
    onUpdate(id, 'name', editName)
    onUpdate(id, 'description', editDescription)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  if (competencies.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8 border rounded-lg bg-muted/20">
        Nenhuma competência adicionada
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right w-32">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competencies.map((comp) => (
            <TableRow key={comp.id}>
              {editingId === comp.id ? (
                <>
                  <TableCell>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => saveEdit(comp.id)}
                        className="h-8 text-green-600 hover:text-green-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        className="h-8"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-medium">
                    {comp.name || <span className="text-muted-foreground italic">Sem nome</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {comp.description || <span className="italic">Sem descrição</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(comp)}
                        className="h-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(comp.id)}
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface CompetencyInputProps {
  value: { name: string; description: string }
  onChange: (value: { name: string; description: string }) => void
  onAdd: () => void
  placeholder: string
}

function CompetencyInput({ value, onChange, onAdd, placeholder }: CompetencyInputProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = () => {
    onAdd()
    setIsAdding(false)
  }

  const handleCancel = () => {
    onChange({ name: '', description: '' })
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Competência
      </Button>
    )
  }

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="space-y-2">
        <Input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder={placeholder}
          className="h-8"
          autoFocus
        />
        <Input
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Descrição (opcional)"
          className="h-8"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!value.name.trim()}
        >
          Adicionar
        </Button>
      </div>
    </div>
  )
}
