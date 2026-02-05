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
import { MoreHorizontal, Pencil, Trash, Lock } from "lucide-react"
import { useState } from "react"
import { deleteRole } from "@/app/actions/admin/roles"
import { useToast } from "@/hooks/use-toast"
import { RoleDialog } from "./role-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmDialog, TableEmptyState } from "@/components/shared"

interface Role {
  slug: string
  name: string
  description: string
  permissions: Record<string, boolean>
  is_system_role: boolean
}

interface RolesListProps {
  roles: Role[]
}

export function RolesList({ roles }: RolesListProps) {
  const { toast } = useToast()
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; slug: string | null }>({ open: false, slug: null })

  const handleDeleteClick = (slug: string) => {
    setDeleteConfirm({ open: true, slug })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.slug) return
    const result = await deleteRole(deleteConfirm.slug)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso"
      })
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableEmptyState colSpan={5} message="Nenhum perfil encontrado." />
            ) : (
              roles.map((role) => (
                <TableRow key={role.slug}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {role.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="flex w-fit items-center gap-1 cursor-help">
                              <Lock className="h-3 w-3" />
                              Sistema
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Perfil padrão do sistema. Não pode ser excluído.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline">Personalizado</Badge>
                    )}
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
                        <DropdownMenuItem onClick={() => setEditingRole(role)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {!role.is_system_role && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(role.slug)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleDialog
        role={editingRole || undefined}
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, slug: open ? deleteConfirm.slug : null })}
        title="Excluir perfil?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
