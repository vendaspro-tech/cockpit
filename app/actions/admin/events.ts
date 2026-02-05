'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth-server"

type EventPlanJoin = {
  plan_id: string
  plans?: { id: string; name: string; color: string | null } | null
}

type EventRow = {
  event_plans?: EventPlanJoin[] | null
  event_categories?: { name: string | null; color: string | null } | null
  event_instructors?: { name: string | null } | null
  category?: string | null
  instructor_name?: string | null
} & Record<string, unknown>

const normalizeEvent = (event: EventRow) => ({
  ...event,
  plan_ids: (event.event_plans || []).map((p) => p.plan_id),
  plans: (event.event_plans || [])
    .map((p) => p.plans)
    .filter(Boolean),
  category: event.event_categories?.name || event.category,
  category_color: event.event_categories?.color,
  instructor_name: event.event_instructors?.name || event.instructor_name
})

const EventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  start_time: z.string(), // ISO string
  end_time: z.string(), // ISO string
  plan_ids: z.array(z.string().uuid("Plano inválido")).min(1, "Selecione ao menos um plano"),
  target_profiles: z.array(z.string()).default([]),
  category_id: z.string().uuid().optional(),
  instructor_id: z.string().uuid().optional(),
  location_url: z.string().url().optional().or(z.literal("")).optional(),
  recurrence_frequency: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  recurrence_until: z.string().nullable().optional(),
  template_id: z.string().uuid().optional()
})

export async function getEventTemplates() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_templates')
    .select('id, name, title, description, plan_id, target_profiles, category, instructor_name, location_url, duration_minutes, recurrence_frequency')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching event templates:', error)
    return []
  }

  return data
}

export async function getEventCategories() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_categories')
    .select('id, name, color')
    .order('name')

  if (error) {
    console.error('Error fetching event categories:', error)
    return []
  }

  return data
}

export async function getEventInstructors() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_instructors')
    .select('id, name, title, email')
    .order('name')

  if (error) {
    console.error('Error fetching event instructors:', error)
    return []
  }

  return data
}

export async function getEvents() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_plans (
        plan_id,
        plans (
          id,
          name,
          color
        )
      ),
      event_categories: event_categories!events_category_id_fkey (id, name, color),
      event_instructors: event_instructors!events_instructor_id_fkey (id, name, email, title)
    `)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  const eventRows = (data ?? []) as EventRow[]
  return eventRows.map(normalizeEvent)
}

export async function createEvent(data: z.infer<typeof EventSchema>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = EventSchema.safeParse({
    ...data,
    location_url: data.location_url || undefined,
    recurrence_until: data.recurrence_until || null
  })
  if (!validated.success) {
    return { error: 'Dados inválidos' }
  }

  const supabase = createAdminClient()

  const { data: insertedEvent, error } = await supabase
    .from('events')
    .insert({
      ...validated.data,
      plan_id: validated.data.plan_ids[0], // manter compatibilidade legada
      created_by: user.id
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return { error: 'Erro ao criar evento' }
  }

  // vincula planos
  const planRows = validated.data.plan_ids.map(planId => ({
    event_id: insertedEvent.id,
    plan_id: planId
  }))
  const { error: planError } = await supabase
    .from('event_plans')
    .insert(planRows)
  if (planError) {
    console.error('Error linking event plans:', planError)
  }

  const event = await fetchEventById(insertedEvent.id)
  return { success: true, event }
}

export async function updateEvent(eventId: string, data: Partial<z.infer<typeof EventSchema>>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const planIds = data.plan_ids && data.plan_ids.length > 0 ? data.plan_ids : undefined

  const { error } = await supabase
    .from('events')
    .update({
      ...data,
      plan_id: planIds ? planIds[0] : undefined
    })
    .eq('id', eventId)
    .select('id')
    .single()

  if (error) {
    console.error('Error updating event:', error)
    return { error: 'Erro ao atualizar evento' }
  }

  if (planIds) {
    const { error: delError } = await supabase
      .from('event_plans')
      .delete()
      .eq('event_id', eventId)
    if (delError) {
      console.error('Error cleaning event plans:', delError)
    }
    const planRows = planIds.map(planId => ({ event_id: eventId, plan_id: planId }))
    const { error: insError } = await supabase
      .from('event_plans')
      .insert(planRows)
    if (insError) {
      console.error('Error linking event plans:', insError)
    }
  }

  const event = await fetchEventById(eventId)
  return { success: true, event }
}

export async function deleteEvent(eventId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    return { error: 'Erro ao excluir evento' }
  }

  return { success: true }
}

export async function createEventTemplate(input: {
  name: string
  title: string
  description?: string
  plan_id?: string
  target_profiles?: string[]
  category?: string
  instructor_name?: string
  location_url?: string
  duration_minutes?: number
  recurrence_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
}) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_templates')
    .insert({
      ...input,
      target_profiles: input.target_profiles || [],
      recurrence_frequency: input.recurrence_frequency || 'none',
      created_by: user.id
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating event template:', error)
    return { error: 'Erro ao criar template' }
  }

  return { success: true, id: data?.id }
}

export async function createEventCategory(input: { name: string, color?: string }) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_categories')
    .insert({ name: input.name, color: input.color || '#3b82f6' })
    .select('id, name, color')
    .single()

  if (error) {
    console.error('Error creating event category:', error)
    return { error: 'Erro ao criar categoria' }
  }

  return { success: true, category: data }
}

export async function deleteEventCategory(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('event_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting event category:', error)
    return { error: 'Erro ao excluir categoria' }
  }

  return { success: true }
}

export async function createEventInstructor(input: { name: string, title?: string, email?: string }) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_instructors')
    .insert({ name: input.name, title: input.title, email: input.email })
    .select('id, name, title, email')
    .single()

  if (error) {
    console.error('Error creating event instructor:', error)
    return { error: 'Erro ao criar instrutor' }
  }

  return { success: true, instructor: data }
}

export async function deleteEventInstructor(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('event_instructors')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting event instructor:', error)
    return { error: 'Erro ao excluir instrutor' }
  }

  return { success: true }
}

async function fetchEventById(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_plans (
        plan_id,
        plans (
          id,
          name,
          color
        )
      ),
      event_categories: event_categories!events_category_id_fkey (id, name, color),
      event_instructors: event_instructors!events_instructor_id_fkey (id, name, email, title)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Error fetching event by id:', error)
    return null
  }

  return normalizeEvent(data as EventRow)
}
