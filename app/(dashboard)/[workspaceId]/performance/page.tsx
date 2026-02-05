import { getAuthUser } from "@/lib/auth-server"
import { getUserRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getWorkspaceSquads } from "@/app/actions/squads"
import { getTeamLeaderboard, getDashboardStats } from "@/app/actions/performance-analytics"
import { PerformanceDashboardClient } from "@/components/performance/performance-dashboard-client"

interface PerformancePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function PerformancePage({ params }: PerformancePageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const role = await getUserRole(user.id, workspaceId)
  
  // Get squads based on role
  let squads: any[] = []
  let selectedSquadId: string | undefined = undefined
  
  if (role === 'owner' || role === 'admin' || role === 'system_owner') {
    // Owners can see all squads
    const result = await getWorkspaceSquads(workspaceId)
    squads = result.data || []
  } else if (role === 'leader') {
    // Leaders see their squad(s)
    const result = await getWorkspaceSquads(workspaceId)
    const allSquads = result.data || []
    squads = allSquads.filter((s: any) => s.leader_id === user.id)
    selectedSquadId = squads[0]?.id
  }
  
  // Fetch initial performance data
  const [leaderboardData, statsData] = await Promise.all([
    getTeamLeaderboard(workspaceId, undefined, 10, selectedSquadId),
    getDashboardStats(workspaceId, selectedSquadId)
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe métricas de desempenho e competências do time
        </p>
      </div>

      <PerformanceDashboardClient
        workspaceId={workspaceId}
        userId={user.id}
        role={role || 'member'}
        squads={squads}
        initialLeaderboard={leaderboardData}
        initialStats={statsData}
      />
    </div>
  )
}
