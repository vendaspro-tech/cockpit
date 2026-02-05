'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AssessmentRadarChart } from '@/components/charts/assessment-radar-chart'
import { ArrowLeft, TrendingUp, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SeniorityAssessment, CompetencyFramework, SeniorityLevel } from '@/lib/types/competency'

interface SeniorityResultsViewProps {
  assessment: SeniorityAssessment
  framework: CompetencyFramework
  workspaceId: string
  comparisonAssessment?: SeniorityAssessment // For comparing self vs leader
}

const LEVEL_CONFIG: Record<SeniorityLevel, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  junior: {
    label: 'Júnior',
    variant: 'secondary',
    color: '#94a3b8',
  },
  pleno: {
    label: 'Pleno',
    variant: 'default',
    color: '#3b82f6',
  },
  senior: {
    label: 'Sênior',
    variant: 'default',
    color: '#10b981',
  },
}

const STATUS_LABELS: Record<SeniorityAssessment['status'], string> = {
  draft: 'Rascunho',
  self_submitted: 'Auto submetida',
  leader_submitted: 'Submetida pelo líder',
  calibrated: 'Calibrada',
  cancelled: 'Cancelada',
}

export function SeniorityResultsView({
  assessment,
  framework,
  workspaceId,
  comparisonAssessment,
}: SeniorityResultsViewProps) {
  const router = useRouter()
  const weights = framework.weights ?? { behavioral: 1, technical_def: 1, process: 1 }
  const behavioralCompetencies = framework.behavioral_competencies ?? []
  const technicalCompetencies = framework.technical_def_competencies ?? []
  const processCompetencies = framework.process_competencies ?? []
  const normalizeScore = (value: number | null | undefined, weight: number) => {
    if (!value || weight <= 0) {
      return 0
    }
    return value / weight
  }

  // Prepare radar chart data
  const radarData = [
    {
      subject: 'Comportamental',
      A: normalizeScore(assessment.behavioral_total, weights.behavioral),
      B:
        comparisonAssessment?.behavioral_total != null
          ? normalizeScore(comparisonAssessment.behavioral_total, weights.behavioral)
          : undefined,
      fullMark: 100,
    },
    {
      subject: 'Técnica DEF',
      A: normalizeScore(assessment.technical_def_total, weights.technical_def),
      B:
        comparisonAssessment?.technical_def_total != null
          ? normalizeScore(comparisonAssessment.technical_def_total, weights.technical_def)
          : undefined,
      fullMark: 100,
    },
    {
      subject: 'Processos',
      A: normalizeScore(assessment.process_total, weights.process),
      B:
        comparisonAssessment?.process_total != null
          ? normalizeScore(comparisonAssessment.process_total, weights.process)
          : undefined,
      fullMark: 100,
    },
  ]

  const globalLevel = assessment.global_level || 'junior'
  const globalLevelConfig = LEVEL_CONFIG[globalLevel]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resultados da Avaliação</h1>
          <p className="text-muted-foreground">
            Período: {assessment.assessment_period}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/${workspaceId}/assessments/seniority-v2`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Global Level Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Nível Global de Senioridade</CardTitle>
              <CardDescription>
                Baseado na avaliação de {behavioralCompetencies.length + technicalCompetencies.length + processCompetencies.length} competências
              </CardDescription>
            </div>
            <Award className="h-12 w-12 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={globalLevelConfig.variant}
              className="text-2xl px-6 py-3"
            >
              {globalLevelConfig.label}
            </Badge>
            <div>
              <p className="text-sm text-muted-foreground">Score Global</p>
              <p className="text-3xl font-bold">{assessment.global_score?.toFixed(1) || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral por Dimensão</CardTitle>
          <CardDescription>
            {comparisonAssessment
              ? 'Comparação entre auto-avaliação e avaliação do líder'
              : 'Distribuição de competências nas três dimensões'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssessmentRadarChart
            data={radarData}
            title={comparisonAssessment ? 'Auto-avaliação vs Líder' : 'Perfil de Competências'}
            description={`Avaliação de ${assessment.assessment_type === 'self' ? 'Auto-avaliação' : 'Líder'}`}
          />
        </CardContent>
      </Card>

      {/* Dimension Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Behavioral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comportamental</CardTitle>
            <CardDescription>
              Peso: {weights.behavioral * 100}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nível:</span>
              <Badge variant={LEVEL_CONFIG[assessment.behavioral_level || 'junior'].variant}>
                {LEVEL_CONFIG[assessment.behavioral_level || 'junior'].label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score:</span>
              <span className="font-bold">
                {normalizeScore(assessment.behavioral_total, weights.behavioral).toFixed(1)}/100
              </span>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              {behavioralCompetencies.length} competências avaliadas
            </div>
          </CardContent>
        </Card>

        {/* Technical DEF */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Técnica DEF</CardTitle>
            <CardDescription>
              Peso: {weights.technical_def * 100}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nível:</span>
              <Badge variant={LEVEL_CONFIG[assessment.technical_def_level || 'junior'].variant}>
                {LEVEL_CONFIG[assessment.technical_def_level || 'junior'].label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score:</span>
              <span className="font-bold">
                {normalizeScore(assessment.technical_def_total, weights.technical_def).toFixed(1)}/100
              </span>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              {technicalCompetencies.length} competências avaliadas
            </div>
          </CardContent>
        </Card>

        {/* Process */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processos</CardTitle>
            <CardDescription>
              Peso: {weights.process * 100}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nível:</span>
              <Badge variant={LEVEL_CONFIG[assessment.process_level || 'junior'].variant}>
                {LEVEL_CONFIG[assessment.process_level || 'junior'].label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score:</span>
              <span className="font-bold">
                {normalizeScore(assessment.process_total, weights.process).toFixed(1)}/100
              </span>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              {processCompetencies.length} competências avaliadas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments Section */}
      {(assessment.behavioral_comments || assessment.technical_def_comments || assessment.process_comments) && (
        <Card>
          <CardHeader>
            <CardTitle>Comentários e Observações</CardTitle>
            <CardDescription>
              Notas adicionadas durante a avaliação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessment.behavioral_comments && (
              <div>
                <h4 className="font-semibold mb-1">Comportamental</h4>
                <p className="text-sm text-muted-foreground">{assessment.behavioral_comments}</p>
              </div>
            )}
            {assessment.technical_def_comments && (
              <div>
                <h4 className="font-semibold mb-1">Técnica DEF</h4>
                <p className="text-sm text-muted-foreground">{assessment.technical_def_comments}</p>
              </div>
            )}
            {assessment.process_comments && (
              <div>
                <h4 className="font-semibold mb-1">Processos</h4>
                <p className="text-sm text-muted-foreground">{assessment.process_comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calibration Notes (if calibrated) */}
      {assessment.status === 'calibrated' && assessment.calibration_notes && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>Notas de Calibração</CardTitle>
            </div>
            <CardDescription>
              Feedback do líder após calibração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{assessment.calibration_notes}</p>
            {assessment.calibrated_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Calibrado em: {new Date(assessment.calibrated_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">
              {assessment.assessment_type === 'self' ? 'Auto-avaliação' : 'Avaliação do Líder'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={assessment.status === 'calibrated' ? 'default' : 'secondary'}>
              {STATUS_LABELS[assessment.status] ?? 'Status desconhecido'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Framework:</span>
            <span className="font-medium">{framework.name}</span>
          </div>
          {assessment.completed_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Concluída em:</span>
              <span className="font-medium">
                {new Date(assessment.completed_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
