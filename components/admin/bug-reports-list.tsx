'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { updateBugReportStatus, type AdminBugReportListResult, type BugReportStatus } from '@/app/actions/bug-reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BugReportsListProps {
  data: AdminBugReportListResult
  filters: {
    status?: string
    workspaceId?: string
    email?: string
    from?: string
    to?: string
  }
}

const statusOptions: Array<{ value: BugReportStatus; label: string }> = [
  { value: 'enviado', label: 'Enviado' },
  { value: 'em_avaliacao', label: 'Em avaliação' },
  { value: 'corrigido', label: 'Corrigido' },
]

function toInputDate(value?: string) {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString().slice(0, 10)
}

function buildPageHref(
  page: number,
  filters: { status?: string; workspaceId?: string; email?: string; from?: string; to?: string }
) {
  const search = new URLSearchParams()

  if (filters.status) search.set('status', filters.status)
  if (filters.workspaceId) search.set('workspaceId', filters.workspaceId)
  if (filters.email) search.set('email', filters.email)
  if (filters.from) search.set('from', filters.from)
  if (filters.to) search.set('to', filters.to)

  search.set('page', String(page))

  return `/admin/bugs?${search.toString()}`
}

function statusLabel(status: BugReportStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

export function BugReportsList({ data, filters }: BugReportsListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [statusDraft, setStatusDraft] = useState<Record<string, BugReportStatus>>(() => {
    const entries = data.items.map((item) => [item.id, item.status])
    return Object.fromEntries(entries)
  })

  const hasPrevious = data.page > 1
  const hasNext = data.page < data.totalPages

  const handleStatusChange = (bugReportId: string) => {
    const nextStatus = statusDraft[bugReportId]
    if (!nextStatus) return

    startTransition(async () => {
      const result = await updateBugReportStatus({
        bugReportId,
        status: nextStatus,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Status atualizado com sucesso.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="grid gap-1">
          <label htmlFor="status" className="text-sm text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ''}
            className="h-9 w-[180px] rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label htmlFor="workspaceId" className="text-sm text-muted-foreground">
            Workspace ID
          </label>
          <Input id="workspaceId" name="workspaceId" defaultValue={filters.workspaceId ?? ''} className="w-[220px]" />
        </div>

        <div className="grid gap-1">
          <label htmlFor="email" className="text-sm text-muted-foreground">
            Email do repórter
          </label>
          <Input id="email" name="email" defaultValue={filters.email ?? ''} className="w-[220px]" />
        </div>

        <div className="grid gap-1">
          <label htmlFor="from" className="text-sm text-muted-foreground">
            De
          </label>
          <Input id="from" name="from" type="date" defaultValue={toInputDate(filters.from)} className="w-[170px]" />
        </div>

        <div className="grid gap-1">
          <label htmlFor="to" className="text-sm text-muted-foreground">
            Até
          </label>
          <Input id="to" name="to" type="date" defaultValue={toInputDate(filters.to)} className="w-[170px]" />
        </div>

        <input type="hidden" name="page" value="1" />

        <div className="flex gap-2">
          <Button type="submit">Aplicar filtros</Button>
          <Button variant="outline" asChild>
            <Link href="/admin/bugs">Limpar</Link>
          </Button>
        </div>
      </form>

      <div className="text-sm text-muted-foreground">{data.total} relato(s) encontrado(s)</div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Repórter</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Anexos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[220px]">Atualizar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum relato encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="max-w-[280px]">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate">{item.reporter?.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.reporter?.email || 'Sem email'}</p>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate">{item.workspace?.name || item.workspace_id}</p>
                  </TableCell>
                  <TableCell>{item.attachments.length}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'corrigido'
                          ? 'default'
                          : item.status === 'em_avaliacao'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {statusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <select
                        value={statusDraft[item.id] ?? item.status}
                        onChange={(event) =>
                          setStatusDraft((current) => ({
                            ...current,
                            [item.id]: event.target.value as BugReportStatus,
                          }))
                        }
                        className="h-9 rounded-md border bg-transparent px-2 text-sm"
                        disabled={isPending}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending || (statusDraft[item.id] ?? item.status) === item.status}
                        onClick={() => handleStatusChange(item.id)}
                      >
                        Salvar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {data.page} de {Math.max(data.totalPages, 1)}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" disabled={!hasPrevious} asChild={hasPrevious}>
            {hasPrevious ? (
              <Link href={buildPageHref(data.page - 1, filters)}>Anterior</Link>
            ) : (
              <span>Anterior</span>
            )}
          </Button>
          <Button variant="outline" disabled={!hasNext} asChild={hasNext}>
            {hasNext ? <Link href={buildPageHref(data.page + 1, filters)}>Próxima</Link> : <span>Próxima</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
