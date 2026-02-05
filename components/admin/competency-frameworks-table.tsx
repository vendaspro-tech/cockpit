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
import { MoreHorizontal, Pencil, Trash, Copy, Award } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteCompetencyFramework } from "@/app/actions/admin/competency-frameworks"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog, EmptyState } from "@/components/shared"
import type { CompetencyFramework } from "@/lib/types/competency"

interface CompetencyFrameworksTableProps {
  frameworks: (CompetencyFramework & { job_titles: any })[]
  onEdit: (framework: CompetencyFramework & { job_titles: any }) => void
  onDuplicate?: (framework: CompetencyFramework & { job_titles: any }) => void
}

const hierarchyLabels = {
  0: { label: "Estratégico", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  1: { label: "Tático", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  2: { label: "Operacional", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  3: { label: "Execução", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" }
}

export function CompetencyFrameworksTable({ frameworks, onEdit, onDuplicate }: CompetencyFrameworksTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    id: string | null
    name: string | null
  }>({
    open: false,
    id: null,
    name: null
  })

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return

    const result = await deleteCompetencyFramework(deleteConfirm.id)
    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Framework excluído com sucesso"
      })
      router.refresh()
    }
    setDeleteConfirm({ open: false, id: null, name: null })
  }

  if (frameworks.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="Nenhum framework encontrado"
        description="Crie o primeiro framework de competências para começar."
      />
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cargo</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-center">Comportamentais</TableHead>
              <TableHead className="text-center">Técnicas (DEF)</TableHead>
              <TableHead className="text-center">Processos</TableHead>
              <TableHead>Pesos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {frameworks.map((framework) => {
              const hierarchyInfo = hierarchyLabels[framework.job_titles?.hierarchy_level as keyof typeof hierarchyLabels]
              const behavioralCount = Array.isArray(framework.behavioral_competencies)
                ? framework.behavioral_competencies.length
                : 0
              const technicalCount = Array.isArray(framework.technical_def_competencies)
                ? framework.technical_def_competencies.length
                : 0
              const processCount = Array.isArray(framework.process_competencies)
                ? framework.process_competencies.length
                : 0
              const weights = framework.weights ?? { behavioral: 0, technical_def: 0, process: 0 }

              return (
                <TableRow key={framework.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{framework.job_titles?.name || 'N/A'}</span>
                      {framework.job_titles?.slug && (
                        <code className="text-xs text-muted-foreground">
                          {framework.job_titles.slug}
                        </code>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hierarchyInfo && (
                      <Badge className={hierarchyInfo.color}>
                        {hierarchyInfo.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {behavioralCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                      {technicalCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      {processCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 text-xs">
                      <Badge variant="outline" className="text-xs">
                        C: {weights.behavioral}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        T: {weights.technical_def}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        P: {weights.process}%
                      </Badge>
                    </div>
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
                        <DropdownMenuItem onClick={() => onEdit(framework)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {onDuplicate && (
                          <DropdownMenuItem onClick={() => onDuplicate(framework)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(framework.id, framework.job_titles?.name || 'Framework')}
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
        description={`Tem certeza que deseja excluir o framework "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
      />
    </>
  )
}
