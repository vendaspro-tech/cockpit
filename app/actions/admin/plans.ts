'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  max_users: z.number().nullable(),
  price_monthly: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  color: z.string().default("#3b82f6"),
  features: z.record(z.string(), z.boolean()).default({}),
  active: z.boolean().default(true)
})

export async function getPlans() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly', { ascending: true })

  if (error) {
    console.error('Error fetching plans:', error)
    return []
  }

  return data
}

export async function createPlan(data: z.infer<typeof PlanSchema>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = PlanSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Dados inválidos' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('plans')
    .insert(validated.data)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe um plano com esse nome.' }
    }
    console.error('Error creating plan:', error)
    return { error: 'Erro ao criar plano' }
  }

  revalidatePath(`/admin/plans`)
  return { success: true }
}

export async function updatePlan(planId: string, data: Partial<z.infer<typeof PlanSchema>>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('plans')
    .update(data)
    .eq('id', planId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe um plano com esse nome.' }
    }
    console.error('Error updating plan:', error)
    return { error: 'Erro ao atualizar plano' }
  }

  revalidatePath(`/admin/plans`)
  return { success: true }
}

export async function duplicatePlan(planId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // 1. Fetch original plan
  const { data: original, error: fetchError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (fetchError || !original) {
    return { error: 'Plano original não encontrado' }
  }

  // 2. Create copy
  const { id: _id, created_at: _created_at, ...rest } = original
  const newPlan = {
    ...rest,
    name: `${original.name} (Cópia)`,
    active: false // Start as inactive
  }

  const { error: insertError } = await supabase
    .from('plans')
    .insert(newPlan)

  if (insertError) {
    console.error('Error duplicating plan:', insertError)
    return { error: 'Erro ao duplicar plano' }
  }

  revalidatePath(`/admin/plans`)
  return { success: true }
}

export async function togglePlanStatus(planId: string, active: boolean) {
  return updatePlan(planId, { active })
}
