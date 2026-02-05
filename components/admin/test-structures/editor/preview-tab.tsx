'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, RotateCcw, Eye, FlaskConical } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MatrixRatingQuestion } from '@/components/assessments/matrix-rating-question'
import { calculateResult } from '@/lib/assessment-calculator'
import type { TestStructureData, Question } from '@/lib/types/test-structure'

interface PreviewTabProps {
  structure: TestStructureData
}

export function PreviewTab({ structure }: PreviewTabProps) {
  const [isTestMode, setIsTestMode] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Flatten all questions across categories
  const allQuestions = structure.categories.flatMap(cat =>
    cat.questions.map(q => ({ ...q, categoryName: cat.name }))
  )

  const currentQuestion = allQuestions[currentQuestionIndex]
  const progress = allQuestions.length > 0 ? ((currentQuestionIndex + 1) / allQuestions.length) * 100 : 0

  // Detect test type for calculation
  const testType = detectTestType(structure)

  // Real-time calculation
  const previewResult = isTestMode && Object.keys(answers).length > 0 && testType
    ? calculateResult(testType, answers, { categories: structure.categories, scoring: structure.scoring })
    : null

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleReset = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
  }

  if (structure.categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Nenhuma estrutura para visualizar</p>
        <p className="text-sm text-muted-foreground mt-2">
          Adicione categorias e questões na aba Estrutura
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="flex gap-2">
          <Button
            variant={isTestMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTestMode(!isTestMode)}
          >
            {isTestMode ? (
              <>
                <FlaskConical className="w-4 h-4 mr-1" />
                Modo Teste ON
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Modo Leitura
              </>
            )}
          </Button>
          {isTestMode && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Test Mode */}
      {isTestMode ? (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {currentQuestionIndex + 1} / {allQuestions.length}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <Card className="p-6">
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">
                  Questão {currentQuestionIndex + 1} - {currentQuestion.categoryName}
                </span>
                <h4 className="text-xl font-semibold mt-2">{currentQuestion.text}</h4>
              </div>

              {/* Render interactive question based on type */}
              <InteractiveQuestion
                question={currentQuestion}
                globalScale={structure.scoring?.scale}
                answers={answers}
                onChange={handleAnswer}
              />

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === allQuestions.length - 1}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {/* Real-time Results */}
          {previewResult && (
            <Card className="p-4 bg-muted/50">
              <h4 className="font-semibold mb-2">📊 Resultado em Tempo Real</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(previewResult as any).profile && (
                  <div>
                    <span className="text-sm text-muted-foreground">Profile:</span>
                    <p className="text-2xl font-bold">{(previewResult as any).profile}</p>
                  </div>
                )}
                {(previewResult as any).scores && (
                  <div>
                    <span className="text-sm text-muted-foreground">Scores:</span>
                    <div className="flex gap-2 mt-1">
                      {Object.entries((previewResult as any).scores).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="font-bold">{key}</div>
                          <div className="text-sm">{value as any}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(previewResult as any).level && (
                  <div>
                    <span className="text-sm text-muted-foreground">Nível:</span>
                    <p className="text-lg font-semibold">{(previewResult as any).level}</p>
                  </div>
                )}
                {(previewResult as any).percentage !== undefined && (
                  <div>
                    <span className="text-sm text-muted-foreground">Porcentagem:</span>
                    <p className="text-lg font-semibold">{(previewResult as any).percentage}%</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        /* Read-only Mode (Original) */
        <>
          <div className="border rounded-lg p-6 bg-muted/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-medium">{structure.metadata?.name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {structure.metadata?.description || 'Sem descrição'}
                </p>
                {structure.metadata?.instructions && (
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    {structure.metadata.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {structure.categories.map((category, catIndex) => (
              <Card key={category.id}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {catIndex + 1}. {category.name}
                  </h3>
                  <div className="space-y-6">
                    {category.questions.map((question, qIndex) => (
                      <div key={question.id} className="space-y-3">
                        <Label className="text-sm font-medium">
                          {catIndex + 1}.{qIndex + 1} {question.text}
                          {question.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <QuestionPreview
                          question={question}
                          scale={structure.scoring?.scale}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">Resumo da Configuração</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Categorias:</span>
                <span className="ml-2 font-medium">{structure.categories.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total de Questões:</span>
                <span className="ml-2 font-medium">
                  {structure.categories.reduce((sum, cat) => sum + cat.questions.length, 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Método de Cálculo:</span>
                <span className="ml-2 font-medium">{structure.scoring?.method || 'sum'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Escala:</span>
                <span className="ml-2 font-medium">
                  {structure.scoring?.scale?.min || 1} - {structure.scoring?.scale?.max || 5}
                </span>
              </div>
            </div>

            {structure.scoring?.ranges && structure.scoring.ranges.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Ranges de Pontuação:</p>
                <div className="flex flex-wrap gap-2">
                  {structure.scoring.ranges.map((range) => (
                    <Badge key={range.id} variant="outline">
                      {range.label}: {range.min} - {range.max}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Interactive question component for test mode
function InteractiveQuestion({
  question,
  globalScale,
  answers,
  onChange
}: {
  question: Question
  globalScale?: { min: number; max: number }
  answers: Record<string, number>
  onChange: (questionId: string, value: number) => void
}) {
  switch (question.type) {
    case 'single_choice':
      return (
        <RadioGroup value={answers[question.id]?.toString()} onValueChange={(val) => onChange(question.id, Number(val))}>
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id.toString()} id={option.id} />
              <Label htmlFor={option.id} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case 'scale':
      const min = question.scale_descriptors?.[0]?.value || globalScale?.min || 1
      const max = question.scale_descriptors?.[question.scale_descriptors.length - 1]?.value || globalScale?.max || 5
      return (
        <div className="space-y-3">
          <Slider
            value={[answers[question.id] ?? Math.floor((min + max) / 2)]}
            onValueChange={([val]) => onChange(question.id, val)}
            min={min}
            max={max}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      )

    case 'matrix_rating':
      if (!question.matrix_config) return null

      return (
        <MatrixRatingQuestion
          questionId={question.id}
          questionText={question.text}
          matrixConfig={question.matrix_config}
          initialValues={answers}
          onChange={onChange}
          disabled={false}
        />
      )

    default:
      return (
        <p className="text-sm text-muted-foreground italic">
          Tipo de questão não suportado no modo teste: {question.type}
        </p>
      )
  }
}

// Original read-only preview component
function QuestionPreview({
  question,
  scale
}: {
  question: Question
  scale?: { min: number; max: number; labels?: { min?: string; max?: string } }
}) {
  switch (question.type) {
    case 'single_choice':
      return (
        <RadioGroup disabled>
          {question.options && question.options.length > 0 ? (
            question.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma opção configurada</p>
          )}
        </RadioGroup>
      )

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options && question.options.length > 0 ? (
            question.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox id={option.id} disabled />
                <Label htmlFor={option.id} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma opção configurada</p>
          )}
        </div>
      )

    case 'scale':
      const min = scale?.min || 1
      const max = scale?.max || 5
      return (
        <div className="space-y-3">
          <Slider
            defaultValue={[Math.floor((min + max) / 2)]}
            min={min}
            max={max}
            step={1}
            disabled
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{scale?.labels?.min || min}</span>
            <span>{scale?.labels?.max || max}</span>
          </div>
        </div>
      )

    case 'text':
      return (
        <Input
          placeholder={question.metadata?.placeholder || "Digite sua resposta..."}
          disabled
        />
      )

    case 'textarea':
      return (
        <Textarea
          placeholder={question.metadata?.placeholder || "Digite sua resposta..."}
          rows={3}
          disabled
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          placeholder={question.metadata?.placeholder || "Digite um número..."}
          disabled
        />
      )

    case 'matrix_rating':
      if (!question.matrix_config) {
        return (
          <p className="text-sm text-muted-foreground italic">
            Configuração de matriz não encontrada
          </p>
        )
      }
      return (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Escala: {question.matrix_config.scale.min} - {question.matrix_config.scale.max}
            </Badge>
            {question.matrix_config.validation?.unique_values && (
              <Badge variant="outline" className="text-xs">
                Use cada valor apenas uma vez
              </Badge>
            )}
          </div>
          {question.matrix_config.scale.descriptors && question.matrix_config.scale.descriptors.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {question.matrix_config.scale.descriptors.map((desc) => (
                <div key={desc.value} className="flex items-center gap-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {desc.value}
                  </Badge>
                  <span className="text-muted-foreground">{desc.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3 border-t pt-3">
            {question.matrix_config.statements.map((statement) => (
              <div key={statement.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  {statement.label && (
                    <Badge variant="secondary" className="mt-1 font-mono text-xs shrink-0">
                      {statement.label}
                    </Badge>
                  )}
                  <p className="text-sm flex-1">{statement.text}</p>
                </div>
                <div className="pl-8">
                  <Slider
                    defaultValue={[Math.floor(((question.matrix_config?.scale?.min ?? 1) + (question.matrix_config?.scale?.max ?? 5)) / 2)]}
                    min={question.matrix_config?.scale?.min ?? 1}
                    max={question.matrix_config?.scale?.max ?? 5}
                    step={1}
                    disabled
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{question.matrix_config?.scale?.min ?? 1}</span>
                    <span>{question.matrix_config?.scale?.max ?? 5}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return (
        <p className="text-sm text-muted-foreground italic">
          Tipo de questão não suportado: {question.type}
        </p>
      )
  }
}

// Helper to detect test type from structure
function detectTestType(structure: TestStructureData): 'disc' | 'seniority_seller' | 'seniority_leader' | 'def_method' | 'values_8d' | 'leadership_style' | null {
  const name = structure.metadata?.name?.toLowerCase() || ''

  if (name.includes('disc') || name.includes('comportamental')) return 'disc'
  if (name.includes('senioridade') && name.includes('vendedor')) return 'seniority_seller'
  if (name.includes('senioridade') && name.includes('líder')) return 'seniority_leader'
  if (name.includes('def') || name.includes('whatsapp')) return 'def_method'
  if (name.includes('valores') || name.includes('8d')) return 'values_8d'
  if (name.includes('liderança') || name.includes('leadership')) return 'leadership_style'

  return null
}
