'use client'

import { UnifiedTask } from "@/lib/types/task"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateStandaloneTask, duplicateTask, deleteStandaloneTask, updateExecutionActionStatus } from "@/app/actions/tasks"
import { updatePDIActionStatus } from "@/app/actions/pdi"
import { toast } from "sonner"
import { useState } from "react"
import type { DragEvent } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TaskFilters } from "./task-filters"
import { EditTaskDialog } from "./edit-task-dialog"

interface TaskKanbanViewProps {
  tasks: UnifiedTask[]
}

export function TaskKanbanView({ tasks }: TaskKanbanViewProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks)
  const [showPDI, setShowPDI] = useState(true)
  const [showStandalone, setShowStandalone] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [activeTask, setActiveTask] = useState<UnifiedTask | null>(null)
  const [startInEdit, setStartInEdit] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const filteredTasks = optimisticTasks.filter(task => {
    if (!showPDI && task.type === 'pdi_action') return false
    if (!showStandalone && task.type === 'standalone_task') return false
    if (!showCompleted && task.status === 'done') return false
    return true
  })

  const handleStatusChange = async (task: UnifiedTask, newStatus: 'todo' | 'in_progress' | 'done') => {
    if (task.status === newStatus) return

    // Optimistic update
    setOptimisticTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    ))

    try {
      if (task.type === 'standalone_task') {
        const result = await updateStandaloneTask(task.id, { status: newStatus })
        if (result?.error) throw new Error(result.error)
      } else if (task.type === 'pdi_action') {
        const pdiStatus = newStatus === 'todo' ? 'pending' : newStatus === 'in_progress' ? 'in_progress' : 'done'
        const result = await updatePDIActionStatus(task.id, pdiStatus)
        if (result?.error) throw new Error(result.error)
      } else {
        const result = await updateExecutionActionStatus(task.id, newStatus)
        if (result?.error) throw new Error(result.error)
      }
      toast.success('Status atualizado')
    } catch (error) {
      // Revert
      setOptimisticTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: task.status } : t
      ))
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, task: UnifiedTask) => {
    event.dataTransfer.setData('text/plain', task.id)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingTaskId(task.id)
  }

  const handleDragEnd = () => {
    setDraggingTaskId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, columnId: string) => {
    event.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, columnId: 'todo' | 'in_progress' | 'done') => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    const task = optimisticTasks.find(t => t.id === taskId)
    setDragOverColumn(null)
    if (!task) return
    void handleStatusChange(task, columnId)
  }

  const handleDuplicate = async (task: UnifiedTask) => {
    if (task.type !== 'standalone_task') {
      toast.error('Apenas tarefas avulsas podem ser duplicadas no momento.')
      return
    }
    
    try {
      const result = await duplicateTask(task.id)
      if (result.error) throw new Error(result.error)
      toast.success('Tarefa duplicada com sucesso!')
    } catch (error) {
      toast.error('Erro ao duplicar tarefa')
    }
  }

  const handleDelete = async (task: UnifiedTask) => {
    if (task.type !== 'standalone_task') {
      toast.error('Ações de PDI não podem ser excluídas por aqui.')
      return
    }

    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      const result = await deleteStandaloneTask(task.id)
      if (result.error) throw new Error(result.error)
      toast.success('Tarefa excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir tarefa')
    }
  }

  const openTaskDialog = (task: UnifiedTask, edit = false) => {
    setActiveTask(task)
    setStartInEdit(edit)
  }

  const columns = [
    { id: 'todo', title: 'A Fazer', color: 'bg-muted text-muted-foreground' },
    { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { id: 'done', title: 'Concluído', color: 'bg-green-500/10 text-green-600 dark:text-green-400' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TaskFilters 
          showPDI={showPDI} 
          setShowPDI={setShowPDI}
          showStandalone={showStandalone}
          setShowStandalone={setShowStandalone}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] overflow-hidden">
        {columns.map(column => (
          <div key={column.id} className="flex flex-col h-full bg-muted/30 rounded-xl border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", 
                  column.id === 'todo' ? "bg-muted-foreground" : 
                  column.id === 'in_progress' ? "bg-blue-500" : "bg-green-500"
                )} />
                <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
              </div>
              <Badge variant="secondary" className="bg-background border shadow-sm">
                {filteredTasks.filter(t => t.status === column.id).length}
              </Badge>
            </div>
            
            <div
              className={cn(
                "flex-1 overflow-y-auto p-3 space-y-3 transition-colors",
                dragOverColumn === column.id ? "bg-muted/40" : ""
              )}
              onDragOver={(event) => handleDragOver(event, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(event) => handleDrop(event, column.id as 'todo' | 'in_progress' | 'done')}
            >
              {filteredTasks
                .filter(task => task.status === column.id)
                .map(task => (
                <div
                  key={task.id}
                  className={cn(
                    "bg-card p-3 rounded-lg border shadow-sm hover:shadow-md transition-all group",
                    draggingTaskId === task.id ? "opacity-60" : "cursor-grab active:cursor-grabbing"
                  )}
                  draggable
                  onDragStart={(event) => handleDragStart(event, task)}
                  onDragEnd={handleDragEnd}
                  onClick={() => openTaskDialog(task)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded border",
                      task.type === 'pdi_action' 
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" 
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {task.type === 'pdi_action' ? 'PDI' : 'Tarefa'}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task, 'todo')}>
                          Mover para A Fazer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task, 'in_progress')}>
                          Mover para Em Progresso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task, 'done')}>
                          Mover para Concluído
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openTaskDialog(task, true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {task.type === 'standalone_task' && (
                          <>
                            <DropdownMenuItem onClick={() => handleDuplicate(task)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(task)} className="text-red-600 focus:text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h4 className="font-medium text-sm mb-2 text-foreground leading-snug">
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <div className={cn("w-2 h-2 rounded-full", 
                          task.priority === 'P1' ? "bg-red-500" :
                          task.priority === 'P2' ? "bg-yellow-500" : "bg-blue-500"
                        )} title={`Prioridade ${task.priority}`} />
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(task.due_date), "d MMM", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeTask && (
        <EditTaskDialog 
          task={activeTask} 
          open={!!activeTask} 
          startInEdit={startInEdit}
          onOpenChange={(open) => !open && setActiveTask(null)} 
        />
      )}
    </div>
  )
}
