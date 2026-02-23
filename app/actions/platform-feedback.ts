'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getAuthUser } from '@/lib/auth-server'
import { isSystemOwner } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const FEEDBACK_COOLDOWN_DAYS = 30
const DISMISS_COOLDOWN_DAYS = 7

const SubmitPlatformFeedbackSchema = z.object({
  experience_score: z.number().int().min(0).max(10),
  recommendation_score: z.number().int().min(0).max(10),
  notes: z.string().optional().nullable(),
})

const AdminFeedbackFiltersSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  minScore: z.number().int().min(0).max(10).optional(),
  maxScore: z.number().int().min(0).max(10).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type PlatformFeedbackPromptState = {
  shouldShow: boolean
  nextEligibleAt?: string | null
}

export type PlatformFeedbackAdminRow = {
  id: string
  experience_score: number
  recommendation_score: number
  notes: string | null
  created_at: string
  user: {
    id: string
    email: string
    full_name: string | null
  } | null
}

export type PlatformFeedbackAdminListResult = {
  items: PlatformFeedbackAdminRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function getCurrentInternalUserId(): Promise<string | null> {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const supabase = await createClient()

  const { data: internalUser } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', authUser.id)
    .maybeSingle()

  return internalUser?.id ?? null
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export async function getPlatformFeedbackPromptState(): Promise<PlatformFeedbackPromptState> {
  const internalUserId = await getCurrentInternalUserId()
  if (!internalUserId) {
    return { shouldShow: false, nextEligibleAt: null }
  }

  const supabase = await createClient()

  const [{ data: latestResponse }, { data: promptState }] = await Promise.all([
    supabase
      .from('platform_feedback_responses')
      .select('created_at')
      .eq('user_id', internalUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('platform_feedback_prompt_state')
      .select('last_dismissed_at')
      .eq('user_id', internalUserId)
      .maybeSingle(),
  ])

  const now = new Date()

  if (latestResponse?.created_at) {
    const nextEligible = addDays(new Date(latestResponse.created_at), FEEDBACK_COOLDOWN_DAYS)
    if (nextEligible > now) {
      return { shouldShow: false, nextEligibleAt: nextEligible.toISOString() }
    }
  }

  if (promptState?.last_dismissed_at) {
    const nextEligible = addDays(new Date(promptState.last_dismissed_at), DISMISS_COOLDOWN_DAYS)
    if (nextEligible > now) {
      return { shouldShow: false, nextEligibleAt: nextEligible.toISOString() }
    }
  }

  return { shouldShow: true, nextEligibleAt: null }
}

export async function submitPlatformFeedback(
  input: { experience_score: number; recommendation_score: number; notes?: string | null },
  revalidatePathname: string
) {
  const parsed = SubmitPlatformFeedbackSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Dados inválidos para enviar feedback.' }
  }

  const internalUserId = await getCurrentInternalUserId()
  if (!internalUserId) {
    return { error: 'Não autorizado' }
  }

  const supabase = await createClient()
  const notes = parsed.data.notes?.trim() || null

  const { error: insertError } = await supabase
    .from('platform_feedback_responses')
    .insert({
      user_id: internalUserId,
      experience_score: parsed.data.experience_score,
      recommendation_score: parsed.data.recommendation_score,
      notes,
    })

  if (insertError) {
    console.error('Error inserting platform feedback response:', insertError)
    return { error: 'Não foi possível salvar seu feedback agora.' }
  }

  const { error: stateError } = await supabase
    .from('platform_feedback_prompt_state')
    .upsert(
      {
        user_id: internalUserId,
        last_dismissed_at: null,
      },
      { onConflict: 'user_id' }
    )

  if (stateError) {
    console.error('Error clearing platform feedback prompt state:', stateError)
    return { error: 'Feedback salvo, mas falha ao atualizar o estado do popup.' }
  }

  if (revalidatePathname) {
    revalidatePath(revalidatePathname)
  }

  return { success: true }
}

export async function dismissPlatformFeedback() {
  const internalUserId = await getCurrentInternalUserId()
  if (!internalUserId) {
    return { error: 'Não autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('platform_feedback_prompt_state')
    .upsert(
      {
        user_id: internalUserId,
        last_dismissed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Error dismissing platform feedback dialog:', error)
    return { error: 'Não foi possível atualizar o lembrete agora.' }
  }

  return { success: true }
}

export async function getAdminPlatformFeedbackList(params: {
  from?: string
  to?: string
  minScore?: number
  maxScore?: number
  page?: number
  pageSize?: number
}): Promise<PlatformFeedbackAdminListResult> {
  const authUser = await getAuthUser()
  if (!authUser) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const owner = await isSystemOwner(authUser.id)
  if (!owner) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const parsed = AdminFeedbackFiltersSchema.safeParse({
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  })

  if (!parsed.success) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const { from, to, minScore, maxScore, page, pageSize } = parsed.data
  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1

  const supabase = createAdminClient()

  let baseQuery = supabase
    .from('platform_feedback_responses')
    .select('id, user_id, experience_score, recommendation_score, notes, created_at', { count: 'exact' })

  if (from) {
    baseQuery = baseQuery.gte('created_at', from)
  }
  if (to) {
    baseQuery = baseQuery.lte('created_at', to)
  }
  if (typeof minScore === 'number') {
    baseQuery = baseQuery.gte('recommendation_score', minScore)
  }
  if (typeof maxScore === 'number') {
    baseQuery = baseQuery.lte('recommendation_score', maxScore)
  }

  const { data, count, error } = await baseQuery
    .order('created_at', { ascending: false })
    .range(fromIdx, toIdx)

  if (error) {
    console.error('Error fetching platform feedback responses:', error)
    return { items: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const rows = (data ?? []) as Array<{
    id: string
    user_id: string
    experience_score: number
    recommendation_score: number
    notes: string | null
    created_at: string
  }>

  const userIds = Array.from(new Set(rows.map((row) => row.user_id)))
  let usersMap = new Map<string, { id: string; email: string; full_name: string | null }>()

  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)

    usersMap = new Map((usersData ?? []).map((u) => [u.id, u]))
  }

  const items: PlatformFeedbackAdminRow[] = rows.map((row) => ({
    id: row.id,
    experience_score: row.experience_score,
    recommendation_score: row.recommendation_score,
    notes: row.notes,
    created_at: row.created_at,
    user: usersMap.get(row.user_id) ?? null,
  }))

  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}
