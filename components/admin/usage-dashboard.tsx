'use client'

import { useMemo, useState, useTransition } from 'react'
import { Activity, Bot, Target, Users } from 'lucide-react'

import {
  getUsageSummary,
  getWorkspaceUsageDetail,
  type UsageFilters,
  type WorkspaceUsageSummary,
  type WorkspaceUserUsage,
  type WorkspaceWeeklyTrendPoint,
} from '@/app/actions/admin/usage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UsageWorkspaceTable } from '@/components/admin/usage-workspace-table'
import { UsageWorkspaceDetailDrawer } from '@/components/admin/usage-workspace-detail-drawer'

type PeriodPreset = '7d' | '30d' | '90d'

interface UsageDashboardProps {
  initialSummary: WorkspaceUsageSummary[]
  workspaces: Array<{ id: string; name: string; plan: string }>
  plans: string[]
  initialFilters: UsageFilters
}

function rangeFromPreset(preset: PeriodPreset) {
  const now = new Date()
  const start = new Date(now)
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
  start.setUTCDate(start.getUTCDate() - days)

  return {
    dateFrom: start.toISOString(),
    dateTo: now.toISOString(),
  }
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function UsageDashboard({ initialSummary, workspaces, plans, initialFilters }: UsageDashboardProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [filters, setFilters] = useState<UsageFilters>({
    ...initialFilters,
    workspaceId: undefined,
    plan: 'all',
    search: '',
  })
  const [preset, setPreset] = useState<PeriodPreset>('30d')
  const [isPending, startTransition] = useTransition()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceUsageSummary | null>(null)
  const [drawerUsers, setDrawerUsers] = useState<WorkspaceUserUsage[]>([])
  const [drawerTrend, setDrawerTrend] = useState<WorkspaceWeeklyTrendPoint[]>([])

  const globalStats = useMemo(() => {
    const members = summary.reduce((acc, item) => acc + item.members_count, 0)
    const activeCore = summary.reduce((acc, item) => acc + item.active_core_users, 0)
    const assessmentsCompleted = summary.reduce((acc, item) => acc + item.assessments_completed, 0)
    const assessmentsStarted = summary.reduce((acc, item) => acc + item.assessments_started, 0)
    const conversationsStarted = summary.reduce((acc, item) => acc + item.agent_conversations_started, 0)
    const pdisCreated = summary.reduce((acc, item) => acc + item.pdis_created, 0)
    const pdisCompleted = summary.reduce((acc, item) => acc + item.pdis_completed, 0)

    return {
      activeCore,
      activationRate: members > 0 ? activeCore / members : 0,
      assessmentsCompleted,
      assessmentsCompletionRate: assessmentsStarted > 0 ? assessmentsCompleted / assessmentsStarted : 0,
      conversationsStarted,
      pdiProgress: `${pdisCompleted}/${pdisCreated}`,
    }
  }, [summary])

  const applyFilters = () => {
    startTransition(async () => {
      const rows = await getUsageSummary({
        ...filters,
        workspaceId: filters.workspaceId && filters.workspaceId !== 'all' ? filters.workspaceId : undefined,
        plan: filters.plan && filters.plan !== 'all' ? filters.plan : undefined,
      })

      setSummary(rows)
    })
  }

  const handlePresetChange = (value: PeriodPreset) => {
    const range = rangeFromPreset(value)
    setPreset(value)
    setFilters((prev) => ({
      ...prev,
      ...range,
    }))
  }

  const openDetail = (workspace: WorkspaceUsageSummary) => {
    setSelectedWorkspace(workspace)
    setDrawerOpen(true)
    setDrawerUsers([])
    setDrawerTrend([])

    startTransition(async () => {
      const detail = await getWorkspaceUsageDetail(workspace.workspace_id, {
        ...filters,
        workspaceId: workspace.workspace_id,
      })

      setDrawerUsers(detail.users)
      setDrawerTrend(detail.weeklyTrend)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos Core</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.activeCore}</div>
            <p className="text-xs text-muted-foreground">Ativação geral: {toPercent(globalStats.activationRate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Concluídas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.assessmentsCompleted}</div>
            <p className="text-xs text-muted-foreground">Taxa de conclusão: {toPercent(globalStats.assessmentsCompletionRate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas de Agente</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.conversationsStarted}</div>
            <p className="text-xs text-muted-foreground">Conversas iniciadas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDIs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.pdiProgress}</div>
            <p className="text-xs text-muted-foreground">Concluídos / Criados</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Período</p>
            <Select value={preset} onValueChange={(value) => handlePresetChange(value as PeriodPreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Plano</p>
            <Select value={filters.plan || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, plan: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Workspace</p>
            <Select value={filters.workspaceId || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, workspaceId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os workspaces</SelectItem>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="xl:col-span-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Buscar workspace</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do workspace"
                value={filters.search || ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
              <Button onClick={applyFilters} disabled={isPending}>
                {isPending ? 'Aplicando...' : 'Aplicar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <UsageWorkspaceTable data={summary} onOpenDetail={openDetail} />

      <UsageWorkspaceDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        workspaceName={selectedWorkspace?.workspace_name || ''}
        users={drawerUsers}
        weeklyTrend={drawerTrend}
        loading={isPending}
      />
    </div>
  )
}
