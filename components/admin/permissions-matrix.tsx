'use client'

import React, { useState } from "react"
import { SYSTEM_PERMISSIONS } from "@/lib/permissions"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateRole } from "@/app/actions/admin/roles"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Role {
  slug: string
  name: string
  description: string
  permissions: Record<string, boolean>
  is_system_role: boolean
}

interface PermissionsMatrixProps {
  roles: Role[]
}

export function PermissionsMatrix({ roles }: PermissionsMatrixProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const handlePermissionChange = async (roleSlug: string, permissionKey: string, checked: boolean) => {
    const role = roles.find(r => r.slug === roleSlug)
    if (!role) return

    // Don't allow editing system roles permissions for now if we want to enforce defaults
    // But usually admins want to customize even system roles. Let's allow it but show a warning or lock if needed.
    // For now, let's assume system roles are editable but maybe we should lock 'owner'.
    if (role.slug === 'owner') {
      toast({
        title: "Ação bloqueada",
        description: "O perfil de Dono tem todas as permissões e não pode ser modificado.",
        variant: "destructive"
      })
      return
    }

    const loadingKey = `${roleSlug}-${permissionKey}`
    setLoading(prev => ({ ...prev, [loadingKey]: true }))

    const newPermissions = { ...role.permissions, [permissionKey]: checked }

    const result = await updateRole(roleSlug, { permissions: newPermissions })

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      // Optimistic update or just wait for revalidatePath
      toast({
        title: "Permissão atualizada",
        description: `Permissão ${checked ? 'concedida' : 'removida'} com sucesso.`
      })
    }

    setLoading(prev => ({ ...prev, [loadingKey]: false }))
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px] min-w-[200px] bg-muted/50 sticky left-0 z-20">Permissão</TableHead>
            {roles.map(role => (
              <TableHead key={role.slug} className="text-center min-w-[120px]">
                <div className="flex flex-col items-center gap-1 py-2">
                  <span className="font-medium">{role.name}</span>
                  {role.is_system_role && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Sistema</Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(SYSTEM_PERMISSIONS).map(([categoryKey, category]) => (
            <React.Fragment key={categoryKey}>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell className="font-semibold sticky left-0 bg-muted/30 z-10" colSpan={roles.length + 1}>
                  {category.label}
                </TableCell>
              </TableRow>
              {category.permissions.map(permission => (
                <TableRow key={permission.key}>
                  <TableCell className="font-medium text-sm text-muted-foreground sticky left-0 bg-background z-10 border-r">
                    {permission.label}
                  </TableCell>
                  {roles.map(role => {
                    const isOwner = role.slug === 'owner'
                    const isChecked = isOwner ? true : !!role.permissions?.[permission.key]
                    const isLoading = loading[`${role.slug}-${permission.key}`]

                    return (
                      <TableCell key={`${role.slug}-${permission.key}`} className="text-center p-0">
                        <div className="flex items-center justify-center h-full w-full py-3">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Checkbox 
                              checked={isChecked}
                              onCheckedChange={(checked) => handlePermissionChange(role.slug, permission.key, checked as boolean)}
                              disabled={isOwner}
                              className={isOwner ? "opacity-50 cursor-not-allowed data-[state=checked]:bg-primary/50" : ""}
                            />
                          )}
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
