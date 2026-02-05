'use client'

import { useState } from "react"
import { UserPlus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { InviteUserForm } from "@/components/teams/invite-user-form"

interface Role {
  slug: string
  name: string
  description: string
}

interface InviteUserDialogProps {
  workspaceId: string
  currentUsers: number
  maxUsers: number | null
  planName: string
  roles: Role[]
  jobTitles?: { id: string; name: string; hierarchy_level: number }[]
}

export function InviteUserDialog({
  workspaceId,
  currentUsers,
  maxUsers,
  planName,
  roles,
  jobTitles
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false)

  const hasLimit = maxUsers !== null && maxUsers > 0
  const isAtLimit = hasLimit && currentUsers >= maxUsers
  const usagePercentage = hasLimit && maxUsers ? (currentUsers / maxUsers) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isAtLimit}>
          <UserPlus className="w-4 h-4" />
          Convidar Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Novo Colaborador</DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo membro ao time.
          </DialogDescription>
        </DialogHeader>

        {/* Plan Usage */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plano: <strong>{planName}</strong></span>
            <span className="text-muted-foreground">
              {currentUsers} / {maxUsers ?? '∞'} usuários
            </span>
          </div>
          {maxUsers && (
            <Progress value={usagePercentage} className="h-2" />
          )}
        </div>

        {isAtLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Limite de usuários atingido. Faça upgrade do seu plano para convidar mais membros.
            </AlertDescription>
          </Alert>
        )}

        <InviteUserForm
            workspaceId={workspaceId}
            roles={roles}
            jobTitles={jobTitles}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
            disabled={isAtLimit}
        />
      </DialogContent>
    </Dialog>
  )
}

