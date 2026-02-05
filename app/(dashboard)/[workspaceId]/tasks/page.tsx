import { getUnifiedTasks } from "@/app/actions/tasks"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TaskListView } from "@/components/tasks/task-list-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, KanbanSquare, ListTodo } from "lucide-react"

import { TaskKanbanView } from "@/components/tasks/task-kanban-view"
import { TaskCalendarView } from "@/components/tasks/task-calendar-view"

interface TasksPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function TasksPage({ params }: TasksPageProps) {
  const { workspaceId } = await params
  const tasks = await getUnifiedTasks(workspaceId)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Tarefas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas tarefas e ações do PDI em um só lugar.
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <KanbanSquare className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Calendário
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0">
          <TaskListView tasks={tasks} />
        </TabsContent>
        
        <TabsContent value="kanban" className="mt-0">
          <TaskKanbanView tasks={tasks} />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-0">
          <TaskCalendarView tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
