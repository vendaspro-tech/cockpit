'use client'

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { updateTestStructure, TestStructure } from "@/app/actions/admin/scoring-rules"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"

interface ScoringRulesEditorProps {
  structures: TestStructure[]
}

const TEST_TYPE_LABELS: Record<string, string> = {
  seniority_seller: "Senioridade (Vendedor)",
  seniority_leader: "Senioridade (Líder)",
  def_method: "Método DEF",
  values_8d: "Valores 8D",
  leadership_style: "Estilo de Liderança",
  disc: "Perfil DISC",
}

type RangeState = { min: number; max: number; label: string; description?: string }

type QuestionState = {
  id: string
  text: string
  weight: number
  options: { label: string; value: number; justification?: string }[]
}

type CategoryState = {
  id: string
  name: string
  weight: number
  method: "sum" | "average"
  ranges: RangeState[]
  questions: QuestionState[]
}

type GlobalRange = { min: number; max: number; label: string; description?: string }
type ProfileRule = { profile: string; min: number; max: number }
type GlobalMethod = "sum" | "weighted_sum" | "average" | "weighted_average"

export function ScoringRulesEditor({ structures }: ScoringRulesEditorProps) {
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState<string>(structures[0]?.id || "")
  const [categories, setCategories] = useState<CategoryState[]>([])
  const [globalMethod, setGlobalMethod] = useState<GlobalMethod>("sum")
  const [globalRanges, setGlobalRanges] = useState<GlobalRange[]>([])
  const [compareSelfManager, setCompareSelfManager] = useState(false)
  const [profiles, setProfiles] = useState<ProfileRule[]>([])
  const [description, setDescription] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const selectedStructure = useMemo(
    () => structures.find((s) => s.id === selectedId),
    [structures, selectedId]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!selectedStructure) return
    const parsed = parseStructure(selectedStructure.structure)
    setCategories(parsed.categories)
    setGlobalMethod(parsed.globalMethod)
    setGlobalRanges(parsed.globalRanges)
    setCompareSelfManager(parsed.compareSelfManager)
    setProfiles(parsed.profiles)
    setIsDirty(false)
  }, [selectedStructure])

  const parseStructure = (structure: any): {
    categories: CategoryState[]
    globalMethod: GlobalMethod
    globalRanges: GlobalRange[]
    compareSelfManager: boolean
    profiles: ProfileRule[]
    description: string
  } => {
    const questionWeights = structure?.question_weights || {}
    const globalWeights = structure?.global_scoring?.weights || structure?.category_weights || {}
    
    // Generate default options from scale if available
    const generateOptionsFromScale = (scale: any) => {
      if (!scale) return null
      const min = Number(scale.min ?? 1)
      const max = Number(scale.max ?? 3)
      const labels = scale.labels || {}
      const options = []
      for (let i = min; i <= max; i++) {
        options.push({
          label: labels[String(i)] || `Opção ${i}`,
          value: i,
        })
      }
      return options
    }
    
    const scaleOptions = generateOptionsFromScale(structure?.scale)

    const cats: CategoryState[] = (structure?.categories || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      weight: Number(globalWeights[c.id] ?? 1),
      method: c.scoring?.method === "average" ? "average" : "sum",
      ranges:
        c.scoring?.ranges?.map((r: any) => ({
          min: Number(r.min ?? 0),
          max: Number(r.max ?? 0),
          label: r.label ?? "",
          description: r.description ?? r.desc ?? "",
        })) || [],
      questions: (c.questions || []).map((q: any) => {
        // Priority: question options > scale options > default
        const baseOptions =
          q.options && q.options.length > 0
            ? q.options
            : scaleOptions || [
                { label: "Opção 1", value: 1 },
                { label: "Opção 2", value: 2 },
                { label: "Opção 3", value: 3 },
              ]

        return {
          id: q.id,
          text: q.question || q.text || "",
          weight: Number(questionWeights[q.id] ?? q.weight ?? 1),
          options: baseOptions.map((opt: any) => ({
            label: opt.label ?? "",
            value: Number(opt.value ?? 0),
            justification: opt.justification ?? opt.desc ?? "",
          })),
        }
      }),
    }))

    const globalRanges: GlobalRange[] =
      structure?.global_scoring?.ranges?.map((r: any) => ({
        min: Number(r.min ?? 0),
        max: Number(r.max ?? 0),
        label: r.label ?? "",
        description: r.description ?? r.desc ?? "",
      })) || []

    const profileRules: ProfileRule[] =
      (structure?.profiles || []).map((p: any) => ({
        profile: p.profile || p.label || "",
        min: Number(p.min ?? 0),
        max: Number(p.max ?? 0),
      })) || []

    const method = structure?.global_scoring?.method
    const normalizedMethod: GlobalMethod =
      method === "weighted_sum" || method === "average" || method === "weighted_average"
        ? method
        : "sum"

    return {
      categories: cats,
      globalMethod: normalizedMethod,
      globalRanges,
      compareSelfManager: !!structure?.comparisons?.compare_self_vs_manager,
      profiles: profileRules,
      description: structure?.description || "",
    }
  }

  const updateCategory = (id: string, updater: (c: CategoryState) => CategoryState) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
    setIsDirty(true)
  }

  const updateQuestionWeight = (catId: string, qId: string, value: number) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: c.questions.map((q) => (q.id === qId ? { ...q, weight: value } : q)),
    }))
  }

  const updateCategoryRange = (
    catId: string,
    idx: number,
    field: "min" | "max" | "label" | "description",
    value: string
  ) => {
    updateCategory(catId, (c) => {
      const ranges = [...c.ranges]
      const parsed =
        field === "label" || field === "description" ? value : Number(value) || 0
      ranges[idx] = { ...ranges[idx], [field]: parsed }
      return { ...c, ranges }
    })
  }

  const addCategoryRange = (catId: string) => {
    updateCategory(catId, (c) => ({
      ...c,
      ranges: [...c.ranges, { min: 0, max: 0, label: "", description: "" }],
    }))
  }

  const removeCategoryRange = (catId: string, idx: number) => {
    updateCategory(catId, (c) => ({
      ...c,
      ranges: c.ranges.filter((_, i) => i !== idx),
    }))
  }

  const updateGlobalRange = (
    idx: number,
    field: "min" | "max" | "label" | "description",
    value: string
  ) => {
    setGlobalRanges((prev) => {
      const next = [...prev]
      const parsed =
        field === "label" || field === "description" ? value : Number(value) || 0
      next[idx] = { ...next[idx], [field]: parsed }
      return next
    })
    setIsDirty(true)
  }

  const addGlobalRange = () => {
    setGlobalRanges((prev) => [...prev, { min: 0, max: 0, label: "", description: "" }])
    setIsDirty(true)
  }

  const removeGlobalRange = (idx: number) => {
    setGlobalRanges((prev) => prev.filter((_, i) => i !== idx))
    setIsDirty(true)
  }

  const updateProfile = (idx: number, field: "profile" | "min" | "max", value: string) => {
    setProfiles((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        [field]: field === "profile" ? value : Number(value) || 0,
      }
      return next
    })
    setIsDirty(true)
  }

  const addProfile = () => {
    setProfiles((prev) => [...prev, { profile: "", min: 0, max: 0 }])
    setIsDirty(true)
  }

  const removeProfile = (idx: number) => {
    setProfiles((prev) => prev.filter((_, i) => i !== idx))
    setIsDirty(true)
  }

  const addCategory = () => {
    const nextIndex = categories.length + 1
    setCategories((prev) => [
      ...prev,
      {
        id: `categoria_${nextIndex}`,
        name: "Nova categoria",
        weight: 1,
        method: "sum",
        ranges: [],
        questions: [],
      },
    ])
    setIsDirty(true)
  }

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setIsDirty(true)
  }

  const addQuestion = (catId: string) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: [
        ...c.questions,
        {
          id: `pergunta_${c.questions.length + 1}`,
          text: "Nova pergunta",
          weight: 1,
          options: [
            { label: "Opção 1", value: 1 },
            { label: "Opção 2", value: 2 },
            { label: "Opção 3", value: 3 },
          ],
        },
      ],
    }))
  }

  const removeQuestion = (catId: string, qId: string) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: c.questions.filter((q) => q.id !== qId),
    }))
  }

  const updateQuestionField = (
    catId: string,
    qId: string,
    field: "text" | "id" | "weight",
    value: string
  ) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: c.questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              [field]: field === "weight" ? Number(value) || 0 : value,
            }
          : q
      ),
    }))
  }

  const addOption = (catId: string, qId: string) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: c.questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: [...q.options, { label: "Nova opção", value: 1 }],
            }
          : q
      ),
    }))
  }

  const removeOption = (catId: string, qId: string, idx: number) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: c.questions.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.filter((_, i) => i !== idx) }
          : q
      ),
    }))
  }

  const updateOptionField = (
    catId: string,
    qId: string,
    idx: number,
    field: "label" | "value" | "justification",
    value: string
  ) => {
    updateCategory(catId, (c) => ({
      ...c,
      questions: c.questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === idx
                  ? {
                      ...opt,
                      [field]: field === "value" ? Number(value) || 0 : value,
                    }
                  : opt
              ),
            }
          : q
      ),
    }))
  }

  const handleSave = async () => {
    if (!selectedStructure) return

    setIsLoading(true)
    try {
      const questionWeights: Record<string, number> = {}
      const globalWeights: Record<string, number> = {}

      const rebuiltCategories = categories.map((c) => {
        globalWeights[c.id] = c.weight || 0
        const questions = c.questions.map((q) => {
          questionWeights[q.id] = q.weight || 0
          return {
            ...q,
            question: q.text,
          }
        })
        return {
          id: c.id,
          name: c.name,
          questions,
          scoring: {
            method: c.method,
            ranges: c.ranges,
          },
        }
      })

      const structure = {
        ...(selectedStructure.structure || {}),
        categories: rebuiltCategories,
        question_weights: questionWeights,
        global_scoring: {
          method: globalMethod,
          weights: globalWeights,
          ranges: globalRanges,
        },
        description,
        comparisons: {
          ...((selectedStructure.structure as any)?.comparisons || {}),
          compare_self_vs_manager: compareSelfManager,
        },
        profiles: profiles,
      }

      const result = await updateTestStructure(selectedStructure.id, structure)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        })
      } else {
        toast({
          title: "Sucesso",
          description: "Configuração salva com sucesso",
        })
        setIsDirty(false)
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao processar dados",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  if (structures.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma estrutura de teste encontrada.
      </div>
    )
  }

  if (!selectedStructure) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Selecione um teste para editar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-[320px]">
          <Label htmlFor="test-type" className="mb-2 block">
            Selecione o Teste
          </Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="test-type">
              <SelectValue placeholder="Selecione um teste..." />
            </SelectTrigger>
            <SelectContent>
              {structures.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {TEST_TYPE_LABELS[s.test_type] || s.test_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={!isDirty || isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Descrição</Label>
          <Input
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Resumo do teste exibido em relatórios"
          />
        </CardContent>
      </Card>

      <Alert variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Ajuste pesos, faixas e perfis de forma amigável. Alterações impactam avaliações e
          relatórios; revise antes de salvar.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Configuração Global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <Label>Método de cálculo</Label>
              <Select
                value={globalMethod}
                onValueChange={(v) => {
                  setGlobalMethod(v as any)
                  setIsDirty(true)
                }}
              >
              <SelectTrigger className="w-[220px] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Soma simples</SelectItem>
                <SelectItem value="weighted_sum">Soma ponderada (por categoria)</SelectItem>
                <SelectItem value="average">Média</SelectItem>
                <SelectItem value="weighted_average">Média ponderada (por categoria)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Switch
                checked={compareSelfManager}
                onCheckedChange={(checked) => {
                  setCompareSelfManager(checked)
                  setIsDirty(true)
                }}
              />
              <span className="text-sm text-muted-foreground">
                Comparar autoavaliação x gestor (quando aplicável)
              </span>
            </div>
          </div>

          <Label className="mt-2 block">Faixas de pontuação global</Label>
          <div className="space-y-2">
            {globalRanges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  type="number"
                  value={r.min}
                  onChange={(e) => updateGlobalRange(idx, "min", e.target.value)}
                  className="col-span-2"
                  placeholder="Mín."
                />
                <Input
                  type="number"
                  value={r.max}
                  onChange={(e) => updateGlobalRange(idx, "max", e.target.value)}
                  className="col-span-2"
                  placeholder="Máx."
                />
                <Input
                  value={r.label}
                  onChange={(e) => updateGlobalRange(idx, "label", e.target.value)}
                  className="col-span-4"
                  placeholder="Rótulo"
                />
                <Input
                  value={r.description || ""}
                  onChange={(e) => {
                    const next = [...globalRanges]
                    next[idx] = { ...next[idx], description: e.target.value }
                    setGlobalRanges(next)
                    setIsDirty(true)
                  }}
                  className="col-span-3"
                  placeholder="Descrição (opcional)"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGlobalRange(idx)}
                  className="col-span-1 text-red-600"
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addGlobalRange}>
              Adicionar faixa
            </Button>
          </div>
        </CardContent>
      </Card>

      {profiles.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Perfis (ex.: DISC)</CardTitle>
            <Button variant="outline" size="sm" onClick={addProfile}>
              Adicionar perfil
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {profiles.map((p, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  value={p.profile}
                  onChange={(e) => updateProfile(idx, "profile", e.target.value)}
                  className="col-span-4"
                  placeholder="Perfil"
                />
                <Input
                  type="number"
                  value={p.min}
                  onChange={(e) => updateProfile(idx, "min", e.target.value)}
                  className="col-span-2"
                  placeholder="Mín."
                />
                <Input
                  type="number"
                  value={p.max}
                  onChange={(e) => updateProfile(idx, "max", e.target.value)}
                  className="col-span-2"
                  placeholder="Máx."
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-2"
                  onClick={() => removeProfile(idx)}
                >
                  Remover
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Use para mapear faixas de pontuação para perfis (ex.: DISC).
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={addCategory}>
          Adicionar categoria
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>ID</Label>
                    <Input
                      value={cat.id}
                      onChange={(e) =>
                        updateCategory(cat.id, (c) => ({
                          ...c,
                          id: e.target.value,
                        }))
                      }
                      className="w-48"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Nome</Label>
                    <Input
                      value={cat.name}
                      onChange={(e) =>
                        updateCategory(cat.id, (c) => ({
                          ...c,
                          name: e.target.value,
                        }))
                      }
                      className="w-64"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-2">
                    <Label>Peso da categoria</Label>
                    <Input
                      type="number"
                      value={cat.weight}
                      onChange={(e) =>
                        updateCategory(cat.id, (c) => ({
                          ...c,
                          weight: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Método</Label>
                    <Select
                      value={cat.method}
                      onValueChange={(v) =>
                        updateCategory(cat.id, (c) => ({
                          ...c,
                          method: v as any,
                        }))
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Soma</SelectItem>
                        <SelectItem value="average">Média</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" className="text-red-600" size="sm" onClick={() => removeCategory(cat.id)}>
                    Remover categoria
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Faixas da categoria</Label>
                {cat.ranges.map((r, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      type="number"
                      value={r.min}
                      onChange={(e) => updateCategoryRange(cat.id, idx, "min", e.target.value)}
                      className="col-span-2"
                      placeholder="Mín."
                    />
                    <Input
                      type="number"
                      value={r.max}
                      onChange={(e) => updateCategoryRange(cat.id, idx, "max", e.target.value)}
                      className="col-span-2"
                      placeholder="Máx."
                    />
                    <Input
                      value={r.label}
                      onChange={(e) => updateCategoryRange(cat.id, idx, "label", e.target.value)}
                      className="col-span-4"
                      placeholder="Rótulo"
                    />
                    <Input
                      value={r.description || ""}
                      onChange={(e) => {
                        updateCategory(cat.id, (c) => {
                          const ranges = [...c.ranges]
                          ranges[idx] = { ...ranges[idx], description: e.target.value }
                          return { ...c, ranges }
                        })
                      }}
                      className="col-span-3"
                      placeholder="Descrição (opcional)"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategoryRange(cat.id, idx)}
                      className="col-span-1 text-red-600"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addCategoryRange(cat.id)}>
                  Adicionar faixa
                </Button>
              </div>

              <Separator />

            <div className="space-y-2">
              <Label>Perguntas</Label>
              <Accordion type="multiple" className="border rounded-md">
                {cat.questions.map((q) => (
                  <AccordionItem key={q.id} value={q.id}>
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-left">{q.text || "Pergunta"}</span>
                          <span className="text-xs text-muted-foreground">Peso: {q.weight}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 px-4 pb-4">
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-9">
                              <Label>Enunciado</Label>
                              <Textarea
                                value={q.text}
                                onChange={(e) =>
                                  updateQuestionField(cat.id, q.id, "text", e.target.value)
                                }
                                placeholder="Texto da pergunta"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label>Peso da pergunta</Label>
                              <Input
                                type="number"
                                value={q.weight}
                                onChange={(e) =>
                                  updateQuestionWeight(cat.id, q.id, Number(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Respostas (rótulo, valor, justificativa)</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(cat.id, q.id)}
                              >
                                Adicionar resposta
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {q.options.length === 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Nenhuma resposta cadastrada. Adicione opções abaixo.
                                </div>
                              )}
                              {q.options.map((opt, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-12 gap-2 items-start rounded-md border p-2"
                                >
                                  <Input
                                    value={opt.label}
                                    onChange={(e) =>
                                      updateOptionField(cat.id, q.id, idx, "label", e.target.value)
                                    }
                                    className="col-span-4"
                                    placeholder="Texto da resposta"
                                  />
                                  <Input
                                    type="number"
                                    value={opt.value}
                                    onChange={(e) =>
                                      updateOptionField(cat.id, q.id, idx, "value", e.target.value)
                                    }
                                    className="col-span-2"
                                    placeholder="Valor"
                                  />
                                  <Textarea
                                    value={opt.justification || ""}
                                    onChange={(e) =>
                                      updateOptionField(
                                        cat.id,
                                        q.id,
                                        idx,
                                        "justification",
                                        e.target.value
                                      )
                                    }
                                    className="col-span-5"
                                    placeholder="Justificativa (opcional)"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="col-span-1 text-red-600"
                                    onClick={() => removeOption(cat.id, q.id, idx)}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const cloneId = `${q.id}_copia_${Date.now()}`
                                updateCategory(cat.id, (c) => ({
                                  ...c,
                                  questions: [
                                    ...c.questions,
                                    {
                                      ...q,
                                      id: cloneId,
                                      text: `${q.text} (cópia)`,
                                    },
                                  ],
                                }))
                              }}
                            >
                              Duplicar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => removeQuestion(cat.id, q.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button variant="outline" size="sm" onClick={() => addQuestion(cat.id)} className="mt-2">
                  Adicionar pergunta
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
