'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  getAvailableUsersForPlan,
  addMemberToPlanSquad,
  removeMemberFromPlanSquad,
  type PlanSquadSimple 
} from '@/app/actions/commercial-plans-squads'
import { getSquadMembers, type SquadMember } from '@/app/actions/squads'
import { X, Crown, UserPlus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SquadMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  squad: PlanSquadSimple
  workspaceId: string
  onSuccess: () => void
}

export function SquadMembersDialog({
  open,
  onOpenChange,
  squad,
  workspaceId,
  onSuccess
}: SquadMembersDialogProps) {
  const [members, setMembers] = useState<SquadMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<SquadMember | null>(null)
  const { toast } = useToast()

  const loadMembers = useCallback(async () => {
    const result = await getSquadMembers(squad.squad_id)
    if (result.data) {
      setMembers(result.data)
    }
  }, [squad.squad_id])

  const loadAvailableUsers = useCallback(async () => {
    const result = await getAvailableUsersForPlan(workspaceId)
    if (result.data) {
      setAvailableUsers(result.data)
    }
  }, [workspaceId])

  useEffect(() => {
    if (open) {
      loadMembers()
      loadAvailableUsers()
    }
  }, [open, loadAvailableUsers, loadMembers])

  const handleAddMember = async () => {
    if (!selectedUserId) return

    setLoading(true)
    const result = await addMemberToPlanSquad(squad.squad_id, selectedUserId)
    setLoading(false)

    if (!result.error) {
      toast({
        title: 'Membro adicionado',
        description: 'Membro foi adicionado ao squad com sucesso'
      })
      setSelectedUserId('')
      await loadMembers()
      await loadAvailableUsers()
      onSuccess()
    } else {
      toast({
        title: 'Erro ao adicionar membro',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  const handleRemoveMember = async () => {
    if (!removing) return

    const result = await removeMemberFromPlanSquad(squad.squad_id, removing.user_id)

    if (!result.error) {
      toast({
        title: 'Membro removido',
        description: 'Membro foi removido do squad com sucesso'
      })
      setRemoving(null)
      await loadMembers()
      await loadAvailableUsers()
      onSuccess()
    } else {
      toast({
        title: 'Erro ao remover membro',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Membros - {squad.squad_name}</DialogTitle>
            <DialogDescription>
              Gerencie os membros deste squad
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">
                  Membros Atuais ({members.length})
                </Label>
              </div>

              {members.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum membro ainda
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.map((member) => {
                  const isLeader = member.user_id === squad.leader_id

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2">
                        {isLeader && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {member.user.full_name || member.user.email}
                          </p>
                          {isLeader && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Líder
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!isLeader && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoving(member)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Add Member */}
            <div className="space-y-3">
              <Label className="text-base">Adicionar Membros</Label>
              
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os usuários do workspace já estão em squads
                </p>
              )}

              {availableUsers.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || loading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removing} onOpenChange={(open: boolean) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{removing?.user.full_name || removing?.user.email}</strong> do squad?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
