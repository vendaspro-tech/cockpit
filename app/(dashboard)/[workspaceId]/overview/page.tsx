import { getLeaderDashboardData, getSellerDashboardData, getUserRole } from '@/app/actions/dashboard'
import { AssessmentRadarChart } from '@/components/charts/assessment-radar-chart'
import { DEFHistoryTimeline } from '@/components/charts/def-history-timeline'
import { ScoreEvolutionChart } from '@/components/charts/score-evolution-chart'
import { SeniorityDistributionChart } from '@/components/charts/seniority-distribution-chart'
import { TeamBottleneckHeatmap } from '@/components/charts/team-bottleneck-heatmap'
import { TeamPerformanceRanking } from '@/components/charts/team-performance-ranking'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth-server'
import { AlertCircle, ClipboardList, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface OverviewPageProps {
  params: Promise<{ workspaceId: string }>
}

async function getUserStats(userId: string, workspaceId: string) {
  const supabase = createAdminClient()
  
  // Get Supabase user ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', userId)
    .single()
  
  if (!user) return null
  
  // Get assessments count
  const { count: assessmentsCount } = await supabase
    .from('assessments')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('evaluated_user_id', user.id)
  
  // Get active PDIs count
  const { count: pdiCount } = await supabase
    .from('pdi_plans')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('status', 'active')
  
  // Get alerts count
  const { count: alertsCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  return {
    assessments: assessmentsCount || 0,
    activePdis: pdiCount || 0,
    alerts: alertsCount || 0
  }
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) return null
  
  const stats = await getUserStats(user.id, workspaceId)
  const role = await getUserRole(user.id, workspaceId)
  
  if (!stats) return null

  // Fetch dashboard data based on role
  const isLeader = ['system_owner', 'owner', 'admin'].includes(role || '')
  const sellerData = !isLeader ? await getSellerDashboardData(user.id, workspaceId) : null
  const leaderData = isLeader ? await getLeaderDashboardData(workspaceId) : null
  const displayName =
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    user.email ||
    'Usuário'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao seu painel de {isLeader ? 'gestão' : 'vendas'}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avaliações</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.assessments}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">PDIs Ativos</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.activePdis}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Evolução</p>
              <p className="text-3xl font-bold text-foreground mt-2">-</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertas</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.alerts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Seller Dashboard */}
      {!isLeader && sellerData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart - Latest Assessment */}
          {sellerData.latestAssessment ? (
            <AssessmentRadarChart
              title="Sua Última Avaliação"
              description={`Realizada em ${new Date(sellerData.latestAssessment.created_at).toLocaleDateString()}`}
              data={sellerData.latestAssessment.result?.categories?.map((c: any) => ({
                subject: c.name,
                A: c.score.percentage || 0,
                fullMark: 100
              })) || []}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center p-6 min-h-[300px] text-center">
              <Target className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma avaliação encontrada</h3>
              <p className="text-muted-foreground mb-4">Realize sua primeira avaliação para ver seus resultados.</p>
              <Button asChild>
                <Link href={`/${workspaceId}/assessments`}>Começar Agora</Link>
              </Button>
            </Card>
          )}

          {/* Score Evolution */}
          <ScoreEvolutionChart
            title="Sua Evolução"
            description="Histórico de pontuação nos últimos meses"
            data={sellerData.history}
          />

          {/* DEF History */}
          <div className="lg:col-span-2">
            <DEFHistoryTimeline meetings={sellerData.defHistory} />
          </div>
        </div>
      )}

      {/* Leader Dashboard */}
      {isLeader && leaderData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Ranking */}
            <TeamPerformanceRanking
              title="Ranking da Equipe"
              description="Média das últimas 5 avaliações"
              data={leaderData.ranking}
            />

            {/* Seniority Distribution */}
            <SeniorityDistributionChart
              title="Distribuição de Senioridade"
              description="Composição atual do time"
              data={leaderData.seniority}
            />
          </div>

          {/* Team Heatmap */}
          <TeamBottleneckHeatmap
            title="Mapa de Calor de Competências"
            description="Identifique os gargalos técnicos da equipe (Baseado no Método DEF)"
            data={leaderData.heatmap}
          />
        </div>
      )}
      
      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Button asChild className="h-auto py-4 flex flex-col items-start">
            <Link href={`/${workspaceId}/assessments`}>
              <ClipboardList className="w-5 h-5 mb-2" />
              <span className="font-semibold">Nova Avaliação</span>
              <span className="text-xs opacity-90">Iniciar um novo teste</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
            <Link href={`/${workspaceId}/pdi`}>
              <Target className="w-5 h-5 mb-2" />
              <span className="font-semibold">Ver Meu PDI</span>
              <span className="text-xs opacity-90">Acompanhar desenvolvimento</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
            <Link href={`/${workspaceId}/assessments`}>
              <TrendingUp className="w-5 h-5 mb-2" />
              <span className="font-semibold">Histórico</span>
              <span className="text-xs opacity-90">Ver avaliações passadas</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
