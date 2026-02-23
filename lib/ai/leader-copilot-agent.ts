import type { SupabaseClient } from "@supabase/supabase-js"
import OpenAI from "openai"

import { writeAuditLog } from "@/lib/audit"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  assertTargetInLeaderScope,
  getInternalUserId,
  getLeaderScopeUsers,
  isLeaderCopilotEnabled,
} from "@/lib/leader-scope"
import type {
  LeaderCopilotActionType,
  LeaderProgressSnapshot,
  PendingAction,
  ToolCallResult,
} from "@/lib/types/leader-copilot"

export const LEADER_COPILOT_AGENT_NAME = "Copiloto do Líder"

const SYSTEM_PROMPT = [
  "Você é o Copiloto do Líder Comercial.",
  "Você só atua no workspace atual e somente nos usuários autorizados no contexto.",
  "Nunca execute escrita direta.",
  "Para escritas, sempre use tools de proposta e aguarde confirmação explícita.",
  "Se faltarem dados para uma ação, faça pergunta objetiva.",
  "Responda em português do Brasil, com objetividade.",
].join("\n")

type RunTurnParams = {
  workspaceId: string
  conversationId: string
  actorAuthUserId: string
  actorInternalUserId: string
  message: string
  client: SupabaseClient
}

type ExecutePendingParams = {
  workspaceId: string
  conversationId: string
  pendingActionId: string
  actorAuthUserId: string
}

type ToolExecutionContext = {
  workspaceId: string
  conversationId: string
  actorAuthUserId: string
  actorInternalUserId: string
  scopedUsers: Awaited<ReturnType<typeof getLeaderScopeUsers>>
  client: SupabaseClient
}

type TaskRow = {
  id: string
  user_id: string
  status: "todo" | "in_progress" | "done"
  due_date: string | null
}

type PdiRow = {
  user_id: string
  status: string
}

type AssessmentRow = {
  evaluated_user_id: string | null
  status: string
}

type FunctionToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

function safeJsonParse(value: string): Record<string, any> {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function nowIso() {
  return new Date().toISOString()
}

function isFunctionToolCall(toolCall: unknown): toolCall is FunctionToolCall {
  if (!toolCall || typeof toolCall !== "object") return false
  const obj = toolCall as Record<string, any>
  return obj.type === "function" && !!obj.function && typeof obj.function.name === "string"
}

function mapTaskPriority(priority: string | null | undefined): "P1" | "P2" | "P3" | null {
  if (!priority) return null
  const normalized = priority.toUpperCase().trim()
  if (normalized === "P1" || normalized === "P2" || normalized === "P3") return normalized
  return null
}

function shouldForceTeamProgressFallback(message: string): boolean {
  const normalized = message.toLowerCase()
  const looksLikeAction = /(cria|criar|edita|editar|altera|alterar|atualiza|atualizar|manda|enviar|envia|notifica)/i.test(
    normalized
  )
  if (looksLikeAction) return false

  return /(quant|qtd|avalia|avaliac|time|progres|status|tarefa|task|pdi)/i.test(normalized)
}

function buildTeamProgressAnswer(snapshot: LeaderProgressSnapshot): string {
  const { totals } = snapshot
  return [
    `Resumo atual do seu time (${totals.users} pessoas no escopo):`,
    `- Avaliações: ${totals.assessments.completed} concluídas e ${totals.assessments.draft} em andamento/rascunho.`,
    `- Tarefas: ${totals.tasks.total} no total (${totals.tasks.todo} a fazer, ${totals.tasks.in_progress} em progresso, ${totals.tasks.done} concluídas, ${totals.tasks.overdue} atrasadas).`,
    `- PDIs: ${totals.pdis.active} ativos, ${totals.pdis.completed} concluídos, ${totals.pdis.draft} rascunhos, ${totals.pdis.archived} arquivados.`,
    `Se quiser, eu detalho por colaborador ou já preparo uma ação.`,
  ].join("\n")
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function extractQuotedTitle(message: string): string | null {
  const doubleQuoted = message.match(/\"([^\"]+)\"/)
  if (doubleQuoted?.[1]) return doubleQuoted[1].trim()

  const singleQuoted = message.match(/'([^']+)'/)
  if (singleQuoted?.[1]) return singleQuoted[1].trim()

  const named = message.match(/(?:nome|titulo)\s*[:=]?\s*([^\n,]+)$/i)
  if (named?.[1]) return named[1].trim()

  const afterColon = message.match(/:\s*([^\n]+)$/)
  if (afterColon?.[1]) return afterColon[1].trim()

  return null
}

function findTargetUserFromMessage(
  message: string,
  scopedUsers: Awaited<ReturnType<typeof getLeaderScopeUsers>>,
  actorInternalUserId: string
) {
  const normalized = normalizeText(message)

  if (/(pra mim|para mim|p mim|meu)/i.test(normalized)) {
    return scopedUsers.find((user) => user.id === actorInternalUserId) ?? null
  }

  const sortedCandidates = [...scopedUsers].sort((a, b) => b.name.length - a.name.length)
  for (const user of sortedCandidates) {
    const name = normalizeText(user.name)
    const email = normalizeText(user.email || "")

    if (name && normalized.includes(name)) return user
    if (email && normalized.includes(email)) return user

    const firstName = name.split(" ").filter(Boolean)[0]
    if (firstName && firstName.length >= 3 && normalized.includes(firstName)) return user
  }

  return null
}

async function maybeHandleDirectActionIntent(
  params: RunTurnParams,
  scopedUsers: Awaited<ReturnType<typeof getLeaderScopeUsers>>
): Promise<ToolCallResult | null> {
  const normalized = normalizeText(params.message)
  const wantsCreateTask = /(cria|criar).*(tarefa|task)|(tarefa|task).*(cria|criar)/i.test(normalized)
  const wantsUpdateTask = /(edita|editar|altera|alterar|atualiza|atualizar).*(tarefa|task)/i.test(normalized)

  if (wantsUpdateTask) {
    return {
      type: "answer",
      message:
        "Consigo editar tarefa, mas preciso identificar qual tarefa. Me envie o ID da task (ou peça primeiro para eu listar as tarefas do colaborador) e o que deseja alterar.",
      metadata: { parser: "direct_action_intent", intent: "update_task_missing_task_id" },
    }
  }

  if (!wantsCreateTask) return null

  const target = findTargetUserFromMessage(params.message, scopedUsers, params.actorInternalUserId)
  const title = extractQuotedTitle(params.message)

  if (!target) {
    return {
      type: "answer",
      message:
        "Consigo criar a task, mas preciso saber para quem. Informe o nome do colaborador (ou diga 'pra mim').",
      metadata: { parser: "direct_action_intent", intent: "create_task_missing_target" },
    }
  }

  if (!title) {
    return {
      type: "answer",
      message:
        `Consigo criar a task para ${target.name}, mas preciso do título. Exemplo: nome \"Fazer follow-up nos leads\".`,
      metadata: { parser: "direct_action_intent", intent: "create_task_missing_title" },
    }
  }

  const context: ToolExecutionContext = {
    workspaceId: params.workspaceId,
    conversationId: params.conversationId,
    actorAuthUserId: params.actorAuthUserId,
    actorInternalUserId: params.actorInternalUserId,
    scopedUsers,
    client: params.client,
  }

  const payload = {
    targetUserId: target.id,
    title,
    description: null,
    priority: null,
    dueDate: null,
    status: "todo",
  }

  const preview = {
    targetUserName: target.name,
    title,
    dueDate: null,
    priority: null,
    status: "todo",
  }

  const pendingAction = await createPendingAction(context, "create_task", target.id, payload, preview)

  return {
    type: "pending_action",
    message: `Proposta criada para nova tarefa de ${target.name}. Revise e clique em confirmar para executar.`,
    pendingAction,
    metadata: { parser: "direct_action_intent", intent: "create_task" },
  }
}

export async function getLeaderCopilotAgentId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("ai_agents")
    .select("id")
    .eq("name", LEADER_COPILOT_AGENT_NAME)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    console.error("Error resolving Copiloto do Líder agent:", error)
    return null
  }

  return (data as { id: string }).id
}

async function getTeamProgressSnapshot(
  workspaceId: string,
  actorAuthUserId: string,
  scopedUsers: Awaited<ReturnType<typeof getLeaderScopeUsers>>
): Promise<LeaderProgressSnapshot> {
  const admin = createAdminClient()
  const scopedInternalIds = scopedUsers.map((u) => u.id)
  const scopedAuthIds = scopedUsers.map((u) => u.auth_user_id)

  const [{ data: tasks }, { data: pdis }, { data: pdiPlans }, { data: assessments }] = await Promise.all([
    scopedAuthIds.length > 0
      ? admin
          .from("tasks")
          .select("id, user_id, status, due_date")
          .eq("workspace_id", workspaceId)
          .in("user_id", scopedAuthIds)
      : Promise.resolve({ data: [] as any[] }),
    scopedInternalIds.length > 0
      ? admin
          .from("pdis")
          .select("user_id, status")
          .eq("workspace_id", workspaceId)
          .in("user_id", scopedInternalIds)
      : Promise.resolve({ data: [] as any[] }),
    scopedInternalIds.length > 0
      ? admin
          .from("pdi_plans")
          .select("user_id, status")
          .eq("workspace_id", workspaceId)
          .in("user_id", scopedInternalIds)
      : Promise.resolve({ data: [] as any[] }),
    scopedInternalIds.length > 0
      ? admin
          .from("assessments")
          .select("evaluated_user_id, status")
          .eq("workspace_id", workspaceId)
          .in("evaluated_user_id", scopedInternalIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const taskRows = (tasks ?? []) as TaskRow[]
  const pdiRows = [...(pdis ?? []), ...(pdiPlans ?? [])] as PdiRow[]
  const assessmentRows = (assessments ?? []) as AssessmentRow[]

  const authToInternal = new Map(scopedUsers.map((user) => [user.auth_user_id, user.id]))
  const byUser = new Map(
    scopedUsers.map((user) => [
      user.id,
      {
        user_id: user.id,
        user_name: user.name,
        tasks: { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 },
        pdis: { active: 0, completed: 0, draft: 0, archived: 0 },
        assessments: { draft: 0, completed: 0 },
      },
    ])
  )

  for (const task of taskRows) {
    const internalUserId = authToInternal.get(task.user_id)
    if (!internalUserId) continue
    const user = byUser.get(internalUserId)
    if (!user) continue

    user.tasks.total += 1
    if (task.status === "todo") user.tasks.todo += 1
    if (task.status === "in_progress") user.tasks.in_progress += 1
    if (task.status === "done") user.tasks.done += 1

    if (task.due_date && task.status !== "done") {
      const isOverdue = new Date(task.due_date).getTime() < Date.now()
      if (isOverdue) user.tasks.overdue += 1
    }
  }

  for (const pdi of pdiRows) {
    const user = byUser.get(pdi.user_id)
    if (!user) continue

    if (pdi.status === "active") user.pdis.active += 1
    else if (pdi.status === "completed") user.pdis.completed += 1
    else if (pdi.status === "draft") user.pdis.draft += 1
    else user.pdis.archived += 1
  }

  for (const assessment of assessmentRows) {
    if (!assessment.evaluated_user_id) continue
    const user = byUser.get(assessment.evaluated_user_id)
    if (!user) continue

    if (assessment.status === "completed") user.assessments.completed += 1
    else user.assessments.draft += 1
  }

  const byUserArray = Array.from(byUser.values())

  const totals = byUserArray.reduce(
    (acc, item) => {
      acc.tasks.total += item.tasks.total
      acc.tasks.todo += item.tasks.todo
      acc.tasks.in_progress += item.tasks.in_progress
      acc.tasks.done += item.tasks.done
      acc.tasks.overdue += item.tasks.overdue

      acc.pdis.active += item.pdis.active
      acc.pdis.completed += item.pdis.completed
      acc.pdis.draft += item.pdis.draft
      acc.pdis.archived += item.pdis.archived

      acc.assessments.draft += item.assessments.draft
      acc.assessments.completed += item.assessments.completed

      return acc
    },
    {
      users: byUserArray.length,
      tasks: { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 },
      pdis: { active: 0, completed: 0, draft: 0, archived: 0 },
      assessments: { draft: 0, completed: 0 },
    }
  )

  return { totals, by_user: byUserArray }
}

async function getMemberStatus(
  workspaceId: string,
  actorAuthUserId: string,
  targetUserId: string,
  scopedUsers: Awaited<ReturnType<typeof getLeaderScopeUsers>>
) {
  const admin = createAdminClient()
  const allowed = await assertTargetInLeaderScope(workspaceId, actorAuthUserId, targetUserId)

  if (!allowed) {
    throw new Error("Usuário fora do escopo permitido")
  }

  const target = scopedUsers.find((user) => user.id === targetUserId)
  if (!target) {
    throw new Error("Usuário não encontrado no escopo")
  }

  const [{ data: tasks }, { data: pdis }, { data: pdiPlans }, { data: assessments }] = await Promise.all([
    admin
      .from("tasks")
      .select("id, title, status, priority, due_date, created_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", target.auth_user_id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("pdis")
      .select("id, status, start_date, end_date, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId)
      .order("updated_at", { ascending: false })
      .limit(10),
    admin
      .from("pdi_plans")
      .select("id, status, created_at, target_completion_date")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("assessments")
      .select("id, test_type, status, created_at, completed_at")
      .eq("workspace_id", workspaceId)
      .eq("evaluated_user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return {
    member: {
      id: target.id,
      name: target.name,
      email: target.email,
      jobTitle: target.job_title,
    },
    tasks: tasks ?? [],
    pdis: [...(pdis ?? []), ...(pdiPlans ?? [])],
    assessments: assessments ?? [],
  }
}

async function createPendingAction(
  context: ToolExecutionContext,
  actionType: LeaderCopilotActionType,
  targetUserId: string,
  payload: Record<string, any>,
  preview: Record<string, any>
) {
  const allowed = await assertTargetInLeaderScope(
    context.workspaceId,
    context.actorAuthUserId,
    targetUserId,
    context.client
  )

  if (!allowed) {
    throw new Error("Usuário alvo fora do escopo do líder")
  }

  const { data, error } = await context.client
    .from("ai_pending_actions")
    .insert({
      workspace_id: context.workspaceId,
      conversation_id: context.conversationId,
      actor_user_id: context.actorInternalUserId,
      target_user_id: targetUserId,
      action_type: actionType,
      payload,
      status: "pending",
    } as any)
    .select("id")
    .single()

  if (error || !data) {
    throw new Error("Falha ao criar ação pendente")
  }

  await writeAuditLog({
    actorUserId: context.actorInternalUserId,
    action: "leader_copilot_action_proposed",
    entityType: "ai_pending_actions",
    entityId: (data as { id: string }).id,
    workspaceId: context.workspaceId,
    metadata: {
      target_user_id: targetUserId,
      action_type: actionType,
      preview,
      result_status: "pending",
    },
  })

  return {
    id: (data as { id: string }).id,
    actionType,
    preview,
  }
}

function buildTools() {
  return [
    {
      type: "function" as const,
      function: {
        name: "get_team_progress",
        description: "Retorna visão consolidada de progresso do time no workspace atual.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_member_status",
        description: "Retorna status detalhado de um membro específico do time.",
        parameters: {
          type: "object",
          properties: {
            targetUserId: { type: "string", description: "ID interno do usuário alvo" },
          },
          required: ["targetUserId"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "create_task_proposal",
        description: "Propõe criação de tarefa para um membro. Nunca executa imediatamente.",
        parameters: {
          type: "object",
          properties: {
            targetUserId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: ["P1", "P2", "P3"] },
            dueDate: { type: "string", description: "Data ISO" },
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
          },
          required: ["targetUserId", "title"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "update_task_proposal",
        description: "Propõe alteração de tarefa existente de um membro. Nunca executa imediatamente.",
        parameters: {
          type: "object",
          properties: {
            targetUserId: { type: "string" },
            taskId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: ["P1", "P2", "P3"] },
            dueDate: { type: "string", description: "Data ISO" },
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
          },
          required: ["targetUserId", "taskId"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "send_notification_proposal",
        description: "Propõe envio de notificação in-app para um membro. Nunca executa imediatamente.",
        parameters: {
          type: "object",
          properties: {
            targetUserId: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            type: { type: "string", enum: ["info", "warning", "error", "success"] },
          },
          required: ["targetUserId", "title", "message"],
          additionalProperties: false,
        },
      },
    },
  ]
}

async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<{ output: Record<string, any>; pendingAction?: ToolCallResult["pendingAction"] }> {
  if (toolName === "get_team_progress") {
    const snapshot = await getTeamProgressSnapshot(context.workspaceId, context.actorAuthUserId, context.scopedUsers)
    return { output: { snapshot } }
  }

  if (toolName === "get_member_status") {
    const status = await getMemberStatus(
      context.workspaceId,
      context.actorAuthUserId,
      String(args.targetUserId || ""),
      context.scopedUsers
    )
    return { output: { status } }
  }

  if (toolName === "create_task_proposal") {
    const targetUserId = String(args.targetUserId || "")
    const target = context.scopedUsers.find((user) => user.id === targetUserId)
    if (!target) throw new Error("Usuário alvo inválido")

    const payload = {
      targetUserId,
      title: String(args.title || ""),
      description: args.description ? String(args.description) : null,
      priority: mapTaskPriority(args.priority),
      dueDate: args.dueDate ? String(args.dueDate) : null,
      status: args.status ? String(args.status) : "todo",
    }

    const preview = {
      targetUserName: target.name,
      title: payload.title,
      dueDate: payload.dueDate,
      priority: payload.priority,
      status: payload.status,
    }

    const pendingAction = await createPendingAction(context, "create_task", targetUserId, payload, preview)
    return {
      output: {
        pendingAction,
        userMessage: `Proposta criada para nova tarefa de ${target.name}. Clique em confirmar para executar.`,
      },
      pendingAction,
    }
  }

  if (toolName === "update_task_proposal") {
    const targetUserId = String(args.targetUserId || "")
    const target = context.scopedUsers.find((user) => user.id === targetUserId)
    if (!target) throw new Error("Usuário alvo inválido")

    const payload = {
      targetUserId,
      taskId: String(args.taskId || ""),
      title: args.title ? String(args.title) : null,
      description: args.description ? String(args.description) : null,
      priority: mapTaskPriority(args.priority),
      dueDate: args.dueDate ? String(args.dueDate) : null,
      status: args.status ? String(args.status) : null,
    }

    const preview = {
      targetUserName: target.name,
      taskId: payload.taskId,
      title: payload.title,
      dueDate: payload.dueDate,
      priority: payload.priority,
      status: payload.status,
    }

    const pendingAction = await createPendingAction(context, "update_task", targetUserId, payload, preview)
    return {
      output: {
        pendingAction,
        userMessage: `Proposta criada para atualização de tarefa de ${target.name}. Clique em confirmar para executar.`,
      },
      pendingAction,
    }
  }

  if (toolName === "send_notification_proposal") {
    const targetUserId = String(args.targetUserId || "")
    const target = context.scopedUsers.find((user) => user.id === targetUserId)
    if (!target) throw new Error("Usuário alvo inválido")

    const payload = {
      targetUserId,
      title: String(args.title || ""),
      message: String(args.message || ""),
      type: args.type ? String(args.type) : "info",
    }

    const preview = {
      targetUserName: target.name,
      title: payload.title,
      type: payload.type,
      message: payload.message,
    }

    const pendingAction = await createPendingAction(context, "send_notification", targetUserId, payload, preview)
    return {
      output: {
        pendingAction,
        userMessage: `Proposta criada para notificar ${target.name}. Clique em confirmar para executar.`,
      },
      pendingAction,
    }
  }

  return { output: { info: "Tool não suportada" } }
}

export async function runLeaderCopilotTurn(params: RunTurnParams): Promise<ToolCallResult> {
  const openAiKey = process.env.OPENAI_API_KEY
  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY ausente no servidor")
  }

  const featureEnabled = await isLeaderCopilotEnabled(params.workspaceId, params.client)
  if (!featureEnabled) {
    throw new Error("Copiloto do líder desativado para este workspace")
  }

  const scopedUsers = await getLeaderScopeUsers(params.workspaceId, params.actorAuthUserId, params.client)
  if (scopedUsers.length === 0) {
    throw new Error("Usuário sem escopo de liderados para o Copiloto")
  }

  const directActionResult = await maybeHandleDirectActionIntent(params, scopedUsers)
  if (directActionResult) {
    return directActionResult
  }

  const openai = new OpenAI({ apiKey: openAiKey })

  const contextPrompt = [
    `workspace: ${params.workspaceId}`,
    `leader_internal_user_id: ${params.actorInternalUserId}`,
    `date_time_iso: ${nowIso()}`,
    `feature_flags: { leader_copilot_enabled: ${featureEnabled ? "true" : "false"} }`,
    "policy_summary: somente usuários em allowed_users e sempre com proposta+confirmação para escrita",
    `allowed_users: ${JSON.stringify(
      scopedUsers.map((u) => ({ id: u.id, name: u.name, job_title: u.job_title, email: u.email }))
    )}`,
  ].join("\n")

  const baseMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n## CONTEXTO\n${contextPrompt}` },
    { role: "user", content: params.message },
  ]

  const firstCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: baseMessages,
    tools: buildTools(),
    tool_choice: "auto",
  })

  const firstMessage = firstCompletion.choices[0]?.message
  const toolCalls = firstMessage?.tool_calls ?? []
  const functionToolCalls = toolCalls.filter(isFunctionToolCall)

  if (functionToolCalls.length === 0) {
    if (shouldForceTeamProgressFallback(params.message)) {
      const snapshot = await getTeamProgressSnapshot(params.workspaceId, params.actorAuthUserId, scopedUsers)
      return {
        type: "answer",
        message: buildTeamProgressAnswer(snapshot),
        metadata: {
          model: "fallback-team-progress",
          forced_tool: "get_team_progress",
        },
      }
    }

    return {
      type: "answer",
      message: firstMessage?.content?.trim() || "Não consegui gerar uma resposta agora.",
      metadata: {
        model: "gpt-4o-mini",
      },
    }
  }

  const context: ToolExecutionContext = {
    workspaceId: params.workspaceId,
    conversationId: params.conversationId,
    actorAuthUserId: params.actorAuthUserId,
    actorInternalUserId: params.actorInternalUserId,
    scopedUsers,
    client: params.client,
  }

  const toolMessages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "assistant",
      content: firstMessage?.content ?? "",
      tool_calls: functionToolCalls,
    },
  ]

  let pendingAction: ToolCallResult["pendingAction"] | undefined

  for (const toolCall of functionToolCalls) {
    const args = safeJsonParse(toolCall.function.arguments || "{}")
    const result = await executeToolCall(toolCall.function.name, args, context)

    if (result.pendingAction) {
      pendingAction = result.pendingAction
    }

    toolMessages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result.output),
    })
  }

  if (pendingAction) {
    return {
      type: "pending_action",
      message: "Ação proposta criada. Revise e clique em confirmar para executar.",
      pendingAction,
      metadata: {
        model: "gpt-4o-mini",
        tool_calls: functionToolCalls.map((call) => call.function.name),
      },
    }
  }

  const secondCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [...baseMessages, ...toolMessages],
  })

  return {
    type: "answer",
    message:
      secondCompletion.choices[0]?.message?.content?.trim() ||
      "Consegui consultar os dados, mas não consegui formatar uma resposta.",
    metadata: {
      model: "gpt-4o-mini",
      tool_calls: functionToolCalls.map((call) => call.function.name),
    },
  }
}

export async function executePendingAction(params: ExecutePendingParams): Promise<{ entity: string; id: string }> {
  const client = await createClient()
  const actorInternalUserId = await getInternalUserId(params.actorAuthUserId, client)

  if (!actorInternalUserId) {
    throw new Error("Usuário interno não encontrado")
  }

  const { data: pendingRaw, error: pendingError } = await client
    .from("ai_pending_actions")
    .select("*")
    .eq("id", params.pendingActionId)
    .maybeSingle()

  if (pendingError || !pendingRaw) {
    throw new Error("Ação pendente não encontrada")
  }

  const pending = pendingRaw as PendingAction

  if (pending.workspace_id !== params.workspaceId || pending.conversation_id !== params.conversationId) {
    throw new Error("Ação pendente inválida para este contexto")
  }

  if (pending.actor_user_id !== actorInternalUserId) {
    throw new Error("Ação pendente não pertence ao usuário autenticado")
  }

  if (pending.status !== "pending") {
    throw new Error("Esta ação já foi processada")
  }

  const targetAllowed = await assertTargetInLeaderScope(
    params.workspaceId,
    params.actorAuthUserId,
    pending.target_user_id,
    client
  )

  if (!targetAllowed) {
    throw new Error("Usuário alvo fora do escopo permitido")
  }

  let result: { entity: string; id: string }

  if (pending.action_type === "create_task") {
    const payload = pending.payload || {}
    const { data, error } = await client.rpc("leader_copilot_create_task", {
      workspace_id_param: params.workspaceId,
      target_user_id_param: pending.target_user_id,
      title_param: String(payload.title || ""),
      description_param: payload.description ? String(payload.description) : null,
      priority_param: payload.priority ? String(payload.priority) : null,
      due_date_param: payload.dueDate ? String(payload.dueDate) : null,
      status_param: payload.status ? String(payload.status) : "todo",
    })

    if (error || !data) {
      throw new Error("Falha ao criar tarefa")
    }

    result = { entity: "task", id: String(data) }
  } else if (pending.action_type === "update_task") {
    const payload = pending.payload || {}
    const { data, error } = await client.rpc("leader_copilot_update_task", {
      workspace_id_param: params.workspaceId,
      target_user_id_param: pending.target_user_id,
      task_id_param: String(payload.taskId || ""),
      title_param: payload.title ? String(payload.title) : null,
      description_param: payload.description ? String(payload.description) : null,
      priority_param: payload.priority ? String(payload.priority) : null,
      due_date_param: payload.dueDate ? String(payload.dueDate) : null,
      status_param: payload.status ? String(payload.status) : null,
    })

    if (error || !data) {
      throw new Error("Falha ao atualizar tarefa")
    }

    result = { entity: "task", id: String(data) }
  } else if (pending.action_type === "send_notification") {
    const payload = pending.payload || {}
    const { data, error } = await client.rpc("leader_copilot_send_notification", {
      workspace_id_param: params.workspaceId,
      target_user_id_param: pending.target_user_id,
      title_param: String(payload.title || ""),
      message_param: String(payload.message || ""),
      type_param: payload.type ? String(payload.type) : "info",
    })

    if (error || !data) {
      throw new Error("Falha ao enviar notificação")
    }

    result = { entity: "workspace_user_notification", id: String(data) }
  } else {
    throw new Error("Tipo de ação pendente não suportada")
  }

  const executedAt = nowIso()

  const { error: updateError } = await client
    .from("ai_pending_actions")
    .update({
      status: "executed",
      confirmed_at: executedAt,
      executed_at: executedAt,
      executed_result: result,
    } as any)
    .eq("id", pending.id)

  if (updateError) {
    throw new Error("Falha ao marcar ação como executada")
  }

  await writeAuditLog({
    actorUserId: actorInternalUserId,
    action: "leader_copilot_action_executed",
    entityType: "ai_pending_actions",
    entityId: pending.id,
    workspaceId: params.workspaceId,
    metadata: {
      target_user_id: pending.target_user_id,
      action_type: pending.action_type,
      pending_action_id: pending.id,
      result_status: "executed",
      execution_result: result,
    },
  })

  return result
}
