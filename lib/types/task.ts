export type TaskPriority = 'P1' | 'P2' | 'P3'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface UnifiedTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  due_date: string | null
  created_at: string
  type: 'pdi_action' | 'standalone_task' | 'execution_action'
  source_id: string // pdi_action_id or task_id or execution_action_id
  assignee_id?: string
  metadata?: {
    // PDI specific
    pdi_plan_id?: string
    pdi_item_id?: string
    category?: string
    pdi_title?: string
    // Strategic cycle specific
    cycle_id?: string
    cycle_name?: string
    pillar?: string
  }
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  status?: TaskStatus
}

