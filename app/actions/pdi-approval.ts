'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'

/**
 * Approve a PDI plan (manager only)
 */
export async function approvePDI(pdiId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  const authUser = await getAuthUser()

  console.log('[approvePDI] Attempting to approve PDI:', pdiId, 'User:', authUser?.id)

  if (!authUser) {
    return { error: 'Não autenticado' }
  }

  try {
    // Get current user ID from our DB
    // We can use admin client here too for consistency
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', authUser.id)
      .single()

    if (userError || !userRecord) {
      console.error('[approvePDI] User not found:', userError)
      return { error: 'Usuário não encontrado' }
    }

    // Update PDI with approval
    const { error } = await supabase
      .from('pdi_plans')
      .update({
        status: 'active',
        approved_by: userRecord.id,
        approved_at: new Date().toISOString(),
        start_date: new Date().toISOString()
      })
      .eq('id', pdiId)

    if (error) {
      console.error('[approvePDI] Error updating PDI:', error)
      return { error: 'Erro ao aprovar PDI' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    console.error('[approvePDI] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao aprovar PDI'
    return { error: message }
  }
}

/**
 * Calculate PDI progress percentage
 */
export async function getPDIProgress(pdiId: string) {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('pdi_items')
    .select('id, status')
    .eq('pdi_plan_id', pdiId)

  if (!items || items.length === 0) {
    return { progress: 0, completed: 0, total: 0 }
  }

  type PdiItemRow = { id: string; status: 'not_started' | 'in_progress' | 'completed' }
  const itemRows = (items ?? []) as PdiItemRow[]
  const completed = itemRows.filter((item) => item.status === 'completed').length
  const total = itemRows.length
  const progress = Math.round((completed / total) * 100)

  return { progress, completed, total }
}

/**
 * Get all assessments available for PDI creation in workspace
 * Shows all completed assessments without PDI, regardless of who is viewing
 */
export async function getUserAssessmentsForPDI(userId: string, workspaceId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  console.log('[getUserAssessmentsForPDI] Starting query with:', { userId, workspaceId })

  // First, try to get ALL assessments to see if there are any
  const { data: allAssessments, error: allError } = await supabase
    .from('assessments')
    .select('id, test_type, status, workspace_id')
    .eq('workspace_id', workspaceId)

  console.log('[getUserAssessmentsForPDI] All assessments in workspace:', allAssessments?.length, allAssessments)
  if (allError) {
    console.error('[getUserAssessmentsForPDI] Error fetching all assessments:', JSON.stringify(allError, null, 2))
  }

  // Now get completed ones with full data
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      id,
      test_type,
      assessment_mode,
      status,
      started_at,
      completed_at,
      pdi_id,
      evaluated_user:users!evaluated_user_id(full_name, email),
      evaluator_user:users!evaluator_user_id(full_name)
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('[getUserAssessmentsForPDI] Error fetching completed assessments:', JSON.stringify(error, null, 2))
    return []
  }

  console.log('[getUserAssessmentsForPDI] Completed assessments:', data?.length)
  console.log('[getUserAssessmentsForPDI] Assessments data:', JSON.stringify(data, null, 2))

  return data || []
}
