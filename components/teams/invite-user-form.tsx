"use client"

import { useState, useTransition } from "react"
import { Mail, User, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvitation } from "@/app/actions/invitations"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export interface InviteUserFormProps {
  workspaceId: string
  roles: { slug: string; name: string }[]
  jobTitles?: { id: string; name: string; hierarchy_level: number }[]
  onSuccess?: () => void
  onCancel?: () => void
  disabled?: boolean
}

export function InviteUserForm({ workspaceId, roles, jobTitles, onSuccess, onCancel, disabled }: InviteUserFormProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("member")
  const [jobTitleId, setJobTitleId] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (!jobTitleId) {
      toast({
        title: "Erro",
        description: "Cargo é obrigatório",
        variant: "destructive"
      })
      return
    }

    startTransition(async () => {
      const result = await createInvitation(workspaceId, email, name, role, jobTitleId)

      if (result.error) {
        toast({
          title: "Erro ao enviar convite",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: result.message ? "Usuário adicionado!" : "Convite enviado!",
          description: result.message || `Convite enviado para ${email}`
        })
        setEmail("")
        setName("")
        setRole("member")
        setJobTitleId("")
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="colaborador@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            required
            disabled={isPending || disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome (opcional)</Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="Nome do colaborador"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-9"
            disabled={isPending || disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Nível de Acesso *</Label>
        <Select value={role} onValueChange={setRole} disabled={isPending || disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o nível de acesso" />
          </SelectTrigger>
          <SelectContent>
            {roles.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhum nível de acesso disponível
              </div>
            ) : (
              roles.map((r) => (
                <SelectItem key={r.slug} value={r.slug}>
                  {r.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define permissões de ação no workspace (criar, editar, deletar)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Cargo *</Label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          <Select value={jobTitleId} onValueChange={setJobTitleId} disabled={isPending || disabled}>
            <SelectTrigger className="pl-9">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              {!jobTitles || jobTitles.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhum cargo disponível
                </div>
              ) : (
                jobTitles
                  .sort((a, b) => a.hierarchy_level - b.hierarchy_level)
                  .map((jt) => (
                    <SelectItem key={jt.id} value={jt.id}>
                      {jt.name}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Define função e hierarquia (visibilidade de dados sensíveis)
        </p>
        {!jobTitles || jobTitles.length === 0 ? (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Nenhum cargo cadastrado. Cadastre cargos antes de convidar usuários.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
            <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            >
            Cancelar
            </Button>
        )}
        <Button type="submit" disabled={isPending || disabled}>
          {isPending ? "Enviando..." : "Enviar Convite"}
        </Button>
      </div>
    </form>
  )
}
