'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Update existing PDI action
 */
export async function updatePDIAction(
  actionId: string, 
  description: string, 
  deadlineDays?: number,
  priority?: 'P1' | 'P2' | 'P3'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pdi_actions')
    .update({
      action_description: description,
      deadline_days: deadlineDays,
      priority: priority
    })
    .eq('id', actionId)

  if (error) {
    return { error: 'Erro ao atualizar ação' }
  }

  revalidatePath('/pdi')
  return { success: true }
}
