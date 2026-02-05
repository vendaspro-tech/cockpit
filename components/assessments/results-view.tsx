'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, TrendingUp, TrendingDown, Target, Users, MessageSquare, Trophy, LayoutGrid, Table2, ListFilter } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { AssessmentRadarChart } from '@/components/charts/assessment-radar-chart'
import { AssessmentOverviewTable } from './assessment-overview-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScoreComparison } from '@/components/performance/score-comparison'
import { ExportPDFButton } from './export-pdf-button'
import type { TeamAverageResult } from '@/app/actions/performance-analytics'


interface ResultsViewProps {
  testType: string
  result: any
  managerResult?: any
  managerComments?: string
  hasManagerEvaluation?: boolean
  managerScore?: number
  selfScore?: number
  compact?: boolean
  teamComparison?: TeamAverageResult | null
  assessmentId?: string
  userName?: string
}

export function ResultsView({ testType, result, managerResult, managerComments, hasManagerEvaluation, managerScore, selfScore, teamComparison, assessmentId, userName }: ResultsViewProps) {
  // Helper to normalize data for the table
  const getTableData = () => {
    if (!result) return []

    // Helper to find manager score for an item
    const getManagerItemScore = (itemId: string, category?: string) => {
      if (!managerResult) return undefined
      
      if (testType === 'def_method' && managerResult.categories) {
        const cat = managerResult.categories.find((c: any) => c.name === category)
        const item = cat?.items?.find((i: any) => (i.id || i.name) === itemId)
        return item?.score
      }
      
      if ((testType === 'seniority_seller' || testType === 'seniority_leader' || testType === 'values_8d') && managerResult.items) {
        const item = managerResult.items.find((i: any) => i.id === itemId)
        return item?.score
      }

      if (testType === 'values_8d' && managerResult.dimensions) {
         return managerResult.dimensions[itemId]
      }

      return undefined
    }

    switch (testType) {
      case 'def_method':
        return (result.categories || []).flatMap((cat: any) => 
          (cat.items || []).map((item: any) => ({
            id: item.id || item.name,
            criterion: item.name,
            score: item.score,
            managerScore: getManagerItemScore(item.id || item.name, cat.name),
            maxScore: item.maxScore || 100,
            category: cat.name
          }))
        )
      case 'values_8d':
        if (result.items) {
          return result.items.map((item: any) => ({
            id: item.id,
            criterion: item.name,
            score: item.score,
            managerScore: getManagerItemScore(item.id),
            maxScore: item.maxScore,
            category: item.category
          }))
        }
        return Object.entries(result.dimensions || {}).map(([dim, score]: [string, any]) => ({
          id: dim,
          criterion: dim,
          score: typeof score === 'number' ? score : 0,
          managerScore: getManagerItemScore(dim),
          maxScore: 5,
          category: 'Dimensões'
        }))
      case 'seniority_seller':
      case 'seniority_leader':
        if (result.items) {
          return result.items.map((item: any) => ({
            id: item.id,
            criterion: item.name,
            score: item.score,
            managerScore: getManagerItemScore(item.id),
            maxScore: item.maxScore,
            category: item.category
          }))
        }
        return [{
          id: 'total',
          criterion: 'Pontuação Geral',
          score: result.score,
          managerScore: managerResult?.score,
          maxScore: result.maxScore,
          category: 'Geral'
        }]
      case 'leadership_style':
         return [{
          id: 'style',
          criterion: result.style,
          score: result.score,
          managerScore: managerResult?.score,
          maxScore: 30, // Assuming 30 based on previous code
          category: 'Estilo'
        }]
      default:
        return []
    }
  }

  const tableData = getTableData()

  const renderHero = () => (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-6">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {testType === 'def_method' ? 'Método DEF' : 
               testType === 'values_8d' ? 'Mapa de Valores' :
               testType === 'leadership_style' ? 'Estilo de Liderança' :
               'Senioridade'}
            </h1>
            {assessmentId && (
              <ExportPDFButton
                assessmentId={assessmentId}
                fileName={`${testType}-${userName || 'resultado'}.pdf`}
                variant="outline"
              />
            )}
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            {result.description || "Análise detalhada de performance e competências."}
          </p>
          
          {result.level && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-medium">
              <Target className="w-4 h-4" />
              {result.level}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}%`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (result.percentage || result.globalPercentage || 0) / 100)}%`}
                className="text-primary transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-6xl font-bold tracking-tighter">
                {result.percentage || result.globalPercentage || 0}%
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2">Score Geral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderRadar = () => {
    if (testType !== 'def_method' && testType !== 'values_8d') return null

    let radarData = []
    if (testType === 'def_method') {
      radarData = (result.categories || []).map((cat: any) => {
        const managerCat = managerResult?.categories?.find((c: any) => c.name === cat.name)
        return {
          subject: cat.name,
          A: cat.score.percentage || 0,
          B: managerCat?.score?.percentage || 0,
          fullMark: 100
        }
      })
    } else if (testType === 'values_8d') {
      radarData = Object.entries(result.dimensions || {}).map(([dim, score]: [string, any]) => {
         const managerScore = managerResult?.dimensions?.[dim]
         return {
          subject: dim,
          A: typeof score === 'number' ? score : 0,
          B: typeof managerScore === 'number' ? managerScore : 0,
          fullMark: 100
        }
      })
    }

    if (radarData.length === 0) return null

    return (
      <div className="mb-16">
        <AssessmentRadarChart
          title=""
          data={radarData}
        />
      </div>
    )
  }

  const renderManagerComparison = () => {
    const isSeniorityTest = testType === 'seniority_seller' || testType === 'seniority_leader'
    if (!isSeniorityTest || !hasManagerEvaluation || !managerScore || !selfScore) return null

    return (
      <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Autoavaliação</h3>
              <p className="text-sm text-muted-foreground">Sua percepção</p>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{selfScore}%</span>
            <Progress value={selfScore} className="h-2 mb-3" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Avaliação do Gestor</h3>
              <p className="text-sm text-muted-foreground">Percepção da liderança</p>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{managerScore}%</span>
            <Progress value={managerScore} className="h-2 mb-3" />
          </div>
        </div>
      </div>
    )
  }

  const renderManagerComments = () => {
    if (!managerComments) return null

    return (
      <div className="mb-16 p-8 rounded-3xl bg-muted/30 border border-border">
        <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          Comentários do Gestor
        </h4>
        <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{managerComments}</p>
      </div>
    )
  }

  // Helper to get categories for tabs
  const getCategories = () => {
    if (!result) return []
    
    switch (testType) {
      case 'def_method':
        return (result.categories || []).map((cat: any) => ({
          id: cat.name,
          name: cat.name,
          items: (cat.items || []).map((item: any) => ({
            id: item.id || item.name,
            criterion: item.name,
            score: item.score,
            maxScore: item.maxScore || 100,
            category: cat.name
          }))
        }))
      case 'values_8d':
        return [] 
      default:
        return []
    }
  }

  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  const categories = getCategories()
  
  // Filter items based on selected category
  const filteredTableData = React.useMemo(() => {
    if (selectedCategory === 'all') return tableData
    return tableData.filter((item: any) => item.category === selectedCategory)
  }, [tableData, selectedCategory])

  if (!result) return null

  return (
    <div className="animate-in fade-in duration-700">
      {renderHero()}
      
      {/* Team Comparison Section */}
      {teamComparison && selfScore && (
        <div className="mb-12">
          <ScoreComparison
            userScore={selfScore}
            teamAverage={teamComparison.average}
            teamMax={teamComparison.max}
            teamMin={teamComparison.min}
            allScores={teamComparison.allScores}
          />
        </div>
      )}
      
      {/* Manager Comparison Section */}
      {renderManagerComparison()}

      {/* Radar Chart Section */}
      {testType === 'def_method' || testType === 'values_8d' ? (
        <div className="mb-16">
           {renderRadar()}
        </div>
      ) : null}

      {/* Manager Comments */}
      {renderManagerComments()}

      {/* Detailed Table Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Detalhamento</h3>
            <p className="text-muted-foreground">
              Visão granular por competência.
            </p>
          </div>
          
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="w-full md:w-[250px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {filteredTableData.length > 0 ? (
          <AssessmentOverviewTable items={filteredTableData} />
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-3xl border border-dashed">
            Nenhum dado encontrado para o filtro selecionado.
          </div>
        )}
      </div>
    </div>
  )
}
