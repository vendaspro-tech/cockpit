import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { PlatformFeedbackAdminListResult } from '@/app/actions/platform-feedback'

interface PlatformFeedbackListProps {
  data: PlatformFeedbackAdminListResult
  filters: {
    from?: string
    to?: string
    minScore?: string
    maxScore?: string
  }
}

function buildPageHref(
  page: number,
  filters: { from?: string; to?: string; minScore?: string; maxScore?: string }
) {
  const search = new URLSearchParams()

  if (filters.from) search.set('from', filters.from)
  if (filters.to) search.set('to', filters.to)
  if (filters.minScore) search.set('minScore', filters.minScore)
  if (filters.maxScore) search.set('maxScore', filters.maxScore)

  search.set('page', String(page))

  return `/admin/feedback?${search.toString()}`
}

function toInputDate(value?: string) {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString().slice(0, 10)
}

export function PlatformFeedbackList({ data, filters }: PlatformFeedbackListProps) {
  const hasPrevious = data.page > 1
  const hasNext = data.page < data.totalPages

  return (
    <div className="space-y-4">
      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
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

        <div className="grid gap-1">
          <label htmlFor="minScore" className="text-sm text-muted-foreground">
            NPS mín.
          </label>
          <Input
            id="minScore"
            name="minScore"
            type="number"
            min={0}
            max={10}
            defaultValue={filters.minScore ?? ''}
            className="w-[120px]"
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="maxScore" className="text-sm text-muted-foreground">
            NPS máx.
          </label>
          <Input
            id="maxScore"
            name="maxScore"
            type="number"
            min={0}
            max={10}
            defaultValue={filters.maxScore ?? ''}
            className="w-[120px]"
          />
        </div>

        <input type="hidden" name="page" value="1" />

        <div className="flex gap-2">
          <Button type="submit">Aplicar filtros</Button>
          <Button variant="outline" asChild>
            <Link href="/admin/feedback">Limpar</Link>
          </Button>
        </div>
      </form>

      <div className="text-sm text-muted-foreground">
        {data.total} registro(s) encontrado(s)
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Experiência</TableHead>
              <TableHead>Recomendação</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum feedback encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {item.user?.full_name || item.user?.email || 'Usuário removido'}
                  </TableCell>
                  <TableCell>{item.experience_score}</TableCell>
                  <TableCell>{item.recommendation_score}</TableCell>
                  <TableCell className="max-w-[480px] whitespace-normal break-words text-sm">
                    {item.notes?.trim() ? item.notes : 'Sem observações'}
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
            {hasPrevious ? <Link href={buildPageHref(data.page - 1, filters)}>Anterior</Link> : <span>Anterior</span>}
          </Button>
          <Button variant="outline" disabled={!hasNext} asChild={hasNext}>
            {hasNext ? <Link href={buildPageHref(data.page + 1, filters)}>Próxima</Link> : <span>Próxima</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
