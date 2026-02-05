'use client'

import { useState } from "react"
import { ActionPlan, createActionPlan, updateActionPlan, deleteActionPlan } from "@/app/actions/comercial-pro"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NovelEditor } from "@/components/editor/novel-editor"
import { Plus, Calendar as CalendarIcon, User as UserIcon, Trash2, Clock, CheckCircle2, Circle, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { UserAvatar, ConfirmDialog } from "@/components/shared"

interface ActionPlansViewProps {
  initialPlans: ActionPlan[]
  workspaceId: string
  users: { id: string; name: string | null }[]
}

const STATUS_MAP = {
  not_started: { label: 'Não iniciado', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-100' },
  in_progress: { label: 'Em andamento', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
}

export function ActionPlansView({ initialPlans, workspaceId, users }: ActionPlansViewProps) {
  const [plans, setPlans] = useState<ActionPlan[]>(initialPlans)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const { toast } = useToast()

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteConfirm({ open: true, id })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return
    const id = deleteConfirm.id

    const result = await deleteActionPlan(id, workspaceId)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: result.error,
      })
    } else {
      toast({
        title: "Plano excluído",
        description: "O plano de ação foi removido com sucesso.",
      })
      setPlans(plans.filter(p => p.id !== id))
    }
  }

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const result = await createActionPlan(workspaceId, { name: '' })
      if (result.error) throw new Error(result.error)
      if (result.id) {
        window.location.href = `/${workspaceId}/comercial-pro/action-plans/${result.id}`
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      })
      setIsLoading(false)
    }
  }



  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Planos de Ação</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas iniciativas estratégicas.</p>
        </div>
        <Button onClick={handleCreate} disabled={isLoading} size="lg" className="rounded-full px-6">
          {isLoading ? <Clock className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
          Novo Plano
        </Button>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="plans">Meus Planos</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.filter(p => !p.is_template).length === 0 ? (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground text-lg">Nenhum plano de ação encontrado.</p>
                <Button variant="link" onClick={handleCreate} className="mt-2">
                  Criar o primeiro plano
                </Button>
              </div>
            ) : (
              plans.filter(p => !p.is_template).map((plan) => (
                <PlanCard key={plan.id} plan={plan} workspaceId={workspaceId} onDelete={handleDeleteClick} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.filter(p => p.is_template).length === 0 ? (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground text-lg">Nenhum modelo encontrado.</p>
                <p className="text-sm text-muted-foreground">Salve um plano como modelo para vê-lo aqui.</p>
              </div>
            ) : (
              plans.filter(p => p.is_template).map((plan) => (
                <PlanCard key={plan.id} plan={plan} workspaceId={workspaceId} onDelete={handleDeleteClick} isTemplate />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Excluir plano de ação?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

function PlanCard({ plan, workspaceId, onDelete, isTemplate }: { plan: ActionPlan, workspaceId: string, onDelete: (e: React.MouseEvent, id: string) => void, isTemplate?: boolean }) {
  const StatusIcon = STATUS_MAP[plan.status]?.icon || Circle
  


  return (
    <div 
      onClick={() => window.location.href = `/${workspaceId}/comercial-pro/action-plans/${plan.id}`}
      className="group relative bg-card hover:bg-accent/5 border rounded-xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        {isTemplate ? (
           <Badge variant="outline" className="rounded-full px-3 py-1 font-medium bg-purple-50 text-purple-600 border-purple-200">
             Modelo
           </Badge>
        ) : (
          <Badge 
            variant="secondary" 
            className={cn("rounded-full px-3 py-1 font-medium", STATUS_MAP[plan.status]?.bg, STATUS_MAP[plan.status]?.color)}
          >
            <StatusIcon className="w-3 h-3 mr-1.5" />
            {STATUS_MAP[plan.status]?.label}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
          onClick={(e) => onDelete(e, plan.id)}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {plan.name || 'Sem título'}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <UserAvatar name={plan.responsible?.full_name} size="xs" />
            <span className="truncate max-w-[100px]">{plan.responsible?.full_name?.split(' ')[0] || 'Sem resp.'}</span>
          </div>
          {plan.deadline && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{format(new Date(plan.deadline), "dd MMM", { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
