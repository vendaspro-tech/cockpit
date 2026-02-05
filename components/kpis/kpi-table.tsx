import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { KPI } from '@/app/(dashboard)/[workspaceId]/kpis/actions'

interface KPITableProps {
  kpis: KPI[]
}

export function KPITable({ kpis }: KPITableProps) {
  if (kpis.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum KPI encontrado nesta categoria.
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] font-semibold">KPI</TableHead>
            <TableHead className="w-[180px] font-semibold">Categoria</TableHead>
            <TableHead className="font-semibold">Descrição</TableHead>
            <TableHead className="w-[180px] font-semibold">Benchmark</TableHead>
            <TableHead className="font-semibold">Fórmula de Cálculo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((kpi) => (
            <TableRow key={kpi.id} className="hover:bg-muted/50">
              <TableCell className="font-semibold text-foreground">
                {kpi.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {kpi.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {kpi.description}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono text-xs">
                  {kpi.benchmark}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {kpi.formula}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
