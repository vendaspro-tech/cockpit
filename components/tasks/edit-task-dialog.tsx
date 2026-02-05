'use client'

import { useState } from "react"
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
import { updateStandaloneTask } from "@/app/actions/tasks"
import { updatePDIAction } from "@/app/actions/pdi-actions"
import { UnifiedTask } from "@/lib/types/task"
import { toast } from "sonner"

interface EditTaskDialogProps {
  task: UnifiedTask
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const [loading, setLoading] = useState(false)

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
      } else {
        // For PDI actions, we update using pdi-actions server action
        // Note: PDI actions might not support all fields the same way, but we added priority
        const result = await updatePDIAction(task.id, title, undefined, priority)
        // Note: updatePDIAction signature might need check. 
        // It is: (actionId, description, deadlineDays?, priority?)
        // We are passing title as description.
        // We are NOT updating due_date here for PDI yet in that specific action?
        // Let's check updatePDIAction signature in pdi-actions.ts
        if (result.error) throw new Error(result.error)
      }

      toast.success('Tarefa atualizada com sucesso!')
      onOpenChange(false)
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
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>
            Faça alterações na sua tarefa aqui.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                name="title" 
                required 
                defaultValue={task.title} 
                placeholder="Ex: Preparar apresentação" 
              />
            </div>
            
            {task.type === 'standalone_task' && (
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
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
                    <SelectItem value="P2">P2 - Média (Amarelo)</SelectItem>
                    <SelectItem value="P3">P3 - Baixa (Azul)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {task.type === 'standalone_task' && (
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Data de Entrega</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
