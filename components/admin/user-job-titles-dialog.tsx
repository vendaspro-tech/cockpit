'use client'

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUserWorkspaceMemberships, UserWorkspaceMembership, UserWithDetails } from "@/app/actions/admin/users"
import { EditMemberJobTitleDialog } from "./edit-member-job-title-dialog"
import { Building2, Briefcase, Edit2, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UserJobTitlesDialogProps {
  user: UserWithDetails
  onClose: () => void
}

export function UserJobTitlesDialog({ user, onClose }: UserJobTitlesDialogProps) {
  const [memberships, setMemberships] = useState<UserWorkspaceMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMembership, setEditingMembership] = useState<UserWorkspaceMembership | null>(null)

  const loadMemberships = useCallback(async () => {
    setLoading(true)
    const data = await getUserWorkspaceMemberships(user.id)
    setMemberships(data)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    loadMemberships()
  }, [loadMemberships])

  const handleEditSuccess = () => {
    loadMemberships() // Reload data
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Cargos nos Workspaces</DialogTitle>
            <DialogDescription>
              Gerenciar cargos de <strong>{user.full_name || user.email}</strong> em cada workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : memberships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Usuário não participa de nenhum workspace.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((membership) => (
                      <TableRow key={membership.member_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{membership.workspace_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{membership.access_level}</Badge>
                        </TableCell>
                        <TableCell>
                          {membership.job_title_name ? (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span>{membership.job_title_name}</span>
                              {membership.hierarchy_level !== null && (
                                <Badge variant="secondary" className="text-xs">
                                  Nv. {membership.hierarchy_level}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMembership(membership)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingMembership && (
        <EditMemberJobTitleDialog
          membership={editingMembership}
          userName={user.full_name || user.email}
          onClose={() => setEditingMembership(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}
