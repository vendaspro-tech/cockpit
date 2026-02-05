'use client'

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Power, Trash } from "lucide-react"
import { useState } from "react"
import { deleteKpi, toggleKpiStatus } from "@/app/actions/admin/kpis"
import { useToast } from "@/hooks/use-toast"
import { KpiDialog } from "./kpi-dialog"
import { ConfirmDialog, ActiveStatusBadge } from "@/components/shared"

interface Kpi {
  id: string
  name: string
  description: string
  category: string
  benchmark: string
  formula: string
  display_order: number
  is_active: boolean
}

interface KpisListProps {
  kpis: Kpi[]
}

export function KpisList({ kpis }: KpisListProps) {
  const { toast } = useToast()
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })

  const handleDeleteClick = (kpiId: string) => {
    setDeleteConfirm({ open: true, id: kpiId })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return
    const result = await deleteKpi(deleteConfirm.id)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "KPI excluído com sucesso"
      })
    }
  }

  const handleToggleStatus = async (kpi: Kpi) => {
    const result = await toggleKpiStatus(kpi.id, !kpi.is_active)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: `KPI ${kpi.is_active ? 'desativado' : 'ativado'} com sucesso`
      })
    }
  }

  // Group KPIs by category
  const groupedKpis = kpis.reduce((acc, kpi) => {
    if (!acc[kpi.category]) {
      acc[kpi.category] = []
    }
    acc[kpi.category].push(kpi)
    return acc
  }, {} as Record<string, Kpi[]>)

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedKpis).map(([category, categoryKpis]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Ord.</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Benchmark</TableHead>
                    <TableHead>Fórmula</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryKpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell>{kpi.display_order}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{kpi.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {kpi.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{kpi.benchmark}</TableCell>
                      <TableCell className="text-xs font-mono">{kpi.formula}</TableCell>
                      <TableCell>
                        <ActiveStatusBadge active={kpi.is_active} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditingKpi(kpi)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(kpi)}>
                              <Power className="mr-2 h-4 w-4" />
                              {kpi.is_active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(kpi.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>

      <KpiDialog
        kpi={editingKpi || undefined}
        open={!!editingKpi}
        onOpenChange={(open) => !open && setEditingKpi(null)}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Excluir KPI?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
