'use client'

import { exportJobTitleToPDF } from "@/lib/pdf-utils"
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
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createJobTitle, updateJobTitle } from "@/app/actions/admin/job-titles"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import type {
  JobTitle,
  JobTitleFixedCompensation,
  JobTitleRemuneration,
  JobTitleRequirements,
} from "@/lib/types/job-title"
import { Badge } from "@/components/ui/badge"

interface JobTitleFormProps {
  jobTitle?: JobTitle
  jobTitles: JobTitle[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const slugPattern = /^[a-z0-9-]+$/

const hierarchyOptions = [
  { value: 0, label: "Estratégico (Nível 0)", description: "Decisões corporativas e visão macro" },
  { value: 1, label: "Tático (Nível 1)", description: "Coordenação de times/processos" },
  { value: 2, label: "Operacional (Nível 2)", description: "Supervisão e gestão direta" },
  { value: 3, label: "Execução (Nível 3)", description: "Operação e relacionamento com clientes" }
]

const processOptions = ["Marketing", "Vendas", "Customer Success"]

const mandatoryCourseOptions = [
  "DEF",
  "Conversas Lucrativas",
  "Closer Pro",
  "Pelotão",
  "Líder Pro",
]

const keyCompetencyOptions = [
  "Comunicação clara",
  "Negociação",
  "Gestão de pipeline",
  "Organização",
  "Empatia com o cliente",
  "Análise de dados",
  "Resiliência",
  "Colaboração",
]

type FixedCompensationState =
  | {
      type: "value"
      value: number | null
      min: null
      max: null
    }
  | {
      type: "range"
      value: null
      min: number | null
      max: number | null
    }

type RemunerationState = {
  [K in keyof JobTitleRemuneration]: {
    fixed: FixedCompensationState
    variable_description: string
  }
}

const createFixedCompensation = (fixed?: JobTitleFixedCompensation): FixedCompensationState => {
  if (typeof fixed === "number") {
    return { type: "value", value: fixed, min: null, max: null }
  }

  if (fixed && typeof fixed === "object") {
    if ("type" in fixed && fixed.type === "range") {
      return {
        type: "range",
        value: null,
        min: fixed.min ?? null,
        max: fixed.max ?? null,
      }
    }
    if ("type" in fixed && fixed.type === "value") {
      return {
        type: "value",
        value: fixed.value ?? 0,
        min: null,
        max: null,
      }
    }
    if (("min" in fixed || "max" in fixed) && !("type" in fixed)) {
      const rangeFixed = fixed as { min?: number | null; max?: number | null }
      return {
        type: "range",
        value: null,
        min: rangeFixed.min ?? null,
        max: rangeFixed.max ?? null,
      }
    }
    if ("value" in fixed) {
      const valueFixed = fixed as { value?: number | null }
      return {
        type: "value",
        value: valueFixed.value ?? 0,
        min: null,
        max: null,
      }
    }
  }

  return { type: "value", value: 0, min: null, max: null }
}

const normalizeRemuneration = (remuneration?: JobTitleRemuneration): RemunerationState => ({
  junior: {
    fixed: createFixedCompensation(remuneration?.junior?.fixed),
    variable_description: remuneration?.junior?.variable_description || "",
  },
  pleno: {
    fixed: createFixedCompensation(remuneration?.pleno?.fixed),
    variable_description: remuneration?.pleno?.variable_description || "",
  },
  senior: {
    fixed: createFixedCompensation(remuneration?.senior?.fixed),
    variable_description: remuneration?.senior?.variable_description || "",
  },
})

const serializeFixedCompensation = (
  fixed: FixedCompensationState
): JobTitleFixedCompensation => {
  if (fixed.type === "range") {
    return { type: "range", min: fixed.min, max: fixed.max }
  }

  return { type: "value", value: fixed.value }
}

const serializeRemuneration = (remuneration: RemunerationState): JobTitleRemuneration => ({
  junior: {
    fixed: serializeFixedCompensation(remuneration.junior.fixed),
    variable_description: remuneration.junior.variable_description,
  },
  pleno: {
    fixed: serializeFixedCompensation(remuneration.pleno.fixed),
    variable_description: remuneration.pleno.variable_description,
  },
  senior: {
    fixed: serializeFixedCompensation(remuneration.senior.fixed),
    variable_description: remuneration.senior.variable_description,
  },
})

const defaultRequirements: JobTitleRequirements = {
  education: "",
  mandatory_courses: [],
  key_competencies: []
}

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

const joinLines = (items: string[]) => items.join("\n")

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

const slugifyClient = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export function JobTitleForm({ jobTitle, jobTitles, open, onOpenChange }: JobTitleFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [formErrors, setFormErrors] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    hierarchy_level: 3,
    subordination: "",
    allows_seniority: true,
    mission: "",
    sector: "Vendas",
    remuneration: normalizeRemuneration(),
    requirements: defaultRequirements,
    kpis: [] as string[],
    main_activities: [] as string[],
    common_challenges: [] as string[]
  })

  // New item inputs
  const [newKpi, setNewKpi] = useState("")
  const [newCourse, setNewCourse] = useState("")
  const [newCompetency, setNewCompetency] = useState("")
  const [selectedCourseOption, setSelectedCourseOption] = useState("")
  const [selectedCompetencyOption, setSelectedCompetencyOption] = useState("")
  const [activitiesText, setActivitiesText] = useState("")
  const [challengesText, setChallengesText] = useState("")
  const missionMaxLength = 400

  // Reset form when dialog opens or jobTitle changes
  useEffect(() => {
    if (open) {
      setSelectedCourseOption("")
      setSelectedCompetencyOption("")
      setFormErrors([])
      if (jobTitle) {
        setFormData({
          name: jobTitle.name,
          slug: jobTitle.slug || "",
          hierarchy_level: jobTitle.hierarchy_level,
          subordination: jobTitle.subordination || "",
          allows_seniority: jobTitle.allows_seniority,
          mission: jobTitle.mission || "",
          sector: jobTitle.sector,
          remuneration: normalizeRemuneration(jobTitle.remuneration),
          requirements: jobTitle.requirements || defaultRequirements,
          kpis: jobTitle.kpis || [],
          main_activities: jobTitle.main_activities || [],
          common_challenges: jobTitle.common_challenges || []
        })
        setActivitiesText(joinLines(jobTitle.main_activities || []))
        setChallengesText(joinLines(jobTitle.common_challenges || []))
      } else {
        setFormData({
          name: "",
          slug: "",
          hierarchy_level: 3,
          subordination: "",
          allows_seniority: true,
          mission: "",
          sector: "Vendas",
          remuneration: normalizeRemuneration(),
          requirements: defaultRequirements,
          kpis: [],
          main_activities: [],
          common_challenges: []
        })
        setActivitiesText("")
        setChallengesText("")
      }
    }
  }, [open, jobTitle])

  const handleSlugChange = (value: string) => {
    if (!value.trim()) {
      setFormData(prev => ({ ...prev, slug: "" }))
      return
    }

    const normalized = slugifyClient(value)
    setFormData(prev => ({ ...prev, slug: normalized }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const clientErrors: string[] = []
      const trimmedName = formData.name.trim()
      if (!trimmedName) {
        clientErrors.push("Nome é obrigatório")
      }

      if (formData.slug && !slugPattern.test(formData.slug)) {
        clientErrors.push("Slug só pode conter letras minúsculas, números e hífen")
      }

      const conflictingSlugTitle = formData.slug
        ? jobTitles.find((title) => title.id !== jobTitle?.id && title.slug === formData.slug)
        : undefined

      if (conflictingSlugTitle) {
        clientErrors.push(`Slug já utilizado em "${conflictingSlugTitle.name}"`)
      }

      if (formData.hierarchy_level < 0 || formData.hierarchy_level > 3) {
        clientErrors.push("Selecione um nível hierárquico válido (0 a 3)")
      }

      if (clientErrors.length) {
        setFormErrors(clientErrors)
        toast({
          variant: "destructive",
          title: "Revise os campos",
          description: clientErrors[0]
        })
        setIsLoading(false)
        return
      }

      setFormErrors([])
      const normalizedActivities = splitLines(activitiesText)
      const normalizedChallenges = splitLines(challengesText)
      const slug = formData.slug.trim()
      const remunerationPayload = serializeRemuneration(formData.remuneration)
      const payload = {
        ...formData,
        name: trimmedName,
        slug: slug.length ? slug : undefined,
        remuneration: remunerationPayload,
        main_activities: normalizedActivities,
        common_challenges: normalizedChallenges,
      }

      const result = jobTitle
        ? await updateJobTitle(jobTitle.id, {
            ...formData,
            name: trimmedName,
            slug: slug.length ? slug : undefined,
            remuneration: remunerationPayload,
            main_activities: normalizedActivities,
            common_challenges: normalizedChallenges,
          } as any)
        : await createJobTitle(payload as any)

      if ('error' in result && result.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error
        })
      } else {
        toast({
          title: "Sucesso",
          description: jobTitle ? "Cargo atualizado com sucesso" : "Cargo criado com sucesso"
        })
        router.refresh()
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar o cargo"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addKpi = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    setFormData((prev) => {
      if (prev.kpis.includes(trimmed)) return prev
      return { ...prev, kpis: [...prev.kpis, trimmed] }
    })
    setNewKpi("")
  }

  const removeKpi = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      kpis: prev.kpis.filter((_, i) => i !== index),
    }))
  }

  const addRequirementItem = (field: 'mandatory_courses' | 'key_competencies', value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    setFormData((prev) => {
      if (prev.requirements[field].includes(trimmed)) return prev
      return {
        ...prev,
        requirements: {
          ...prev.requirements,
          [field]: [...prev.requirements[field], trimmed],
        },
      }
    })
    if (field === 'mandatory_courses') setNewCourse("")
    if (field === 'key_competencies') setNewCompetency("")
  }

  const removeRequirementItem = (field: 'mandatory_courses' | 'key_competencies', index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: prev.requirements[field].filter((_, i) => i !== index)
      }
    }))
  }

  const processOptionsWithCurrent = formData.sector && !processOptions.includes(formData.sector)
    ? [...processOptions, formData.sector]
    : processOptions

  const subordinationOptions = jobTitles
    .filter((title) => title.id !== jobTitle?.id)
    .map((title) => title.name)

  if (formData.subordination && !subordinationOptions.includes(formData.subordination)) {
    subordinationOptions.push(formData.subordination)
  }

  const suggestedSlug = formData.name ? slugifyClient(formData.name) : ""
  const conflictingSlugTitle = formData.slug
    ? jobTitles.find((title) => title.id !== jobTitle?.id && title.slug === formData.slug)
    : undefined
  const hierarchyMeta = hierarchyOptions.find(option => option.value === formData.hierarchy_level)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[70vw] !w-[70vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{jobTitle ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
          <DialogDescription>
            {jobTitle ? "Edite as informações do cargo" : "Preencha as informações para criar um novo cargo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[calc(90vh-180px)] pr-6">
            {formErrors.length > 0 && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-semibold">Corrija os campos abaixo:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {formErrors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full grid grid-cols-6 h-auto p-1 gap-1">
                <TabsTrigger value="basic" className="px-2 py-2.5 text-sm">Básico</TabsTrigger>
                <TabsTrigger value="remuneration" className="px-2 py-2.5 text-sm">Remuneração</TabsTrigger>
                <TabsTrigger value="requirements" className="px-2 py-2.5 text-sm">Requisitos</TabsTrigger>
                <TabsTrigger value="kpis" className="px-2 py-2.5 text-sm">KPIs</TabsTrigger>
                <TabsTrigger value="activities" className="px-2 py-2.5 text-sm">Atividades</TabsTrigger>
                <TabsTrigger value="challenges" className="px-2 py-2.5 text-sm">Desafios</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Sales Development Representative"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => suggestedSlug && setFormData(prev => ({ ...prev, slug: suggestedSlug }))}
                        disabled={!suggestedSlug}
                      >
                        Usar sugestão
                      </Button>
                    </div>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="Ex: sdr (gerado automaticamente se vazio)"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.slug
                        ? "Use letras minúsculas, números e hífen."
                        : suggestedSlug
                          ? `Sugestão: ${suggestedSlug}`
                          : "Preencha um slug ou deixe em branco para gerar automaticamente."}
                    </p>
                    {conflictingSlugTitle && (
                      <p className="text-xs text-destructive">Slug em uso por {conflictingSlugTitle.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hierarchy_level">Nível Hierárquico *</Label>
                    <Select
                      value={formData.hierarchy_level.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, hierarchy_level: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hierarchyOptions.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hierarchyMeta && (
                      <p className="text-xs text-muted-foreground">{hierarchyMeta.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Processo *</Label>
                    <Select
                      value={formData.sector}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
                    >
                      <SelectTrigger id="sector">
                        <SelectValue placeholder="Selecione o processo" />
                      </SelectTrigger>
                      <SelectContent>
                        {processOptionsWithCurrent.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subordination">Subordinação</Label>
                    <Select
                      value={formData.subordination || "none"}
                      onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          subordination: value === "none" ? "" : value
                        }))
                      }
                    >
                      <SelectTrigger id="subordination">
                        <SelectValue placeholder="Selecione o cargo de referência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem subordinação</SelectItem>
                        {subordinationOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">A quem este cargo se reporta?</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission">Missão</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                    placeholder="Descreva a missão e propósito deste cargo..."
                    rows={4}
                    maxLength={missionMaxLength}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {formData.mission.length}/{missionMaxLength} caracteres
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allows_seniority"
                    checked={formData.allows_seniority}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allows_seniority: checked }))}
                  />
                  <Label htmlFor="allows_seniority">Permite avaliação de senioridade</Label>
                </div>
              </TabsContent>

              {/* Remuneration Tab */}
              <TabsContent value="remuneration" className="space-y-6 mt-6">
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Variável sempre será calculada por OTEs conforme share do comercial e ticket médio dos produtos.
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {(['junior', 'pleno', 'senior'] as const).map((level) => (
                    <div key={level} className="space-y-4 rounded-lg border bg-card p-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold capitalize text-base">{level}</h4>
                        <p className="text-xs text-muted-foreground">
                          Salário fixo mensal
                        </p>
                      </div>

                      <RadioGroup
                        value={formData.remuneration[level].fixed.type}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            remuneration: {
                              ...prev.remuneration,
                              [level]: {
                                ...prev.remuneration[level],
                                fixed: {
                                  ...prev.remuneration[level].fixed,
                                  ...(value === "range"
                                    ? { type: "range", value: null }
                                    : { type: "value", min: null, max: null }),
                                },
                              },
                            },
                          }))
                        }
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="value" id={`${level}-fixed-value`} />
                          <Label htmlFor={`${level}-fixed-value`} className="text-sm">Valor único</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="range" id={`${level}-fixed-range`} />
                          <Label htmlFor={`${level}-fixed-range`} className="text-sm">Faixa salarial</Label>
                        </div>
                      </RadioGroup>

                      {formData.remuneration[level].fixed.type === "value" ? (
                        <div className="space-y-2">
                          <Label className="text-sm">Salário</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              R$
                            </span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={formData.remuneration[level].fixed.value?.toLocaleString('pt-BR') ?? ""}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '')
                                const value = numericValue ? parseInt(numericValue) : null
                                setFormData((prev) => ({
                                  ...prev,
                                  remuneration: {
                                    ...prev.remuneration,
                                    [level]: {
                                      ...prev.remuneration[level],
                                      fixed: {
                                        ...prev.remuneration[level].fixed,
                                        value,
                                      },
                                    },
                                  },
                                }))
                              }}
                              placeholder="0"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">De</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                R$
                              </span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={formData.remuneration[level].fixed.min?.toLocaleString('pt-BR') ?? ""}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/\D/g, '')
                                  const value = numericValue ? parseInt(numericValue) : null
                                  setFormData((prev) => ({
                                    ...prev,
                                    remuneration: {
                                      ...prev.remuneration,
                                      [level]: {
                                        ...prev.remuneration[level],
                                        fixed: {
                                          ...prev.remuneration[level].fixed,
                                          min: value,
                                        },
                                      },
                                    },
                                  }))
                                }}
                                placeholder="0"
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Até</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                R$
                              </span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={formData.remuneration[level].fixed.max?.toLocaleString('pt-BR') ?? ""}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/\D/g, '')
                                  const value = numericValue ? parseInt(numericValue) : null
                                  setFormData((prev) => ({
                                    ...prev,
                                    remuneration: {
                                      ...prev.remuneration,
                                      [level]: {
                                        ...prev.remuneration[level],
                                        fixed: {
                                          ...prev.remuneration[level].fixed,
                                          max: value,
                                        },
                                      },
                                    },
                                  }))
                                }}
                                placeholder="0"
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Educação</Label>
                  <Textarea
                    value={formData.requirements.education}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, education: e.target.value }
                    }))}
                    placeholder="Ex: Ensino Médio Completo"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cursos Obrigatórios</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Selecionar curso</Label>
                      <Select
                        value={selectedCourseOption}
                        onValueChange={(value) => {
                          setSelectedCourseOption(value)
                          addRequirementItem('mandatory_courses', value)
                          setSelectedCourseOption("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {mandatoryCourseOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Adicionar manualmente</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newCourse}
                          onChange={(e) => setNewCourse(e.target.value)}
                          placeholder="Ex: Formação Closer Pro"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addRequirementItem('mandatory_courses', newCourse)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addRequirementItem('mandatory_courses', newCourse)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requirements.mandatory_courses.map((course, index) => (
                      <Badge key={index} variant="secondary">
                        {course}
                        <button
                          type="button"
                          onClick={() => removeRequirementItem('mandatory_courses', index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Competências-Chave</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Selecionar competência</Label>
                      <Select
                        value={selectedCompetencyOption}
                        onValueChange={(value) => {
                          setSelectedCompetencyOption(value)
                          addRequirementItem('key_competencies', value)
                          setSelectedCompetencyOption("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma competência" />
                        </SelectTrigger>
                        <SelectContent>
                          {keyCompetencyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Adicionar manualmente</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newCompetency}
                          onChange={(e) => setNewCompetency(e.target.value)}
                          placeholder="Ex: Comunicação clara e eficaz"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addRequirementItem('key_competencies', newCompetency)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addRequirementItem('key_competencies', newCompetency)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requirements.key_competencies.map((comp, index) => (
                      <Badge key={index} variant="secondary">
                        {comp}
                        <button
                          type="button"
                          onClick={() => removeRequirementItem('key_competencies', index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* KPIs Tab */}
              <TabsContent value="kpis" className="space-y-6 mt-6">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Os KPIs estratégicos ficam disponíveis em{" "}
                  <Link href="/admin/kpis" className="font-medium text-foreground underline">
                    /admin/kpis
                  </Link>
                  . Use como referência para reaproveitar indicadores entre cargos.
                </div>
                <div className="space-y-2">
                  <Label>Adicionar KPI</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newKpi}
                      onChange={(e) => setNewKpi(e.target.value)}
                      placeholder="Ex: Taxa de conversão"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addKpi(newKpi)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addKpi(newKpi)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>KPIs ({formData.kpis.length})</Label>
                  <div className="space-y-2">
                    {formData.kpis.map((kpi, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1 text-sm">{kpi}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKpi(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Atividades Principais</Label>
                  <Textarea
                    value={activitiesText}
                    onChange={(e) => {
                      setActivitiesText(e.target.value)
                    }}
                    placeholder="Descreva as atividades principais, uma por linha."
                    rows={15}
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uma linha por atividade para facilitar a leitura e exportação.
                  </p>
                </div>
              </TabsContent>

              {/* Challenges Tab */}
              <TabsContent value="challenges" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Desafios Comuns</Label>
                  <Textarea
                    value={challengesText}
                    onChange={(e) => {
                      setChallengesText(e.target.value)
                    }}
                    placeholder="Descreva os desafios comuns, um por linha."
                    rows={12}
                    className="min-h-[250px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Registre os principais obstáculos enfrentados no cargo para orientar melhorias.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="mt-4">
            {jobTitle && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => exportJobTitleToPDF(jobTitle.id)}
                disabled={isLoading}
              >
                Exportar PDF
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {jobTitle ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
