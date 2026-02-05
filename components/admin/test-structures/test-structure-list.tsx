'use client'

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Pencil,
  Copy,
  History,
  FileJson,
  Trash2,
  CheckCircle2,
  Circle
} from "lucide-react"
import type { TestStructure, TestType } from "@/lib/types/test-structure"
import { useToast } from "@/hooks/use-toast"
import { deleteTestStructure } from "@/app/actions/admin/test-structures"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TestStructureListProps {
  testStructures: TestStructure[]
  onEdit: (structure: TestStructure) => void
  onDuplicate: (structure: TestStructure) => void
  onViewHistory: (testType: TestType) => void
}

// Test type labels for UI
const TEST_TYPE_LABELS: Record<TestType, string> = {
  disc: 'DISC',
  seniority_seller: 'Senioridade Vendedor',
  seniority_leader: 'Senioridade Líder',
  leadership_style: 'Estilo de Liderança',
  def_method: 'Método DEF',
  values_8d: '8 Dimensões de Valores'
}

// Test type colors
const TEST_TYPE_COLORS: Record<TestType, string> = {
  disc: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  seniority_seller: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  seniority_leader: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  leadership_style: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  def_method: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  values_8d: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
}

export function TestStructureList({
  testStructures,
  onEdit,
  onDuplicate,
  onViewHistory
}: TestStructureListProps) {
  const { toast } = useToast()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [structureToDelete, setStructureToDelete] = useState<TestStructure | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (structure: TestStructure) => {
    setStructureToDelete(structure)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!structureToDelete) return

    setIsDeleting(true)
    const result = await deleteTestStructure(structureToDelete.id)

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Estrutura de teste excluída com sucesso"
      })
    }

    setIsDeleting(false)
    setDeleteConfirmOpen(false)
    setStructureToDelete(null)
  }

  const handleExportJson = (structure: TestStructure) => {
    const json = JSON.stringify(structure, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${structure.test_type}_v${structure.version}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exportado",
      description: "Estrutura exportada como JSON"
    })
  }

  if (testStructures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">Nenhuma estrutura de teste encontrada</p>
        <p className="text-sm text-muted-foreground">
          Clique em &quot;Nova Estrutura&quot; para começar
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Tipo de Teste</TableHead>
              <TableHead className="w-[25%]">Nome</TableHead>
              <TableHead className="w-[10%]">Versão</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[15%]">Atualizado</TableHead>
              <TableHead className="text-right w-[10%]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testStructures.map((structure) => (
              <TableRow key={structure.id}>
                <TableCell>
                  <Badge className={TEST_TYPE_COLORS[structure.test_type]} variant="secondary">
                    {TEST_TYPE_LABELS[structure.test_type]}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {TEST_TYPE_LABELS[structure.test_type]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">v{structure.version}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {structure.is_active ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" variant="secondary">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      <Circle className="mr-1 h-3 w-3" />
                      Inativa
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(structure.updated_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(structure)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewHistory(structure.test_type)}>
                        <History className="mr-2 h-4 w-4" />
                        Ver Histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportJson(structure)}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Exportar JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(structure)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(structure)}
                        className="text-destructive"
                        disabled={structure.is_active}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir estrutura de teste"
        description={
          structureToDelete
            ? `Tem certeza que deseja excluir ${TEST_TYPE_LABELS[structureToDelete.test_type]} v${structureToDelete.version}? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}
