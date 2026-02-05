"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  BarChart3
} from "lucide-react"
import type { LeaderboardEntry, DashboardStats } from "@/app/actions/performance-analytics"

interface Squad {
  id: string
  name: string
  color?: string
  leader_id?: string
}

interface PerformanceDashboardClientProps {
  workspaceId: string
  userId: string
  role: string
  squads: Squad[]
  initialLeaderboard: LeaderboardEntry[]
  initialStats: DashboardStats
}

export function PerformanceDashboardClient({
  workspaceId,
  userId,
  role,
  squads,
  initialLeaderboard,
  initialStats
}: PerformanceDashboardClientProps) {
  const [selectedSquadId, setSelectedSquadId] = useState<string>("all")
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)

  const canFilterBySquad = role === 'owner' || role === 'admin' || role === 'system_owner'
  const isLeader = role === 'leader'
  const isMember = role === 'member'

  const handleSquadChange = async (squadId: string) => {
    setSelectedSquadId(squadId)
    setLoading(true)
    
    try {
      const querySquadId = squadId === "all" ? undefined : squadId
      
      // Fetch updated data
      const [leaderboardRes, statsRes] = await Promise.all([
        fetch(`/api/performance/leaderboard?workspaceId=${workspaceId}${querySquadId ? `&squadId=${querySquadId}` : ''}`),
        fetch(`/api/performance/stats?workspaceId=${workspaceId}${querySquadId ? `&squadId=${querySquadId}` : ''}`)
      ])
      
      const [newLeaderboard, newStats] = await Promise.all([
        leaderboardRes.json(),
        statsRes.json()
      ])
      
      setLeaderboard(newLeaderboard)
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Squad Selector - Only for owners/admins */}
      {canFilterBySquad && squads.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Filtrar por Squad:</label>
          <Select value={selectedSquadId} onValueChange={handleSquadChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Todas as Squads</span>
                </div>
              </SelectItem>
              {squads.map(squad => (
                <SelectItem key={squad.id} value={squad.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: squad.color || '#3b82f6' }}
                    />
                    <span>{squad.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Leader Squad Info */}
      {isLeader && squads.length > 0 && (
        <Card className="border-l-4" style={{ borderLeftColor: squads[0].color || '#3b82f6' }}>
          <CardHeader>
            <CardTitle className="text-lg">Sua Squad: {squads[0].name}</CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Avaliações
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAssessments} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PDIs Ativos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePDIs}</div>
            <p className="text-xs text-muted-foreground">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média Geral
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Score médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{entry.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      {entry.score.toFixed(1)}
                    </Badge>
                    {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma avaliação concluída ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon - More components */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-2">Mais visualizações em breve</h3>
          <p className="text-sm text-muted-foreground">
            Heat maps de competências, gráficos de tendências e comparações detalhadas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
