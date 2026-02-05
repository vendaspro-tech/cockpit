'use client'

import { useEffect, useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar as CalendarIcon, Video, User as UserIcon, FileText, ExternalLink, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createProConsultancy, getProConsultancies, getProActionPlans, getProWorkspaceUsers } from "@/app/actions/admin/comercial-pro"

type Workspace = { id: string; name: string }

type ConsultancyRow = {
  id: string
  workspace_id: string
  date: string
  mentor_id: string | null
  recording_link: string | null
  comments: string | null
  action_plan_id: string | null
  created_at: string
  mentor?: { full_name?: string | null; email?: string | null } | null
  action_plan?: { name?: string | null } | null
}

export function ComercialProConsultoriasPanel({
  workspaces,
  initialWorkspaceId,
  initialConsultancies,
  initialUsers,
  initialPlans
}: {
  workspaces: Workspace[]
  initialWorkspaceId?: string
  initialConsultancies: ConsultancyRow[]
  initialUsers: { id: string; name: string }[]
  initialPlans: { id: string; name: string }[]
}) {
  const { toast } = useToast()
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId || workspaces[0]?.id || "")
  const [consultancies, setConsultancies] = useState(initialConsultancies)
  const [users, setUsers] = useState(initialUsers)
  const [plans, setPlans] = useState(initialPlans)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, startTransition] = useTransition()

  const [form, setForm] = useState({
    date: "",
    mentor_id: "",
    recording_link: "",
    comments: "",
    action_plan_id: ""
  })

  useEffect(() => {
    if (!workspaceId) return
    startTransition(async () => {
      const [c, u, p] = await Promise.all([
        getProConsultancies(workspaceId),
        getProWorkspaceUsers(workspaceId),
        getProActionPlans(workspaceId)
      ])
      setConsultancies(c)
      setUsers(u as any)
      setPlans((p as any).map((i: any) => ({ id: i.id, name: i.name })))
    })
  }, [workspaceId])

  const handleCreate = async () => {
    if (!form.date) {
      toast({ variant: "destructive", title: "Data obrigatória" })
      return
    }
    startTransition(async () => {
      const result = await createProConsultancy(workspaceId, {
        date: form.date,
        mentor_id: form.mentor_id || undefined,
        recording_link: form.recording_link || undefined,
        comments: form.comments || undefined,
        action_plan_id: form.action_plan_id || undefined
      })
      if (result.error) {
        toast({ variant: "destructive", title: "Erro", description: result.error })
      } else {
        const updated = await getProConsultancies(workspaceId)
        setConsultancies(updated as any)
        toast({ title: "Consultoria criada" })
        setIsDialogOpen(false)
        setForm({ date: "", mentor_id: "", recording_link: "", comments: "", action_plan_id: "" })
      }
    })
  }

  const selectedWorkspace = useMemo(
    () => workspaces.find(w => w.id === workspaceId)?.name || "Selecione um workspace",
    [workspaceId, workspaces]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
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
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova consultoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultorias em {selectedWorkspace}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Gravação</TableHead>
                <TableHead>Plano de Ação</TableHead>
                <TableHead>Comentários</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultancies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma consultoria registrada neste workspace.
                  </TableCell>
                </TableRow>
              ) : (
                consultancies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{item.mentor?.full_name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.recording_link ? (
                        <Badge variant="outline" className="gap-1" asChild>
                          <a href={item.recording_link} target="_blank" rel="noopener noreferrer">
                            <Video className="h-3 w-3" /> Abrir
                          </a>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.action_plan ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{item.action_plan.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate" title={item.comments || ''}>
                      {item.comments || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova consultoria</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mentor</label>
              <Select
                value={form.mentor_id}
                onValueChange={(value) => setForm({ ...form, mentor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem mentor</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Plano de ação vinculado</label>
              <Select
                value={form.action_plan_id}
                onValueChange={(value) => setForm({ ...form, action_plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Link da gravação</label>
              <Input
                placeholder="https://"
                value={form.recording_link}
                onChange={(e) => setForm({ ...form, recording_link: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Comentários</label>
              <Textarea
                rows={3}
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
