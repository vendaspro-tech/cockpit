'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from "@/components/ui/switch"
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssessmentHero } from '@/components/assessments/assessment-hero'
import { MatrixRatingQuestion } from '@/components/assessments/matrix-rating-question'
import type { MatrixRatingConfig } from '@/lib/types/test-structure'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Question {
  id: string
  text: string
  weight?: number
  options?: { label: string; value: number }[]
  matrix_config?: MatrixRatingConfig  // Add support for matrix questions
}

interface Category {
  id: string
  name: string
  description?: string
  questions: Question[]
  justification_options?: string[]
}

interface TestStructure {
  title: string
  description: string
  categories: Category[]
  scoring_system?: Record<string, string>
}

interface AssessmentFormProps {
  structure: TestStructure
  assessmentId: string
  testType: string
  initialData?: any
  products?: Array<{ id: string; name: string }>
  onSave: (data: any, status: 'draft' | 'completed', forceComplete?: boolean) => Promise<void>
  isOwner?: boolean
  workspaceId: string
}

export function AssessmentForm({ structure, assessmentId, testType, initialData, products, onSave, isOwner = false, workspaceId }: AssessmentFormProps) {
  const router = useRouter()
  const initialAnswers = useMemo(() => initialData?.answers || {}, [initialData])
  const initialCategoryIndex = typeof initialData?.currentCategoryIndex === 'number' ? initialData.currentCategoryIndex : null
  const initialQuestionIndex = typeof initialData?.currentQuestionIndex === 'number' ? initialData.currentQuestionIndex : null

  const computeResumePosition = useMemo(() => {
    return (categories: Category[], answers: Record<string, number>) => {
      const flat: Array<{ ci: number; qi: number; id: string }> = []
      categories.forEach((cat, ci) => {
        cat.questions.forEach((q, qi) => {
          flat.push({ ci, qi, id: String(q.id) })
        })
      })

      if (flat.length === 0) return { categoryIndex: 0, questionIndex: 0 }

      let lastAnsweredIndex = -1
      flat.forEach((item, idx) => {
        if (answers.hasOwnProperty(item.id)) {
          lastAnsweredIndex = idx
        }
      })

      // Retoma na próxima pergunta após a última respondida; se nenhuma, início
      const targetIndex =
        lastAnsweredIndex >= 0
          ? Math.min(lastAnsweredIndex + 1, flat.length - 1)
          : 0
      const target = flat[targetIndex]
      return { categoryIndex: target.ci, questionIndex: target.qi }
    }
  }, [])

  const resumePosition = useMemo(
    () => computeResumePosition(structure.categories, initialAnswers),
    [structure.categories, initialAnswers, computeResumePosition]
  )

  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers)
  
  // Parse initial comments to separate justification and additional comments
  const [justifications, setJustifications] = useState<Record<string, string>>(() => {
    const initComments = initialData?.comments || {}
    const justifs: Record<string, string> = {}
    
    if (testType === 'def_method') {
      Object.entries(initComments).forEach(([qId, fullComment]) => {
        if (typeof fullComment === 'string') {
          // Regex without 's' flag: match [Justificativa: ...] then anything else
          const match = fullComment.match(/^\[Justificativa: (.*?)\]([\s\S]*)$/)
          if (match) {
            justifs[qId] = match[1]
          }
        }
      })
    }
    return justifs
  })

  const [comments, setComments] = useState<Record<string, string>>(() => {
    const initComments = initialData?.comments || {}
    const comms: Record<string, string> = {}
    
    if (testType === 'def_method') {
      Object.entries(initComments).forEach(([qId, fullComment]) => {
        if (typeof fullComment === 'string') {
          const match = fullComment.match(/^\[Justificativa: (.*?)\]([\s\S]*)$/)
          if (match) {
            comms[qId] = match[2].trim()
          } else {
            comms[qId] = fullComment
          }
        }
      })
    } else {
      return initComments
    }
    return comms
  })

  const [selectedProduct, setSelectedProduct] = useState<string>(initialData?.product_id || 'none')
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(
    initialCategoryIndex ?? resumePosition.categoryIndex
  )
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialQuestionIndex ?? resumePosition.questionIndex
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [forceComplete, setForceComplete] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)

  const categories = structure.categories
  const currentCategory = categories[currentCategoryIndex]

  useEffect(() => {
    if (categories.length === 0) return
    if (!categories[currentCategoryIndex]) {
      setCurrentCategoryIndex(0)
      setCurrentQuestionIndex(0)
      return
    }

    const maxQuestionIndex = Math.max(categories[currentCategoryIndex].questions.length - 1, 0)
    if (currentQuestionIndex > maxQuestionIndex) {
      setCurrentQuestionIndex(maxQuestionIndex)
    }
  }, [categories, currentCategoryIndex, currentQuestionIndex])

  // Calculate progress
  const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0)

  // Count answered questions (matrix questions need all statements answered)
  const answeredQuestions = categories.reduce((count, cat) => {
    return count + cat.questions.filter(q => {
      if (q.matrix_config) {
        // For matrix questions, check if all statements are answered
        return q.matrix_config.statements.every(stmt =>
          answers.hasOwnProperty(`${q.id}_${stmt.id}`)
        )
      } else {
        // For regular questions, check if the question ID exists in answers
        return answers.hasOwnProperty(q.id)
      }
    }).length
  }, 0)

  const progress = (answeredQuestions / totalQuestions) * 100

  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const buildPayload = (overrides: {
    answers?: Record<string, number>
    comments?: Record<string, string>
    justifications?: Record<string, string>
    product?: string
    categoryIndex?: number
    questionIndex?: number
  } = {}) => {
    const mergedAnswers = overrides.answers ?? answers
    const mergedComments = overrides.comments ?? comments
    const mergedJustifications = overrides.justifications ?? justifications
    const productValue = overrides.product ?? selectedProduct

    const finalComments = { ...mergedComments }
    if (testType === 'def_method') {
      Object.keys(mergedJustifications).forEach(qId => {
        const justif = mergedJustifications[qId]
        const comm = mergedComments[qId] || ''
        finalComments[qId] = justif ? `[Justificativa: ${justif}] ${comm}`.trim() : comm
      })
    }

    return {
      answers: mergedAnswers,
      comments: finalComments,
      currentCategoryIndex: overrides.categoryIndex ?? currentCategoryIndex,
      currentQuestionIndex: overrides.questionIndex ?? currentQuestionIndex,
      product_id: productValue === 'none' ? null : productValue
    }
  }

  const scheduleAutoSave = (overrides: Parameters<typeof buildPayload>[0] = {}) => {
    if (isSubmitting) return
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    const payload = buildPayload(overrides)

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(payload, 'draft', forceComplete)
      } catch (e) {
        console.error('Auto-save failed:', e)
      } finally {
      }
    }, 800)
  }

  // Clear timeout on unmount or navigation
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [currentQuestionIndex, currentCategoryIndex])

  // Prevent accidental exit if there is progress (draft)
  const hasProgress = useMemo(() => {
    return (
      Object.keys(answers).length > 0 ||
      Object.keys(comments).length > 0 ||
      (testType === 'def_method' && Object.keys(justifications).length > 0) ||
      selectedProduct !== 'none'
    )
  }, [answers, comments, justifications, selectedProduct, testType])

  useEffect(() => {
    if (!hasProgress || isSubmitting) return
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?'
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [hasProgress, isSubmitting])

  const exitPath =
    testType === 'def_method'
      ? `/${workspaceId}/def`
      : `/${workspaceId}/assessments`

  const handleExit = () => {
    if (hasProgress) {
      setShowExitDialog(true)
      return
    }
    router.push(exitPath)
  }

  const confirmExit = async () => {
    setShowExitDialog(false)
    try {
      const payload = buildPayload()
      await onSave(payload, 'draft', forceComplete)
    } catch (error) {
      console.error('Error saving draft before exit:', error)
    }
    router.push(exitPath)
  }

  const handleAnswer = (questionId: string, value: number) => {
    const nextAnswers = { ...answers, [questionId]: value }
    setAnswers(nextAnswers)
    scheduleAutoSave({ answers: nextAnswers })
    
    // Auto-advance to next question after answering
    if (autoAdvance) {
      // Clear existing timeout to avoid double skips
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
      }

      autoAdvanceTimeoutRef.current = setTimeout(() => {
        const currentCategory = categories[currentCategoryIndex]
        const isLastQuestionInCategory = currentQuestionIndex >= currentCategory.questions.length - 1
        
        if (isLastQuestionInCategory) {
          // Last question in category - move to next category
          if (currentCategoryIndex < categories.length - 1) {
            nextCategory()
          }
          // If last question of last category, stay on it
        } else {
          // Move to next question in same category
          nextQuestion()
        }
      }, 300) // Small delay for visual feedback
    }
  }

  const handleComment = (questionId: string, value: string) => {
    const nextComments = { ...comments, [questionId]: value }
    setComments(nextComments)
    scheduleAutoSave({ comments: nextComments })
  }

  const handleJustification = (questionId: string, value: string) => {
    const nextJustifications = { ...justifications, [questionId]: value }
    setJustifications(nextJustifications)
    scheduleAutoSave({ justifications: nextJustifications })
  }

  const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
    if (status === 'draft') setIsSaving(true)
    else setIsSubmitting(true)

    try {
      const payload = buildPayload()
      await onSave(payload, status, forceComplete)
    } finally {
      setIsSaving(false)
      setIsSubmitting(false)
    }
  }

  const nextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      const nextCat = currentCategoryIndex + 1
      setCurrentCategoryIndex(nextCat)
      setCurrentQuestionIndex(0) // Reset to first question of new category
      scheduleAutoSave({ categoryIndex: nextCat, questionIndex: 0 })
    }
  }

  const prevCategory = () => {
    if (currentCategoryIndex > 0) {
      const prevCat = currentCategoryIndex - 1
      setCurrentCategoryIndex(prevCat)
      setCurrentQuestionIndex(0) // Reset to first question of previous category
      scheduleAutoSave({ categoryIndex: prevCat, questionIndex: 0 })
    }
  }

  // Navigate between questions
  const nextQuestion = () => {
    const currentCategory = categories[currentCategoryIndex]
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        const nextQ = prev + 1
        scheduleAutoSave({ questionIndex: nextQ })
        return nextQ
      })
    } else if (currentCategoryIndex < categories.length - 1) {
      const nextCat = currentCategoryIndex + 1
      setCurrentCategoryIndex(nextCat)
      setCurrentQuestionIndex(0)
      scheduleAutoSave({ categoryIndex: nextCat, questionIndex: 0 })
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => {
        const nextQ = prev - 1
        scheduleAutoSave({ questionIndex: nextQ })
        return nextQ
      })
    } else if (currentCategoryIndex > 0) {
      const prevCat = currentCategoryIndex - 1
      setCurrentCategoryIndex(prevCat)
      const prevCategory = categories[currentCategoryIndex - 1]
      const lastQ = prevCategory.questions.length - 1
      setCurrentQuestionIndex(lastQ)
      scheduleAutoSave({ categoryIndex: prevCat, questionIndex: lastQ })
    }
  }

  const isLastCategory = currentCategoryIndex === categories.length - 1
  const allQuestionsAnswered = answeredQuestions === totalQuestions

  // Helper to check if current question is fully answered
  const isCurrentQuestionAnswered = (question: Question) => {
    if (question.matrix_config) {
      // For matrix questions, all statements must be answered
      return question.matrix_config.statements.every(stmt =>
        answers.hasOwnProperty(`${question.id}_${stmt.id}`)
      )
    } else {
      // For regular questions, check if answer exists
      return answers.hasOwnProperty(question.id)
    }
  }

  // Helper to get options for a question
  const getOptions = (question: Question) => {
    if (question.options) return question.options
    
    // Check for global scale in structure
    const scale = (structure as any).scale
    if (scale) {
      const options = []
      for (let i = scale.min; i <= scale.max; i++) {
        options.push({
          value: i,
          label: scale.labels?.[i.toString()] || i.toString()
        })
      }
      return options
    }

    // Default fallback 1-4
    return [
      { value: 1, label: "Nunca / Fraco" },
      { value: 2, label: "Às vezes / Regular" },
      { value: 3, label: "Frequentemente / Bom" },
      { value: 4, label: "Sempre / Excelente" }
    ]
  }

  // Product selection state
  const handleProductSelection = () => {
    scheduleAutoSave({ product: selectedProduct })
  }

  const showProductSelection = testType === 'def_method' && selectedProduct === 'none' && !initialData?.product_id && currentCategoryIndex === 0 && currentQuestionIndex === 0 && Object.keys(answers).length === 0

  // Calculate global question number
  const globalQuestionNumber = categories.slice(0, currentCategoryIndex).reduce((acc, cat) => acc + cat.questions.length, 0) + currentQuestionIndex + 1

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 pb-12">
      {/* Hero + Navigation - Sticky */}
      <div className="shrink-0 bg-background z-50 sticky top-0 pb-4 -mx-4 px-4 mb-2">
        <div className="flex items-start justify-between gap-3">
          <AssessmentHero
            testType={testType}
            testTitle={structure.title}
            testDescription={structure.description}
            currentCategory={showProductSelection ? "Configuração Inicial" : currentCategory.name}
            categoryIndex={currentCategoryIndex}
            totalCategories={categories.length}
            progress={showProductSelection ? 0 : progress}
            answeredQuestions={answeredQuestions}
            totalQuestions={totalQuestions}
            currentQuestionNumber={showProductSelection ? 0 : globalQuestionNumber}
            workspaceId={workspaceId}
            hideProgress={showProductSelection}
          />
          <Button variant="ghost" size="sm" onClick={handleExit} className="mt-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Questions Content */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Product Selection Screen */}
          {showProductSelection ? (
            <Card className="border-none shadow-xl bg-card ring-1 ring-border/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 md:p-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                    Selecione o produto avaliado
                  </h4>
                  <p className="text-muted-foreground">
                    Para uma análise mais precisa na Matriz DEF, vincule esta avaliação a um produto específico. Se preferir, você pode prosseguir sem selecionar nenhum produto.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Produto</Label>
                  <Select value={selectedProduct} onValueChange={(val) => { setSelectedProduct(val); scheduleAutoSave({ product: val }) }}>
                    <SelectTrigger className="w-full h-12 text-lg">
                      <SelectValue placeholder="Selecione um produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não vincular a nenhum produto</SelectItem>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/10 flex justify-end">
                <Button 
                  size="lg" 
                  onClick={handleProductSelection}
                  className="min-w-[140px] shadow-lg hover:shadow-xl transition-all"
                >
                  Iniciar Avaliação
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ) : (
            /* Single Question View */
            (() => {
              const currentQuestion = currentCategory?.questions?.[currentQuestionIndex]
              
              if (!currentQuestion) {
                return <div className="p-4 text-center text-muted-foreground">Questão não encontrada.</div>
              }

              const options = getOptions(currentQuestion)
              const totalQuestionsInCategory = currentCategory.questions.length
              const isFirstQuestion = currentQuestionIndex === 0 && currentCategoryIndex === 0
              const isLastQuestion = currentQuestionIndex === totalQuestionsInCategory - 1 && isLastCategory
              
              return (
                <div className="space-y-4">
                  {/* Auto Advance Toggle - Right Aligned */}
                  <div className="flex justify-end mb-1">
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                      <Label htmlFor="auto-advance-generic" className="text-xs font-medium text-muted-foreground cursor-pointer uppercase tracking-wider">
                        Avanço automático
                      </Label>
                      <Switch
                        id="auto-advance-generic"
                        checked={autoAdvance}
                        onCheckedChange={setAutoAdvance}
                        className="scale-75 origin-right"
                      />
                    </div>
                  </div>

                  {/* Question Card */}
                  <Card className="border-none shadow-xl bg-card ring-1 ring-border/50 overflow-hidden">
                  <div className="p-4 md:p-6 space-y-4">
                    <h4 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                      {currentQuestion.text}
                    </h4>

                    {/* Conditional rendering based on question type */}
                    {currentQuestion.matrix_config ? (
                      /* Matrix Rating Question */
                      <MatrixRatingQuestion
                        questionId={currentQuestion.id}
                        questionText={currentQuestion.text}
                        matrixConfig={currentQuestion.matrix_config}
                        initialValues={
                          // Extract values for this question's statements
                          Object.fromEntries(
                            Object.entries(answers)
                              .filter(([key]) => key.startsWith(`${currentQuestion.id}_`))
                              .map(([key, value]) => [key.replace(`${currentQuestion.id}_`, ''), value])
                          )
                        }
                        onChange={(statementId, value) => {
                          // Store with composite ID: questionId_statementId
                          handleAnswer(`${currentQuestion.id}_${statementId}`, value)
                        }}
                      />
                    ) : (
                      /* Regular RadioGroup Question */
                      <RadioGroup
                        value={answers[currentQuestion.id]?.toString() || ''}
                        onValueChange={(val) => handleAnswer(currentQuestion.id, parseInt(val))}
                        className="grid grid-cols-1 gap-3 pt-2"
                      >
                        {options.map((option) => {
                          const isSelected = answers[currentQuestion.id] === option.value
                          return (
                            <div key={option.value} className="relative group">
                              <RadioGroupItem
                                value={option.value.toString()}
                                id={`q-${currentQuestion.id}-opt-${option.value}`}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={`q-${currentQuestion.id}-opt-${option.value}`}
                                className={cn(
                                  "flex items-center w-full p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                                )}
                              >
                                {/* Indicador Numérico */}
                                <div className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full mr-4 font-bold text-sm transition-colors shrink-0",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                )}>
                                  {option.value}
                                </div>
                                <span className={cn(
                                  "text-base md:text-lg transition-colors",
                                  isSelected ? "text-foreground font-medium" : "text-foreground/80"
                                )}>
                                  {option.label}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="ml-auto w-5 h-5 text-primary animate-in zoom-in" />
                                )}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    )}

                    {/* Observation/Justification */}
                    <div>
                      {testType === 'def_method' && currentCategory.justification_options ? (
                        <>
                          <Label htmlFor={`justification-${currentQuestion.id}`} className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                            Justificativa da Nota
                          </Label>
                          <Select 
                            value={justifications[currentQuestion.id] || ''} 
                            onValueChange={(value) => handleJustification(currentQuestion.id, value)}
                          >
                            <SelectTrigger className="w-full bg-muted/30 border-border/50 focus:bg-background transition-colors h-10">
                              <SelectValue placeholder="Selecione uma justificativa..." />
                            </SelectTrigger>
                            <SelectContent>
                              {currentCategory.justification_options?.map((option, idx) => (
                                <SelectItem key={idx} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                              <SelectItem value="other">Outro (Descrever abaixo)</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="mt-2">
                             <Label htmlFor={`comment-${currentQuestion.id}`} className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                              Comentário Adicional (Opcional)
                            </Label>
                            <Textarea
                              id={`comment-${currentQuestion.id}`}
                              value={comments[currentQuestion.id] || ''} 
                              onChange={(e) => handleComment(currentQuestion.id, e.target.value)}
                              placeholder="Adicione observações..."
                              className="min-h-[50px] text-sm bg-muted/30 border-border/50 focus:bg-background transition-colors"
                            />
                          </div>
                        </>
                      ) : testType !== 'values_8d' ? (
                        <>
                          <Label htmlFor={`comment-${currentQuestion.id}`} className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                            Observações (opcional)
                          </Label>
                          <Textarea
                            id={`comment-${currentQuestion.id}`}
                            value={comments[currentQuestion.id] || ''}
                            onChange={(e) => handleComment(currentQuestion.id, e.target.value)}
                            placeholder="Adicione observações..."
                            className="min-h-[50px] text-sm bg-muted/30 border-border/50 focus:bg-background transition-colors"
                          />
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-border/50 bg-muted/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={prevQuestion}
                          disabled={isFirstQuestion}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Anterior
                        </Button>
                      </div>

                      {!isLastQuestion ? (
                        <Button
                          onClick={nextQuestion}
                          disabled={!isCurrentQuestionAnswered(currentQuestion) || (testType === 'def_method' && currentCategory.justification_options && !justifications[currentQuestion.id])}
                          size="lg"
                          className="min-w-[140px] shadow-lg hover:shadow-xl transition-all"
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSave('completed')}
                          disabled={!allQuestionsAnswered || isSaving || isSubmitting || (testType === 'def_method' && currentCategory.justification_options && !justifications[currentQuestion.id])}
                          size="lg"
                          className="min-w-[140px] shadow-lg hover:shadow-xl transition-all bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Finalizando...
                            </>
                          ) : (
                            <>
                              Finalizar
                              <Check className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {/* Owner Force Complete Option */}
                    {isOwner && isLastCategory && ['seniority_seller', 'seniority_leader'].includes(testType) && (
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="forceComplete"
                            checked={forceComplete}
                            onChange={(e) => setForceComplete(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="forceComplete"
                            className="text-sm text-gray-600 cursor-pointer select-none"
                          >
                            Concluir avaliação imediatamente (Sou o responsável)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
              )
            })()
          )}
      </div>
    </div>

    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair e manter rascunho?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem respostas não finalizadas. Se sair agora, o rascunho será mantido. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ficar e continuar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmExit}>Sair e manter rascunho</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
