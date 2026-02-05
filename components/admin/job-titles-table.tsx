'use client'

import { exportJobTitleToPDF } from "@/lib/pdf-utils"
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
import { MoreHorizontal, Pencil, Trash, Users, Award, FileDown, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteJobTitle } from "@/app/actions/admin/job-titles"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog, EmptyState } from "@/components/shared"
import type { JobTitle } from "@/lib/types/job-title"

interface JobTitlesTableProps {
  jobTitles: JobTitle[]
  onEdit: (jobTitle: JobTitle) => void
  duplicateJobTitleIds?: Set<string>
}

const hierarchyLabels = {
  0: {
    label: "Estratégico",
    description: "Visão macro e C-Level",
    variant: "default" as const,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  1: {
    label: "Tático",
    description: "Coordenação e planejamento",
    variant: "secondary" as const,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  2: {
    label: "Operacional",
    description: "Supervisão e gestão direta",
    variant: "outline" as const,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  3: {
    label: "Execução",
    description: "Operação e vendas",
    variant: "outline" as const,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

export function JobTitlesTable({ jobTitles, onEdit, duplicateJobTitleIds }: JobTitlesTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; name: string | null }>({
    open: false,
    id: null,
    name: null
  })

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return

    const result = await deleteJobTitle(deleteConfirm.id)
    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Cargo excluído com sucesso"
      })
      router.refresh()
    }
    setDeleteConfirm({ open: false, id: null, name: null })
  }

  if (jobTitles.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cargo encontrado"
        description="Crie o primeiro cargo para começar."
      />
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Subordinação</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead className="text-center">KPIs</TableHead>
              <TableHead className="text-center">Atividades</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobTitles.map((jobTitle) => {
              const hierarchyInfo = hierarchyLabels[jobTitle.hierarchy_level as keyof typeof hierarchyLabels]

              return (
                <TableRow key={jobTitle.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {jobTitle.name}
                      {jobTitle.allows_seniority && (
                        <Badge variant="outline" className="ml-1">
                          <Award className="h-3 w-3 mr-1" />
                          Senioridade
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {jobTitle.slug || '-'}
                      </code>
                      {duplicateJobTitleIds?.has(jobTitle.id) && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Slug duplicado</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={hierarchyInfo.color} title={hierarchyInfo.description}>
                        {hierarchyInfo.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {hierarchyInfo.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {jobTitle.subordination || '-'}
                  </TableCell>
                  <TableCell>{jobTitle.sector || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {jobTitle.kpis?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {jobTitle.main_activities?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(jobTitle)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => exportJobTitleToPDF(jobTitle.id)}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(jobTitle.id, jobTitle.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={handleDeleteConfirm}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir o cargo "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
      />
    </>
  )
}
