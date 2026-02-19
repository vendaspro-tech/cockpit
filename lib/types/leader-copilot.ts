export type LeaderCopilotActionType = "create_task" | "update_task" | "send_notification"

export type LeaderScopeUser = {
  id: string
  auth_user_id: string
  name: string
  email: string | null
  job_title: string | null
  job_title_slug: string | null
}

export type LeaderProgressSnapshot = {
  totals: {
    users: number
    tasks: {
      total: number
      todo: number
      in_progress: number
      done: number
      overdue: number
    }
    pdis: {
      active: number
      completed: number
      draft: number
      archived: number
    }
    assessments: {
      draft: number
      completed: number
    }
  }
  by_user: Array<{
    user_id: string
    user_name: string
    tasks: {
      total: number
      todo: number
      in_progress: number
      done: number
      overdue: number
    }
    pdis: {
      active: number
      completed: number
      draft: number
      archived: number
    }
    assessments: {
      draft: number
      completed: number
    }
  }>
}

export type PendingAction = {
  id: string
  workspace_id: string
  conversation_id: string
  actor_user_id: string
  target_user_id: string
  action_type: LeaderCopilotActionType
  payload: Record<string, any>
  status: "pending" | "cancelled" | "executed"
  executed_result: Record<string, any> | null
  created_at: string
  confirmed_at: string | null
  executed_at: string | null
}

export type ToolCallResult = {
  type: "answer" | "pending_action"
  message: string
  pendingAction?: {
    id: string
    actionType: LeaderCopilotActionType
    preview: Record<string, any>
  }
  metadata?: Record<string, any>
}
