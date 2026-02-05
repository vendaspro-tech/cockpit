import { getAuthUser } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { getDashboardStats, getTeamLeaderboard, getCompetencyMatrix } from '@/app/actions/performance-analytics'
import { DashboardClient } from './dashboard-client'

interface DashboardPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function PerformanceDashboardPage({ params }: DashboardPageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) redirect('/login')
  
  // Buscar estatísticas gerais
  const stats = await getDashboardStats(workspaceId)
  
  // Por enquanto, vamos buscar dados de senioridade_seller como padrão
  const testType = 'seniority_seller'
  
  // Buscar leaderboard
  const leaderboard = await getTeamLeaderboard(workspaceId, testType, 10)
  
  // Buscar competency matrix
  const competencyMatrix = await getCompetencyMatrix(workspaceId, testType)
  
  return (
    <DashboardClient
      workspaceId={workspaceId}
      stats={stats}
      leaderboard={leaderboard}
      competencyMatrix={competencyMatrix}
      testType={testType}
    />
  )
}
