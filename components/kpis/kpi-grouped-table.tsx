'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KPI } from '@/app/(dashboard)/[workspaceId]/kpis/actions'

interface KPIGroupedTableProps {
  kpis: KPI[]
  category: string
  defaultOpen?: boolean
}

export function KPIGroupedTable({ kpis, category, defaultOpen = true }: KPIGroupedTableProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (kpis.length === 0) return null

  return (
    <div className="border rounded-lg bg-card overflow-hidden mb-4">
      <div 
        className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-lg">{category}</h3>
          <Badge variant="secondary" className="ml-2">
            {kpis.length}
          </Badge>
        </div>
      </div>

      {isOpen && (
        <div className="border-t">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="sticky left-0 z-20 bg-muted/40 w-[200px] min-w-[200px] pl-6 h-12 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs uppercase tracking-wider font-bold text-foreground/70">KPI</TableHead>
                  <TableHead className="min-w-[300px] h-12 text-xs uppercase tracking-wider font-bold text-foreground/70">Descrição</TableHead>
                  <TableHead className="min-w-[150px] h-12 text-xs uppercase tracking-wider font-bold text-foreground/70">Benchmark</TableHead>
                  <TableHead className="min-w-[250px] h-12 text-xs uppercase tracking-wider font-bold text-foreground/70">Fórmula de Cálculo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map((kpi) => (
                  <TableRow key={kpi.id} className="hover:bg-muted/50">
                    <TableCell className="sticky left-0 z-20 bg-card font-semibold text-foreground pl-6 py-5 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {kpi.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-5 leading-relaxed align-top whitespace-normal min-w-[300px]">
                      {kpi.description}
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap">
                        {kpi.benchmark}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground py-5 leading-relaxed align-top whitespace-normal min-w-[250px]">
                      {kpi.formula}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
