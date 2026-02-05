'use client'

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Loader2, User as UserIcon, Calendar as CalendarIcon, CheckCircle2, Circle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createProActionPlan, getProActionPlans, getProWorkspaceUsers } from "@/app/actions/admin/comercial-pro"
import { useToast } from "@/hooks/use-toast"

type Workspace = { id: string; name: string }

type PlanRow = {
  id: string
  name: string
  status: 'not_started' | 'in_progress' | 'completed'
  deadline: string | null
  created_at: string
  responsible?: { full_name?: string | null }
}

const STATUS_BADGES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  not_started: { label: 'Não iniciado', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-100' },
  in_progress: { label: 'Em andamento', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
}

export function ComercialProPlanosPanel({
  workspaces,
  initialWorkspaceId,
  initialPlans,
  initialUsers
}: {
  workspaces: Workspace[]
  initialWorkspaceId?: string
  initialPlans: PlanRow[]
  initialUsers: { id: string; name: string }[]
}) {
  const { toast } = useToast()
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId || workspaces[0]?.id || "")
  const [plans, setPlans] = useState(initialPlans)
  const [users, setUsers] = useState(initialUsers)
  const [isLoading, startTransition] = useTransition()

  const [newPlan, setNewPlan] = useState({
    name: "",
    responsible_id: "none",
    deadline: "",
  })

  useEffect(() => {
    if (!workspaceId) return
    startTransition(async () => {
      const [p, u] = await Promise.all([
        getProActionPlans(workspaceId),
        getProWorkspaceUsers(workspaceId)
      ])
      setPlans(p as any)
      setUsers(u as any)
    })
  }, [workspaceId])

  const handleCreate = async () => {
    if (!newPlan.name.trim()) {
      toast({ variant: "destructive", title: "Informe um nome para o plano" })
      return
    }
    startTransition(async () => {
      const result = await createProActionPlan(workspaceId, {
        name: newPlan.name.trim(),
        responsible_id: newPlan.responsible_id === "none" ? undefined : newPlan.responsible_id,
        deadline: newPlan.deadline || null
      })
      if (result.error) {
        toast({ variant: "destructive", title: "Erro ao criar plano", description: result.error })
      } else {
        const updated = await getProActionPlans(workspaceId)
        setPlans(updated as any)
        toast({ title: "Plano criado" })
        setNewPlan({ name: "", responsible_id: "none", deadline: "" })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Workspace</p>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Selecione um workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nome</label>
            <Input
              placeholder="Plano comercial Q1"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              className="w-[220px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Responsável</label>
            <Select
              value={newPlan.responsible_id}
              onValueChange={(value) => setNewPlan({ ...newPlan, responsible_id: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Deadline</label>
            <Input
              type="date"
              value={newPlan.deadline}
              onChange={(e) => setNewPlan({ ...newPlan, deadline: e.target.value })}
              className="w-[160px]"
            />
          </div>
          <Button onClick={handleCreate} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar plano
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos de ação</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum plano neste workspace.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => {
                  const status = STATUS_BADGES[plan.status] || STATUS_BADGES.not_started
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={plan.id} className="cursor-pointer" onClick={() => window.location.href = `/${workspaceId}/comercial-pro/action-plans/${plan.id}`}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-2 ${status.bg} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.responsible?.full_name ? (
                          <span className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            {plan.responsible.full_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.deadline ? (
                          <span className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(plan.deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
