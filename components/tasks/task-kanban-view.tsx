'use client'

import { UnifiedTask } from "@/lib/types/task"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateStandaloneTask, duplicateTask, deleteStandaloneTask } from "@/app/actions/tasks"
import { togglePDIActionComplete } from "@/app/actions/pdi"
import { toast } from "sonner"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TaskFilters } from "./task-filters"
import { EditTaskDialog } from "./edit-task-dialog"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { TaskStatus } from "@/lib/types/task"

interface TaskKanbanViewProps {
  tasks: UnifiedTask[]
}

interface TaskCardProps {
  task: UnifiedTask
  onOpen: (task: UnifiedTask) => void
  onStatusChange: (task: UnifiedTask, newStatus: TaskStatus) => void
  onDuplicate: (task: UnifiedTask) => void
  onDelete: (task: UnifiedTask) => void
  getPDIContext: (task: UnifiedTask) => string | null
}

interface KanbanColumnProps {
  column: { id: TaskStatus; title: string; color: string }
  tasks: UnifiedTask[]
  onOpen: (task: UnifiedTask) => void
  onStatusChange: (task: UnifiedTask, newStatus: TaskStatus) => void
  onDuplicate: (task: UnifiedTask) => void
  onDelete: (task: UnifiedTask) => void
  getPDIContext: (task: UnifiedTask) => string | null
}

function KanbanColumn({
  column,
  tasks,
  onOpen,
  onStatusChange,
  onDuplicate,
  onDelete,
  getPDIContext,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}` })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full bg-muted/30 rounded-xl border border-border",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full",
            column.id === 'todo' ? "bg-muted-foreground" :
            column.id === 'in_progress' ? "bg-blue-500" : "bg-green-500"
          )} />
          <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
        </div>
        <Badge variant="secondary" className="bg-background border shadow-sm">
          {tasks.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tasks.map(task => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onOpen={onOpen}
            onStatusChange={onStatusChange}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            getPDIContext={getPDIContext}
          />
        ))}
      </div>
    </div>
  )
}

function DraggableTaskCard({
  task,
  onOpen,
  onStatusChange,
  onDuplicate,
  onDelete,
  getPDIContext,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      taskId: task.id,
      currentStatus: task.status,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card p-3 rounded-lg border shadow-sm hover:shadow-md transition-all group cursor-pointer",
        isDragging && "opacity-50"
      )}
      onClick={() => onOpen(task)}
      {...attributes}
      {...listeners}
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange(task, 'todo')}>
              Mover para A Fazer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task, 'in_progress')}>
              Mover para Em Progresso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task, 'done')}>
              Mover para Concluído
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpen(task)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {task.type === 'standalone_task' && (
              <>
                <DropdownMenuItem onClick={() => onDuplicate(task)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600 focus:text-red-600">
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
      {task.type === 'pdi_action' && (
        <p className="text-xs text-muted-foreground line-clamp-1">
          {getPDIContext(task)}
        </p>
      )}

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
  )
}

export function TaskKanbanView({ tasks }: TaskKanbanViewProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks)
  const [showPDI, setShowPDI] = useState(true)
  const [showStandalone, setShowStandalone] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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
        await updateStandaloneTask(task.id, { status: newStatus })
      } else {
        const isCompleted = newStatus === 'done'
        await togglePDIActionComplete(task.id, isCompleted)
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

  const columns: Array<{ id: TaskStatus; title: string; color: string }> = [
    { id: 'todo', title: 'A Fazer', color: 'bg-muted text-muted-foreground' },
    { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { id: 'done', title: 'Concluído', color: 'bg-green-500/10 text-green-600 dark:text-green-400' }
  ]

  const getPDIContext = (task: UnifiedTask) => {
    if (task.type !== 'pdi_action') return null

    const contextParts = [task.metadata?.category, task.metadata?.pdi_criterion].filter(Boolean)
    return contextParts.length > 0 ? `PDI • ${contextParts.join(' • ')}` : 'PDI'
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const targetColumnId = String(over.id).replace('column-', '') as TaskStatus
    if (!columns.some((column) => column.id === targetColumnId)) return

    const taskId = String(active.id)
    const task = optimisticTasks.find((item) => item.id === taskId)
    if (!task) return

    await handleStatusChange(task, targetColumnId)
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] overflow-hidden">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={filteredTasks.filter(task => task.status === column.id)}
              onOpen={setEditingTask}
              onStatusChange={handleStatusChange}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              getPDIContext={getPDIContext}
            />
          ))}
        </div>
      </DndContext>

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
