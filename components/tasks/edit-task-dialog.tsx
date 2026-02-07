'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateExecutionAction, updateStandaloneTask } from "@/app/actions/tasks"
import { updatePDIAction } from "@/app/actions/pdi-actions"
import { UnifiedTask } from "@/lib/types/task"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface EditTaskDialogProps {
  task: UnifiedTask
  open: boolean
  onOpenChange: (open: boolean) => void
  startInEdit?: boolean
}

export function EditTaskDialog({ task, open, onOpenChange, startInEdit = false }: EditTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(startInEdit)

  useEffect(() => {
    if (open) {
      setIsEditing(startInEdit)
    }
  }, [open, startInEdit, task.id])

  const statusLabel: Record<UnifiedTask["status"], string> = {
    todo: "A Fazer",
    in_progress: "Em Progresso",
    done: "Concluido",
  }

  const priorityLabel: Record<"P1" | "P2" | "P3", string> = {
    P1: "Alta",
    P2: "Media",
    P3: "Baixa",
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as 'P1' | 'P2' | 'P3'
    const dueDate = formData.get('due_date') as string

    try {
      if (task.type === 'standalone_task') {
        const result = await updateStandaloneTask(task.id, {
          title,
          description,
          priority: priority || undefined,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        })
        if (result.error) throw new Error(result.error)
      } else if (task.type === "pdi_action") {
        // For PDI actions, we update using pdi-actions server action
        const result = await updatePDIAction(task.id, title, undefined, priority)
        if (result.error) throw new Error(result.error)
      } else {
        const result = await updateExecutionAction(task.id, {
          title,
          description,
          priority: priority || undefined,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        })
        if (result.error) throw new Error(result.error)
      }

      toast.success('Tarefa atualizada com sucesso!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar tarefa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarefa" : "Detalhes da Tarefa"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Faça alterações na sua tarefa." : "Visualize os dados da tarefa."}
          </DialogDescription>
        </DialogHeader>
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Nome</Label>
                <Input 
                  id="title" 
                  name="title" 
                  required 
                  defaultValue={task.title} 
                  placeholder="Ex: Preparar apresentação" 
                />
              </div>
              
              {task.type !== 'pdi_action' && (
                <div className="grid gap-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={task.description || ''} 
                    placeholder="Detalhes da tarefa..." 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select name="priority" defaultValue={task.priority || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 - Alta (Vermelho)</SelectItem>
                      <SelectItem value="P2">P2 - Media (Amarelo)</SelectItem>
                      <SelectItem value="P3">P3 - Baixa (Azul)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {task.type !== 'pdi_action' && (
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Data</Label>
                    <Input 
                      id="due_date" 
                      name="due_date" 
                      type="date" 
                      defaultValue={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Voltar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alteracoes'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid gap-1">
                <Label>Nome</Label>
                <p>{task.title}</p>
              </div>
              <div className="grid gap-1">
                <Label>Descricao</Label>
                <p className="text-muted-foreground">{task.description || "-"}</p>
              </div>
              <div className="grid gap-1">
                <Label>Data</Label>
                <p className="text-muted-foreground">
                  {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                </p>
              </div>
              <div className="grid gap-1">
                <Label>Prioridade</Label>
                <p className="text-muted-foreground">{task.priority ? priorityLabel[task.priority] : "-"}</p>
              </div>
              <div className="grid gap-1">
                <Label>Status</Label>
                <p className="text-muted-foreground">{statusLabel[task.status]}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button type="button" onClick={() => setIsEditing(true)}>
                Editar tarefa
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
