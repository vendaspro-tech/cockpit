'use client'

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import type { ScoringConfig, Category, ScoringMethod, ScoringRange } from "@/lib/types/test-structure"

interface ScoringTabProps {
  scoring: ScoringConfig
  categories: Category[]
  onScoringChange: (scoring: ScoringConfig) => void
}

const SCORING_METHOD_OPTIONS: { value: ScoringMethod; label: string; description: string }[] = [
  {
    value: 'sum',
    label: 'Soma Simples',
    description: 'Soma de todas as respostas'
  },
  {
    value: 'weighted_sum',
    label: 'Soma Ponderada',
    description: 'Soma ponderada por pesos das categorias'
  },
  {
    value: 'average',
    label: 'Média',
    description: 'Média de todas as respostas'
  },
  {
    value: 'weighted_average',
    label: 'Média Ponderada',
    description: 'Média ponderada por pesos das categorias'
  },
  {
    value: 'custom',
    label: 'Customizado',
    description: 'Lógica de cálculo customizada'
  }
]

export function ScoringTab({
  scoring,
  categories,
  onScoringChange
}: ScoringTabProps) {
  const [newRangeLabel, setNewRangeLabel] = useState('')
  const [newRangeMin, setNewRangeMin] = useState('')
  const [newRangeMax, setNewRangeMax] = useState('')

  const needsCategoryWeights = scoring?.method === 'weighted_sum' || scoring?.method === 'weighted_average'

  const updateCategoryWeight = (categoryId: string, weight: number) => {
    const newWeights = { ...scoring?.category_weights, [categoryId]: weight }
    onScoringChange({ ...scoring, category_weights: newWeights })
  }

  const addScoringRange = () => {
    if (!newRangeLabel.trim() || !newRangeMin || !newRangeMax) return

    const min = parseFloat(newRangeMin)
    const max = parseFloat(newRangeMax)

    if (isNaN(min) || isNaN(max) || min >= max) return

    const newRange: ScoringRange = {
      id: `range_${Date.now()}`,
      label: newRangeLabel,
      min,
      max,
      description: ''
    }

    const ranges = scoring?.ranges || []
    onScoringChange({ ...scoring, ranges: [...ranges, newRange] })

    setNewRangeLabel('')
    setNewRangeMin('')
    setNewRangeMax('')
  }

  const removeScoringRange = (rangeId: string) => {
    const ranges = scoring.ranges?.filter(r => r.id !== rangeId) || []
    onScoringChange({ ...scoring, ranges })
  }

  const updateScoringRange = (rangeId: string, updates: Partial<ScoringRange>) => {
    const ranges = scoring.ranges?.map(r =>
      r.id === rangeId ? { ...r, ...updates } : r
    ) || []
    onScoringChange({ ...scoring, ranges })
  }

  // Calculate total weight
  const totalWeight = Object.values(scoring?.category_weights || {}).reduce((sum, w) => sum + w, 0)
  const weightsValid = !needsCategoryWeights || Math.abs(totalWeight - 100) < 0.01

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Configuração de Pontuação</h3>
          <p className="text-sm text-muted-foreground">
            Defina como as respostas serão calculadas e interpretadas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scoring-method">Método de Cálculo *</Label>
          <Select
            value={scoring?.method || 'sum'}
            onValueChange={(value) => onScoringChange({ ...scoring, method: value as ScoringMethod })}
          >
            <SelectTrigger id="scoring-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORING_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsCategoryWeights && (
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label>Pesos das Categorias</Label>
              <span className={`text-sm font-medium ${weightsValid ? 'text-green-600' : 'text-destructive'}`}>
                Total: {totalWeight.toFixed(1)}%
              </span>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <Label className="flex-1 text-sm">{category.name}</Label>
                    <div className="flex items-center gap-2 w-32">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={scoring.category_weights?.[category.id] || 0}
                        onChange={(e) => updateCategoryWeight(category.id, parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Adicione categorias na aba Estrutura primeiro
              </p>
            )}

            {!weightsValid && categories.length > 0 && (
              <p className="text-xs text-destructive">
                A soma dos pesos deve ser exatamente 100%
              </p>
            )}
          </div>
        )}

        <div className="space-y-3 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Label>Configuração de Escala</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scale-min">Valor Mínimo</Label>
              <Input
                id="scale-min"
                type="number"
                value={scoring?.scale?.min ?? 1}
                onChange={(e) =>
                  onScoringChange({
                    ...scoring,
                    scale: {
                      ...scoring?.scale,
                      min: parseInt(e.target.value) || 1,
                      max: scoring?.scale?.max ?? 5
                    }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale-max">Valor Máximo</Label>
              <Input
                id="scale-max"
                type="number"
                value={scoring?.scale?.max ?? 5}
                onChange={(e) =>
                  onScoringChange({
                    ...scoring,
                    scale: {
                      ...scoring?.scale,
                      min: scoring?.scale?.min ?? 1,
                      max: parseInt(e.target.value) || 5
                    }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale-label-min">Label Mínimo</Label>
              <Input
                id="scale-label-min"
                value={scoring?.scale?.labels?.min || ''}
                onChange={(e) =>
                  onScoringChange({
                    ...scoring,
                    scale: {
                      ...scoring?.scale,
                      min: scoring?.scale?.min ?? 1,
                      max: scoring?.scale?.max ?? 5,
                      labels: {
                        ...scoring?.scale?.labels,
                        min: e.target.value
                      }
                    }
                  })
                }
                placeholder="Ex: Discordo totalmente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale-label-max">Label Máximo</Label>
              <Input
                id="scale-label-max"
                value={scoring?.scale?.labels?.max || ''}
                onChange={(e) =>
                  onScoringChange({
                    ...scoring,
                    scale: {
                      ...scoring?.scale,
                      min: scoring?.scale?.min ?? 1,
                      max: scoring?.scale?.max ?? 5,
                      labels: {
                        ...scoring?.scale?.labels,
                        max: e.target.value
                      }
                    }
                  })
                }
                placeholder="Ex: Concordo totalmente"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 border rounded-lg p-4">
          <Label>Ranges de Pontuação</Label>
          <p className="text-xs text-muted-foreground">
            Defina os intervalos de pontuação e seus significados (ex: Júnior, Pleno, Sênior)
          </p>

          {scoring?.ranges && scoring.ranges.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Mín</TableHead>
                  <TableHead>Máx</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoring.ranges.map((range) => (
                  <TableRow key={range.id}>
                    <TableCell>
                      <Input
                        value={range.label}
                        onChange={(e) => updateScoringRange(range.id, { label: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={range.min}
                        onChange={(e) => updateScoringRange(range.id, { min: parseFloat(e.target.value) })}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={range.max}
                        onChange={(e) => updateScoringRange(range.id, { max: parseFloat(e.target.value) })}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeScoringRange(range.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum range adicionado</p>
          )}

          <div className="grid grid-cols-4 gap-2">
            <Input
              value={newRangeLabel}
              onChange={(e) => setNewRangeLabel(e.target.value)}
              placeholder="Label (ex: Júnior)"
            />
            <Input
              type="number"
              value={newRangeMin}
              onChange={(e) => setNewRangeMin(e.target.value)}
              placeholder="Min"
            />
            <Input
              type="number"
              value={newRangeMax}
              onChange={(e) => setNewRangeMax(e.target.value)}
              placeholder="Max"
            />
            <Button onClick={addScoringRange} variant="outline" className="w-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
