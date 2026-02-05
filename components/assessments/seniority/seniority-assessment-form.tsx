'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { saveSeniorityScores, submitSeniorityAssessment } from '@/app/actions/seniority-assessments'
import type { CompetencyDefinition, CompetencyFramework, SeniorityAssessment } from '@/lib/types/competency'

interface SeniorityAssessmentFormProps {
  assessment: SeniorityAssessment
  framework: CompetencyFramework
  workspaceId: string
}

type TabType = 'behavioral' | 'technical_def' | 'process'

const SCORE_LABELS = {
  1: 'Nível 1',
  2: 'Nível 2',
  3: 'Nível 3',
}

export function SeniorityAssessmentForm({
  assessment,
  framework,
  workspaceId,
}: SeniorityAssessmentFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('behavioral')
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Scores state
  const [behavioralScores, setBehavioralScores] = useState<Record<string, number>>(
    assessment.behavioral_scores || {}
  )
  const [technicalDefScores, setTechnicalDefScores] = useState<Record<string, number>>(
    assessment.technical_def_scores || {}
  )
  const [processScores, setProcessScores] = useState<Record<string, number>>(
    assessment.process_scores || {}
  )

  // Comments state
  const [behavioralComments, setBehavioralComments] = useState(
    assessment.behavioral_comments || ''
  )
  const [technicalDefComments, setTechnicalDefComments] = useState(
    assessment.technical_def_comments || ''
  )
  const [processComments, setProcessComments] = useState(
    assessment.process_comments || ''
  )

  const behavioralCompetencies = framework.behavioral_competencies ?? []
  const technicalCompetencies = framework.technical_def_competencies ?? []
  const processCompetencies = framework.process_competencies ?? []
  const weights = framework.weights ?? { behavioral: 0, technical_def: 0, process: 0 }

  // Calculate progress
  const behavioralTotal = behavioralCompetencies.length
  const technicalDefTotal = technicalCompetencies.length
  const processTotal = processCompetencies.length

  const behavioralAnswered = Object.keys(behavioralScores).filter(k => behavioralScores[k] > 0).length
  const technicalDefAnswered = Object.keys(technicalDefScores).filter(k => technicalDefScores[k] > 0).length
  const processAnswered = Object.keys(processScores).filter(k => processScores[k] > 0).length

  const totalCompetencies = behavioralTotal + technicalDefTotal + processTotal
  const totalAnswered = behavioralAnswered + technicalDefAnswered + processAnswered
  const progressPercent = totalCompetencies > 0 ? (totalAnswered / totalCompetencies) * 100 : 0

  const isComplete = totalCompetencies > 0 && totalAnswered === totalCompetencies

  const handleAutoSave = useCallback(async () => {
    if (assessment.status !== 'draft') return
    if (isSaving || isSubmitting) return

    try {
      setIsSaving(true)
      await saveSeniorityScores(assessment.id, {
        behavioral_scores: behavioralScores,
        technical_def_scores: technicalDefScores,
        process_scores: processScores,
        behavioral_comments: behavioralComments,
        technical_def_comments: technicalDefComments,
        process_comments: processComments,
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save error:', error)
      // Silent fail for auto-save
    } finally {
      setIsSaving(false)
    }
  }, [
    assessment.id,
    assessment.status,
    behavioralComments,
    behavioralScores,
    isSaving,
    isSubmitting,
    processComments,
    processScores,
    technicalDefComments,
    technicalDefScores,
  ])

  // Auto-save with debounce
  useEffect(() => {
    if (assessment.status !== 'draft') return
    
    const timer = setTimeout(() => {
      handleAutoSave()
    }, 5000) // 5 seconds debounce

    return () => clearTimeout(timer)
  }, [
    behavioralScores,
    technicalDefScores,
    processScores,
    behavioralComments,
    technicalDefComments,
    processComments,
    handleAutoSave,
    assessment.status,
  ])

  const handleManualSave = async () => {
    try {
      setIsSaving(true)
      await saveSeniorityScores(assessment.id, {
        behavioral_scores: behavioralScores,
        technical_def_scores: technicalDefScores,
        process_scores: processScores,
        behavioral_comments: behavioralComments,
        technical_def_comments: technicalDefComments,
        process_comments: processComments,
      })
      setLastSaved(new Date())
      toast.success('Rascunho salvo com sucesso!')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Erro ao salvar rascunho')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error('Por favor, responda todas as competências antes de submeter.')
      return
    }

    try {
      setIsSubmitting(true)

      // Save final state
      await saveSeniorityScores(assessment.id, {
        behavioral_scores: behavioralScores,
        technical_def_scores: technicalDefScores,
        process_scores: processScores,
        behavioral_comments: behavioralComments,
        technical_def_comments: technicalDefComments,
        process_comments: processComments,
      })

      // Submit assessment
      await submitSeniorityAssessment(assessment.id, assessment.assessment_type as 'self' | 'leader')

      toast.success('Avaliação submetida com sucesso!')
      router.push(`/${workspaceId}/assessments/seniority-v2`)
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Erro ao submeter avaliação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScoreChange = (dimension: TabType, competencyId: string | number, score: number) => {
    const key = competencyId.toString()

    if (dimension === 'behavioral') {
      setBehavioralScores(prev => ({ ...prev, [key]: score }))
    } else if (dimension === 'technical_def') {
      setTechnicalDefScores(prev => ({ ...prev, [key]: score }))
    } else if (dimension === 'process') {
      setProcessScores(prev => ({ ...prev, [key]: score }))
    }
  }

  const renderCompetency = (
    competency: CompetencyDefinition & {
      levels?: { level: number; description: string }[] | Record<string, string>
    },
    dimension: TabType
  ) => {
    const scores = dimension === 'behavioral' ? behavioralScores : dimension === 'technical_def' ? technicalDefScores : processScores
    const currentScore = scores[competency.id.toString()] || 0
    const levelEntries = Array.isArray(competency.levels)
      ? competency.levels
      : Object.entries(competency.levels ?? {}).map(([level, description]) => ({
          level: Number(level),
          description,
        }))

    return (
      <Card key={competency.id} className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {competency.name}
            {currentScore > 0 && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </CardTitle>
          <CardDescription>{competency.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level descriptions */}
          <div className="space-y-2 border-l-2 border-muted pl-4">
            {levelEntries.map((level) => (
              <div key={level.level} className="text-sm">
                <span className="font-medium">Nível {level.level}:</span>{' '}
                <span className="text-muted-foreground">{level.description}</span>
              </div>
            ))}
          </div>

          {/* Score selection */}
          <div className="space-y-2">
            <Label>Selecione o nível atual:</Label>
            <RadioGroup
              value={currentScore.toString()}
              onValueChange={(value) => handleScoreChange(dimension, competency.id, parseInt(value))}
            >
              {[1, 2, 3].map((score) => (
                <div key={score} className="flex items-center space-x-2">
                  <RadioGroupItem value={score.toString()} id={`${competency.id}-${score}`} />
                  <Label htmlFor={`${competency.id}-${score}`} className="font-normal cursor-pointer">
                    {SCORE_LABELS[score as keyof typeof SCORE_LABELS]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTab = (
    dimension: TabType,
    competencies: CompetencyDefinition[],
    comments: string,
    setComments: (value: string) => void,
    answered: number,
    total: number,
    title: string,
    description: string
  ) => {
    const tabProgress = total > 0 ? (answered / total) * 100 : 0
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
          <div className="mt-2 flex items-center gap-2">
            <Progress value={tabProgress} className="flex-1" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {answered}/{total}
            </span>
          </div>
        </div>

        {/* Competencies */}
        <div>
          {competencies.map((competency) => renderCompetency(competency, dimension))}
        </div>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comentários Gerais (Opcional)</CardTitle>
            <CardDescription>
              Adicione observações ou contexto adicional sobre esta dimensão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Digite seus comentários aqui..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progresso Geral</CardTitle>
              <CardDescription>
                {isComplete ? 'Avaliação completa!' : `${totalAnswered} de ${totalCompetencies} competências respondidas`}
              </CardDescription>
            </div>
            <div className="text-right">
              {lastSaved && (
                <p className="text-xs text-muted-foreground">
                  Último salvamento: {lastSaved.toLocaleTimeString()}
                </p>
              )}
              {isSaving && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Salvando...
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Info Alert */}
      {assessment.status === 'draft' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Suas respostas são salvas automaticamente. Você pode sair e voltar a qualquer momento para continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="behavioral" className="relative">
            Comportamental ({behavioralAnswered}/{behavioralTotal})
            {behavioralAnswered === behavioralTotal && (
              <CheckCircle2 className="h-3 w-3 text-green-600 absolute top-1 right-1" />
            )}
          </TabsTrigger>
          <TabsTrigger value="technical_def" className="relative">
            Técnica DEF ({technicalDefAnswered}/{technicalDefTotal})
            {technicalDefAnswered === technicalDefTotal && (
              <CheckCircle2 className="h-3 w-3 text-green-600 absolute top-1 right-1" />
            )}
          </TabsTrigger>
          <TabsTrigger value="process" className="relative">
            Processos ({processAnswered}/{processTotal})
            {processAnswered === processTotal && (
              <CheckCircle2 className="h-3 w-3 text-green-600 absolute top-1 right-1" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavioral" className="mt-6">
          {renderTab(
            'behavioral',
            behavioralCompetencies,
            behavioralComments,
            setBehavioralComments,
            behavioralAnswered,
            behavioralTotal,
            'Competências Comportamentais',
            `Peso: ${weights.behavioral * 100}% - Avalie as soft skills e comportamentos`
          )}
        </TabsContent>

        <TabsContent value="technical_def" className="mt-6">
          {renderTab(
            'technical_def',
            technicalCompetencies,
            technicalDefComments,
            setTechnicalDefComments,
            technicalDefAnswered,
            technicalDefTotal,
            'Competências Técnicas DEF',
            `Peso: ${weights.technical_def * 100}% - Avalie as habilidades técnicas de vendas`
          )}
        </TabsContent>

        <TabsContent value="process" className="mt-6">
          {renderTab(
            'process',
            processCompetencies,
            processComments,
            setProcessComments,
            processAnswered,
            processTotal,
            'Competências de Processos',
            `Peso: ${weights.process * 100}% - Avalie o conhecimento e execução de processos`
          )}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/${workspaceId}/assessments/seniority-v2`)}
              disabled={isSaving || isSubmitting}
            >
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleManualSave}
                disabled={isSaving || isSubmitting || assessment.status !== 'draft'}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Rascunho
                  </>
                )}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!isComplete || isSaving || isSubmitting || assessment.status !== 'draft'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submetendo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Finalizar Avaliação
                  </>
                )}
              </Button>
            </div>
          </div>

          {!isComplete && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Responda todas as competências para poder submeter a avaliação
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
