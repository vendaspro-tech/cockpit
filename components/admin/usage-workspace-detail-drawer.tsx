'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { WorkspaceUserUsage, WorkspaceWeeklyTrendPoint } from '@/app/actions/admin/usage'

interface UsageWorkspaceDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName: string
  users: WorkspaceUserUsage[]
  weeklyTrend: WorkspaceWeeklyTrendPoint[]
  loading?: boolean
}

export function UsageWorkspaceDetailDrawer({
  open,
  onOpenChange,
  workspaceName,
  users,
  weeklyTrend,
  loading = false,
}: UsageWorkspaceDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{workspaceName || 'Detalhes do Workspace'}</SheetTitle>
          <SheetDescription>
            Top usuários por ações core e tendência semanal de uso.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Top usuários (ações core)</h3>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Core</TableHead>
                    <TableHead>Avaliações</TableHead>
                    <TableHead>Agentes</TableHead>
                    <TableHead>PDI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                        Carregando detalhes...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                        Sem ações de usuários no período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.core_actions}</TableCell>
                        <TableCell>{user.assessments_actions}</TableCell>
                        <TableCell>{user.agent_actions}</TableCell>
                        <TableCell>{user.pdi_actions}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Tendência semanal</h3>
            <div className="rounded-lg border p-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando tendência...</p>
              ) : weeklyTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados de tendência no período.</p>
              ) : (
                <div className="space-y-3">
                  {weeklyTrend.map((point) => (
                    <div key={point.week_start} className="rounded-md border p-3">
                      <p className="text-sm font-medium">
                        Semana de {format(new Date(`${point.week_start}T00:00:00.000Z`), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Core: {point.core_actions} | Avaliações concluídas: {point.assessments_completed} | Conversas iniciadas: {point.agent_conversations_started} | PDIs concluídos: {point.pdis_completed}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
