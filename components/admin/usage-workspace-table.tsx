'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { WorkspaceUsageSummary } from '@/app/actions/admin/usage'

interface UsageWorkspaceTableProps {
  data: WorkspaceUsageSummary[]
  onOpenDetail: (workspace: WorkspaceUsageSummary) => void
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export function UsageWorkspaceTable({ data, onOpenDetail }: UsageWorkspaceTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Ativação</TableHead>
            <TableHead>Avaliações</TableHead>
            <TableHead>Agentes</TableHead>
            <TableHead>PDIs</TableHead>
            <TableHead>Última ação</TableHead>
            <TableHead className="text-right">Detalhe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                Nenhum workspace encontrado para os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.workspace_id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.workspace_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.active_core_users}/{item.members_count} usuários ativos core
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {item.plan}
                  </Badge>
                </TableCell>
                <TableCell>{toPercent(item.activation_rate)}</TableCell>
                <TableCell>
                  <span className="font-medium">{item.assessments_completed}</span>
                  <span className="text-muted-foreground"> / {item.assessments_started}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{item.agent_conversations_started} conversas</span>
                    <span className="text-xs text-muted-foreground">{item.agent_messages_sent} mensagens</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{item.pdis_completed}</span>
                  <span className="text-muted-foreground"> / {item.pdis_created}</span>
                </TableCell>
                <TableCell>{formatDate(item.last_core_activity_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onOpenDetail(item)}>
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
