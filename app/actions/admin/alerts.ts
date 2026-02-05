'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const AlertSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  type: z.enum(['info', 'warning', 'error', 'success']),
  target_role: z.string().default('all'),
  start_date: z.string(), // ISO string
  end_date: z.string(),   // ISO string
  is_active: z.boolean().default(true)
})

export async function getSystemAlerts() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return data
}

export async function createSystemAlert(data: z.infer<typeof AlertSchema>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = AlertSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Dados inválidos' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('system_alerts')
    .insert(validated.data)

  if (error) {
    console.error('Error creating alert:', error)
    return { error: 'Erro ao criar alerta' }
  }

  revalidatePath(`/admin/alerts`)
  return { success: true }
}

export async function updateSystemAlert(id: string, data: Partial<z.infer<typeof AlertSchema>>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('system_alerts')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating alert:', error)
    return { error: 'Erro ao atualizar alerta' }
  }

  revalidatePath(`/admin/alerts`)
  return { success: true }
}

export async function deleteSystemAlert(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('system_alerts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting alert:', error)
    return { error: 'Erro ao excluir alerta' }
  }

  revalidatePath(`/admin/alerts`)
  return { success: true }
}

export async function toggleAlertStatus(id: string, is_active: boolean) {
  return updateSystemAlert(id, { is_active })
}
