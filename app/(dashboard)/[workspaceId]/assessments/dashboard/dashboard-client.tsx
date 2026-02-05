'use client'

import { StatCard } from '@/components/performance/stat-card'
import { Leaderboard } from '@/components/performance/leaderboard'
import { CompetencyHeatMap } from '@/components/performance/competency-heatmap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardList, CheckCircle2, Clock, BookOpen, Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { DashboardStats, LeaderboardEntry, CompetencyMatrixData } from '@/app/actions/performance-analytics'

interface DashboardClientProps {
  workspaceId: string
  stats: DashboardStats
  leaderboard: LeaderboardEntry[]
  competencyMatrix: CompetencyMatrixData
  testType: string
}

export function DashboardClient({
  workspaceId,
  stats,
  leaderboard,
  competencyMatrix,
  testType
}: DashboardClientProps) {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Performance</h1>
          <p className="text-muted-foreground mt-1">
            Visão consolidada do time e análise de competências
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${workspaceId}/assessments`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
      
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Avaliações"
          value={stats.totalAssessments}
          icon={ClipboardList}
          description="Todas as avaliações criadas"
        />
        <StatCard
          title="Concluídas"
          value={stats.completedAssessments}
          icon={CheckCircle2}
          status={stats.completedAssessments > 0 ? 'success' : 'warning'}
          description={`${((stats.completedAssessments / (stats.totalAssessments || 1)) * 100).toFixed(0)}% do total`}
        />
        <StatCard
          title="Pendentes"
          value={stats.pendingAssessments}
          icon={Clock}
          status={stats.pendingAssessments > 5 ? 'warning' : 'success'}
          description="Aguardando conclusão"
        />
        <StatCard
          title="PDIs Ativos"
          value={stats.activePDIs}
          icon={BookOpen}
          description="Planos em andamento"
        />
      </div>
      
      {/* Test Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Avaliação</CardTitle>
          <CardDescription>
            Selecione o tipo de avaliação para análise detalhada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={testType}>
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seniority_seller">Senioridade de Vendedor</SelectItem>
              <SelectItem value="seniority_leader">Senioridade de Líder</SelectItem>
              <SelectItem value="def_method">Método DEF</SelectItem>
              <SelectItem value="values_8d">Mapa de Valores (8D)</SelectItem>
              <SelectItem value="disc">DISC</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Em breve: Filtros dinâmicos que atualizam os dados em tempo real
          </p>
        </CardContent>
      </Card>
      
      {/* Leaderboard & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Leaderboard
          data={leaderboard}
          limit={5}
          title="Top 5 Performers"
        />
        
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Insights Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaderboard.length > 0 ? (
              <>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    🏆 Top Performer
                  </p>
                  <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                    {leaderboard[0]?.name} - {leaderboard[0]?.score.toFixed(1)} pts
                  </p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Score Médio do Time</p>
                  <p className="text-2xl font-bold mt-1">
                    {(leaderboard.reduce((sum, e) => sum + e.score, 0) / leaderboard.length).toFixed(1)} pts
                  </p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Total de Vendedores Avaliados</p>
                  <p className="text-2xl font-bold mt-1">
                    {leaderboard.length}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma avaliação concluída ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Competency Heat Map */}
      {competencyMatrix.users.length > 0 && (
        <CompetencyHeatMap
          data={competencyMatrix.users}
          competencies={competencyMatrix.competencies}
        />
      )}
      
      {/* Empty State */}
      {leaderboard.length === 0 && competencyMatrix.users.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nenhuma Avaliação Concluída</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  Complete avaliações de Senioridade de Vendedor para ver o dashboard de performance do time.
                </p>
              </div>
              <Button asChild variant="default">
                <Link href={`/${workspaceId}/assessments`}>
                  Ir para Avaliações
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
