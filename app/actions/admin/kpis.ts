'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const KpiSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  benchmark: z.string().min(1, "Benchmark é obrigatório"),
  formula: z.string().min(1, "Fórmula é obrigatória"),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true)
})

export async function getKpis() {
  const user = await getAuthUser()
  if (!user) return []

  // Allow read for authenticated users (or restrict to admin if needed, but usually KPIs are visible)
  // For admin dashboard, we definitely need to fetch them.
  // The RLS allows authenticated users to see active KPIs.
  // But for the admin table, we want to see ALL KPIs (active and inactive).
  // So we should check if system owner.

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('kpis')
    .select('*')
    .order('category', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching KPIs:', error)
    return []
  }

  return data
}

export async function createKpi(data: z.infer<typeof KpiSchema>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = KpiSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Dados inválidos' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('kpis')
    .insert(validated.data)

  if (error) {
    console.error('Error creating KPI:', error)
    return { error: 'Erro ao criar KPI' }
  }

  revalidatePath(`/admin/kpis`)
  return { success: true }
}

export async function updateKpi(kpiId: string, data: Partial<z.infer<typeof KpiSchema>>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('kpis')
    .update(data)
    .eq('id', kpiId)

  if (error) {
    console.error('Error updating KPI:', error)
    return { error: 'Erro ao atualizar KPI' }
  }

  revalidatePath(`/admin/kpis`)
  return { success: true }
}

export async function deleteKpi(kpiId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('kpis')
    .delete()
    .eq('id', kpiId)

  if (error) {
    console.error('Error deleting KPI:', error)
    return { error: 'Erro ao excluir KPI' }
  }

  revalidatePath(`/admin/kpis`)
  return { success: true }
}

export async function toggleKpiStatus(kpiId: string, is_active: boolean) {
  return updateKpi(kpiId, { is_active })
}
