'use client'

import { UnifiedTask } from "@/lib/types/task"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle2, Clock, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateStandaloneTask } from "@/app/actions/tasks"
import { togglePDIActionComplete } from "@/app/actions/pdi"
import { toast } from "sonner"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TaskFilters } from "./task-filters"
import { EditTaskDialog } from "./edit-task-dialog"
import { duplicateTask, deleteStandaloneTask } from "@/app/actions/tasks"
import { Pencil, Copy, Trash2 } from "lucide-react"

interface TaskListViewProps {
  tasks: UnifiedTask[]
}

export function TaskListView({ tasks }: TaskListViewProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks)
  const [showPDI, setShowPDI] = useState(true)
  const [showStandalone, setShowStandalone] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null)

  const filteredTasks = optimisticTasks.filter(task => {
    if (!showPDI && task.type === 'pdi_action') return false
    if (!showStandalone && task.type === 'standalone_task') return false
    if (!showCompleted && task.status === 'done') return false
    return true
  })

  const handleToggleStatus = async (task: UnifiedTask) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    
    // Optimistic update
    setOptimisticTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    ))

    try {
      if (task.type === 'standalone_task') {
        await updateStandaloneTask(task.id, { status: newStatus })
      } else {
        await togglePDIActionComplete(task.id, newStatus === 'done')
      }
      toast.success('Status atualizado')
    } catch (error) {
      // Revert on error
      setOptimisticTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: task.status } : t
      ))
      toast.error('Erro ao atualizar status')
    }
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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'P1': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'P2': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      case 'P3': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'P1': return 'Alta'
      case 'P2': return 'Média'
      case 'P3': return 'Baixa'
      default: return '-'
    }
  }

  const getPDIContext = (task: UnifiedTask) => {
    if (task.type !== 'pdi_action') return null

    const contextParts = [task.metadata?.category, task.metadata?.pdi_criterion].filter(Boolean)
    return contextParts.length > 0 ? `PDI • ${contextParts.join(' • ')}` : 'PDI'
  }

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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="group cursor-pointer"
                  onClick={() => setEditingTask(task)}
                >
                  <TableCell>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(task)
                      }}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                        task.status === 'done' 
                          ? "bg-green-500 border-green-500 text-white" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      {task.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className={cn(
                      "flex flex-col",
                      task.status === 'done' && "text-muted-foreground line-through"
                    )}>
                      <span>{task.title}</span>
                      {task.type === 'pdi_action' && (
                        <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                          {getPDIContext(task)}
                        </span>
                      )}
                      {task.description && (
                        <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-normal",
                        task.type === 'pdi_action' 
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" 
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {task.type === 'pdi_action' ? 'Ação de desenvolvimento (PDI)' : 'Tarefa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.priority ? (
                      <Badge variant="outline" className={cn("text-xs font-normal", getPriorityColor(task.priority))}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(task.due_date), "d MMM", { locale: ptBR })}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(task)}>
                          {task.status === 'done' ? 'Marcar como não concluído' : 'Marcar como concluído'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingTask && (
        <EditTaskDialog 
          task={editingTask} 
          open={!!editingTask} 
          onOpenChange={(open) => !open && setEditingTask(null)} 
        />
      )}
    </div>
  )
}
