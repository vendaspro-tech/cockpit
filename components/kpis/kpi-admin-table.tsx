'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2 } from 'lucide-react'
import { KPIFormDialog } from './kpi-form-dialog'
import { deleteKPI, type KPI } from '@/app/(dashboard)/[workspaceId]/kpis/actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface KPIAdminTableProps {
  kpis: KPI[]
  workspaceId: string
}

export function KPIAdminTable({ kpis }: KPIAdminTableProps) {
  async function handleDelete(id: string) {
    try {
      const { error } = await deleteKPI(id)
      if (error) throw new Error(error)
      toast.success('KPI removido com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao remover KPI')
    }
  }

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Ordem</TableHead>
            <TableHead className="w-[200px]">KPI</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Benchmark</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((kpi) => (
            <TableRow key={kpi.id}>
              <TableCell>{kpi.display_order}</TableCell>
              <TableCell className="font-medium">{kpi.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{kpi.category}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{kpi.benchmark}</TableCell>
              <TableCell>
                <Badge variant={kpi.is_active ? 'default' : 'secondary'}>
                  {kpi.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <KPIFormDialog mode="edit" kpi={kpi}>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </KPIFormDialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá arquivar o KPI &quot;{kpi.name}&quot;. Ele deixará de aparecer no catálogo público.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(kpi.id)} className="bg-destructive hover:bg-destructive/90">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
