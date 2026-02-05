'use server'

import { revalidatePath } from 'next/cache'

/**
 * Delete PDI plan and all related items
 */
export async function deletePDIPlan(pdiId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  // Delete PDI (cascade will delete items, actions, and evidence)
  const { error } = await supabase
    .from('pdi_plans')
    .delete()
    .eq('id', pdiId)

  if (error) {
    console.error('Error deleting PDI:', JSON.stringify(error, null, 2))
    return { error: 'Erro ao deletar PDI' }
  }

  revalidatePath('/pdi')
  return { success: true }
}
