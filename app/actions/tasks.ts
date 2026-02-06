'use server'

import { createClient } from "@/lib/supabase/server"
import { UnifiedTask, CreateTaskInput, TaskPriority, TaskStatus } from "@/lib/types/task"
import { revalidatePath } from "next/cache"
import { getAuthUser } from "@/lib/auth-server"

/**
 * Fetch all tasks (Standalone + PDI Actions) for a workspace
 */
export async function getUnifiedTasks(workspaceId: string): Promise<UnifiedTask[]> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  const user = await getAuthUser()

  if (!user) return []

  // 1. Fetch Standalone Tasks
  type TaskRow = {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority | null
    due_date: string | null
    created_at: string
    user_id: string
  }

  type PdiPlanRow = { id: string }
  type PdiItemRow = { id: string; category_name: string | null; pdi_plan_id: string }
  type PdiActionRow = {
    id: string
    pdi_item_id: string
    action_description: string
    status: TaskStatus
    priority: TaskPriority | null
    due_date: string | null
    created_at: string
    pdi_item?: PdiItemRow
  }

  type ExecutionActionRow = {
    id: string
    title: string
    description: string | null
    status: TaskStatus | 'blocked' | 'cancelled'
    priority: TaskPriority | null
    due_date: string | null
    created_at: string
    cycle_id: string
    owner_id: string | null
    pillar: string | null
  }

  const { data: standaloneTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id) // Only user's tasks for now, or remove for team view
    .order('created_at', { ascending: false })

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError)
  }

  // 2. Fetch PDI Actions
  // First, get PDI plan IDs for this user in this workspace
  const { data: pdiPlans, error: plansError } = await supabase
    .from('pdi_plans')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (plansError) {
    console.error('Error fetching PDI plans:', plansError)
  }

  const taskRows = (standaloneTasks ?? []) as TaskRow[]
  const planRows = (pdiPlans ?? []) as PdiPlanRow[]
  let pdiActions: PdiActionRow[] = []
  
  if (planRows.length > 0) {
    const planIds = planRows.map(p => p.id)
    
    // Get PDI items for these plans
    const { data: pdiItems, error: itemsError } = await supabase
      .from('pdi_items')
      .select('id, category_name, pdi_plan_id')
      .in('pdi_plan_id', planIds)

    if (itemsError) {
      console.error('Error fetching PDI items:', itemsError)
    }

    const itemRows = (pdiItems ?? []) as PdiItemRow[]

    if (itemRows.length > 0) {
      const itemIds = itemRows.map(i => i.id)
      
      // Get PDI actions for these items
      const { data: actions, error: actionsError } = await supabase
        .from('pdi_actions')
        .select('*')
        .in('pdi_item_id', itemIds)

      if (actionsError) {
        console.error('Error fetching PDI actions:', actionsError)
      }

      const actionRows = (actions ?? []) as PdiActionRow[]

      if (actionRows.length > 0) {
        // Create a map for quick lookup
        const itemMap = new Map(itemRows.map(item => [item.id, item]))
        
        pdiActions = actionRows.map(action => ({
          ...action,
          pdi_item: itemMap.get(action.pdi_item_id)
        }))
      }
    }
  }

  // 3. Normalize and Merge
  const unifiedTasks: UnifiedTask[] = []

  // Map Standalone Tasks
  if (taskRows.length > 0) {
    taskRows.forEach(task => {
      unifiedTasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        created_at: task.created_at,
        type: 'standalone_task',
        source_id: task.id,
        assignee_id: task.user_id
      })
    })
  }

  // Map PDI Actions
  if (pdiActions.length > 0) {
    pdiActions.forEach((action) => {
      // Map PDI status to Task status
      let status: TaskStatus = 'todo'
      if (action.status === 'done') status = 'done'
      else if (action.status === 'in_progress') status = 'in_progress'
      else status = 'todo'

      unifiedTasks.push({
        id: action.id, // Use action ID as unique ID
        title: action.action_description,
        description: null,
        status: status,
        priority: action.priority,
        due_date: action.due_date,
        created_at: action.created_at,
        type: 'pdi_action',
        source_id: action.id,
        metadata: {
          pdi_plan_id: action.pdi_item?.pdi_plan_id,
          pdi_item_id: action.pdi_item?.id,
          category: action.pdi_item?.category_name ?? undefined
        }
      })
    })
  }

  // 4. Fetch Execution Actions (Strategic Plan)
  const { data: strategicCycles, error: cyclesError } = await supabase
    .from('strategic_cycles')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .in('status', ['planning', 'executing'])

  if (cyclesError) {
    console.error('Error fetching strategic cycles:', cyclesError)
  }

  if (strategicCycles && strategicCycles.length > 0) {
    const cycleIds = strategicCycles.map(c => c.id)
    const cycleMap = new Map(strategicCycles.map(c => [c.id, c.name]))

    const { data: executionActions, error: execError } = await supabase
      .from('execution_actions')
      .select('*')
      .in('cycle_id', cycleIds)
      .or(`owner_id.eq.${user.id},owner_id.is.null`) // User's actions or unassigned

    if (execError) {
      console.error('Error fetching execution actions:', execError)
    }

    const executionRows = (executionActions ?? []) as ExecutionActionRow[]

    if (executionRows.length > 0) {
      executionRows.forEach((action) => {
        // Map execution status to Task status
        let status: TaskStatus = 'todo'
        if (action.status === 'done') status = 'done'
        else if (action.status === 'in_progress' || action.status === 'blocked') status = 'in_progress'
        else status = 'todo'

        unifiedTasks.push({
          id: action.id,
          title: action.title,
          description: action.description,
          status: status,
          priority: action.priority,
          due_date: action.due_date,
          created_at: action.created_at,
          type: 'execution_action',
          source_id: action.id,
          assignee_id: action.owner_id ?? undefined,
          metadata: {
            cycle_id: action.cycle_id,
            cycle_name: cycleMap.get(action.cycle_id),
            pillar: action.pillar ?? undefined
          }
        })
      })
    }
  }

  // Sort by created_at desc
  return unifiedTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Create a standalone task
 */
export async function createStandaloneTask(workspaceId: string, input: CreateTaskInput) {
  const supabase = await createClient()
  const user = await getAuthUser()

  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      due_date: input.due_date,
      status: input.status || 'todo'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return { error: 'Erro ao criar tarefa' }
  }

  revalidatePath(`/${workspaceId}/tasks`)
  return { success: true, task: data }
}

/**
 * Update a standalone task
 */
export async function updateStandaloneTask(taskId: string, updates: Partial<CreateTaskInput>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)

  if (error) {
    return { error: 'Erro ao atualizar tarefa' }
  }

  revalidatePath('/tasks')
  return { success: true }
}

export async function updateExecutionActionStatus(actionId: string, status: TaskStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('execution_actions')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null
    })
    .eq('id', actionId)

  if (error) {
    return { error: 'Erro ao atualizar ação estratégica' }
  }

  revalidatePath('/tasks')
  return { success: true }
}

/**
 * Duplicate a standalone task
 */
export async function duplicateTask(taskId: string) {
  const supabase = await createClient()
  const user = await getAuthUser()

  if (!user) return { error: 'Não autenticado' }

  // Get original task
  const { data: originalTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (fetchError || !originalTask) {
    return { error: 'Tarefa original não encontrada' }
  }

  // Create copy
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: originalTask.workspace_id,
      user_id: user.id,
      title: `${originalTask.title} (Cópia)`,
      description: originalTask.description,
      priority: originalTask.priority,
      due_date: originalTask.due_date,
      status: 'todo' // Reset status for copy
    })
    .select()
    .single()

  if (error) {
    return { error: 'Erro ao duplicar tarefa' }
  }

  revalidatePath('/tasks')
  return { success: true, task: data }
}

/**
 * Delete a standalone task
 */
export async function deleteStandaloneTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    return { error: 'Erro ao deletar tarefa' }
  }

  revalidatePath('/tasks')
  return { success: true }
}
