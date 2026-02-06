'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { type PDIItem, type PDIPriority } from "@/lib/types/pdi"
import { getAuthUser } from "@/lib/auth-server"

/**
 * Generate PDI based on assessment results
 * Creates PDI items for questions with score <= 1 (auto-trigger rule)
 */
export async function generatePDI(assessmentId: string, workspaceId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  const user = await getAuthUser()
  if (!user) return { error: 'Não autenticado' }

  try {
    type AssessmentResponse = { question_id: string; score: number | null }
    type AssessmentRow = {
      id: string
      assessment_mode: 'self' | 'manager'
      test_type: string
      evaluated_user_id: string
      responses: AssessmentResponse[]
    }
    type TestStructure = {
      categories?: Array<{
        id: string
        name: string
        questions?: Array<{ id: string; text?: string; criterion?: string }>
      }>
    }
    type PdiItemInsert = Omit<PDIItem, 'id' | 'created_at'> & { order_index: number }

    // Get assessment with responses
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        evaluated_user:users!evaluated_user_id(id, full_name, email),
        responses:assessment_responses(*)
      `)
      .eq('id', assessmentId)
      .single()

    console.log('[generatePDI] Assessment data:', {
      id: assessment?.id,
      mode: assessment?.assessment_mode,
      test_type: assessment?.test_type,
      responses_count: assessment?.responses?.length
    })

    if (assessmentError || !assessment) {
      return { error: 'Avaliação não encontrada' }
    }

    const assessmentRow = assessment as AssessmentRow

    // Check if PDI already exists
    const { data: existingPDI } = await supabase
      .from('pdi_plans')
      .select('id')
      .eq('source_assessment_id', assessmentId)
      .single()

    if (existingPDI) {
      return { error: 'PDI já existe para esta avaliação', pdiId: existingPDI.id }
    }

    // Get the companion assessment (if this is self, get manager, and vice versa)
    const companionMode = assessmentRow.assessment_mode === 'self' ? 'manager' : 'self'
    const { data: companionAssessment } = await supabase
      .from('assessments')
      .select(`
        *,
        responses:assessment_responses(*)
      `)
      .eq('test_type', assessmentRow.test_type)
      .eq('evaluated_user_id', assessmentRow.evaluated_user_id)
      .eq('assessment_mode', companionMode)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    // Create PDI plan - starts as active for immediate use
    // Can be approved by manager later for validation
    const { data: pdiPlan, error: planError } = await supabase
      .from('pdi_plans')
      .insert({
        workspace_id: workspaceId,
        user_id: assessmentRow.evaluated_user_id,
        source_assessment_id: assessmentId,
        status: 'active', // Active by default - approval optional
        // target_completion_date: null // Let user define this
      })
      .select()
      .single()

    if (planError || !pdiPlan) {
      return { error: 'Erro ao criar plano de PDI' }
    }

    // Get test structure to map categories
    const { data: testStructure } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', assessment.test_type)
      .single()

    if (!testStructure) {
      return { error: 'Estrutura do teste não encontrada' }
    }

    const structure = testStructure.structure as TestStructure

    // Create PDI items for low scores
    const pdiItemsToCreate: PdiItemInsert[] = []

    // Build a map of responses for easier lookup
    const companionRow = (companionAssessment ?? null) as AssessmentRow | null
    const selfResponses = assessmentRow.assessment_mode === 'self'
      ? assessmentRow.responses
      : companionRow?.responses || []
    const managerResponses = assessmentRow.assessment_mode === 'manager'
      ? assessmentRow.responses
      : companionRow?.responses || []

    console.log('=== PDI GENERATION DEBUG ===')
    console.log('Assessment mode:', assessmentRow.assessment_mode)
    console.log('Assessment ID:', assessmentRow.id)
    console.log('Self responses count:', selfResponses.length)
    console.log('Manager responses count:', managerResponses.length)
    console.log('Companion assessment found:', !!companionAssessment)
    if (companionAssessment) {
      console.log('Companion assessment ID:', companionAssessment.id)
      console.log('Companion assessment mode:', companionAssessment.assessment_mode)
    }

    const responseMap = new Map<string, { self: number; manager: number }>()
    
    selfResponses.forEach((r) => {
      responseMap.set(r.question_id, { self: r.score || 0, manager: 0 })
    })
    
    managerResponses.forEach((r) => {
      const existing = responseMap.get(r.question_id) || { self: 0, manager: 0 }
      existing.manager = r.score || 0
      responseMap.set(r.question_id, existing)
    })

    console.log('Response map size:', responseMap.size)
    console.log('Sample responses:', Array.from(responseMap.entries()).slice(0, 3))
    console.log('============================')

    // Process responses and create PDI items
    // Process items based on structure to preserve order
    let orderIndex = 0
    
    // Iterate through categories and questions in order
    if (structure.categories) {
      for (const category of structure.categories) {
        if (!category.questions) continue

        for (const question of category.questions) {
          const questionId = question.id
          const scores = responseMap.get(questionId)

          if (!scores) continue

          const scoreSelf = scores.self
          const scoreManager = scores.manager
          const avgScore = (scoreSelf + scoreManager) / 2

          // Auto-trigger: score <= 1 (or whatever logic applies)
          // Note: The previous logic was: if (scoreManager <= 1 || avgScore <= 1)
          // But user said "competências com menor avaliação", so let's keep the logic for now
          if (scoreManager <= 1 || avgScore <= 1) {
            
            // Determine priority
            let priority: PDIPriority = 'medium'
            if (scoreManager === 0) priority = 'critical'
            else if (scoreManager === 1 && scoreSelf === 1) priority = 'high'

            // Check if violates core values
            const violatesCore = ['d12', 'd13', 'd14', 'd15'].includes(questionId) && scoreManager === 0

            const targetScore = Math.min(Math.floor(scoreManager) + 1, 3)

            // Skip if already at max score (3)
            if (scoreManager >= 3) {
              orderIndex++
              continue
            }

            const pdiItem = {
              pdi_plan_id: pdiPlan.id,
              category_id: category.id,
              category_name: category.name,
              criterion: question.text || question.criterion,
              current_score_self: scoreSelf,
              current_score_manager: scoreManager,
              target_score: targetScore,
              priority: violatesCore ? 'critical' as const : priority,
              status: 'not_started' as const,
              order_index: orderIndex // Save the order
            }

            pdiItemsToCreate.push(pdiItem as PdiItemInsert)
          }
          
          // Increment order index for every question in the structure
          orderIndex++
        }
      }
    }

    // Insert PDI items
    let createdItems: PDIItem[] = []
    if (pdiItemsToCreate.length > 0) {
      console.log('=== INSERTING PDI ITEMS ===')
      console.log('Items to create:', pdiItemsToCreate.length)
      console.log('Sample item:', JSON.stringify(pdiItemsToCreate[0], null, 2))
      console.log('===========================')

      const { data: items, error: itemsError } = await supabase
        .from('pdi_items')
        .insert(pdiItemsToCreate)
        .select()

      if (itemsError) {
        console.error('Error creating PDI items:', itemsError)
      } else {
        createdItems = (items || []) as PDIItem[]
        console.log('=== PDI ITEMS CREATED ===')
        console.log('Created items:', createdItems.length)
        console.log('Sample created item:', JSON.stringify(createdItems[0], null, 2))
        console.log('=========================')
      }
    }

    // Auto-generate suggested actions for each item - DISABLED per user request
    /*
    for (const item of createdItems) {
      const categoryKey = item.category_id as keyof typeof SUGGESTED_ACTIONS_BY_CATEGORY
      const suggestedActions = SUGGESTED_ACTIONS_BY_CATEGORY[categoryKey]?.default || []

      const actions = suggestedActions.map(action => ({
        pdi_item_id: item.id,
        action_description: action.description,
        deadline_days: action.deadline_days,
        status: 'pending'
      }))

      if (actions.length > 0) {
        await supabase.from('pdi_actions').insert(actions)
      }
    }
    */

    // Link PDI to assessment
    await supabase
      .from('assessments')
      .update({ pdi_id: pdiPlan.id })
      .eq('id', assessmentId)

    revalidatePath(`/${workspaceId}/assessments`)
    revalidatePath(`/${workspaceId}/pdi`)

    return { success: true, pdiId: pdiPlan.id, itemsCreated: createdItems.length }
  } catch (error: unknown) {
    console.error('Error generating PDI:', error)
    const message = error instanceof Error ? error.message : 'Erro ao gerar PDI'
    return { error: message }
  }
}

/**
 * Get PDI plan with all items and actions
 */
export async function getPDIPlan(pdiId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pdi_plans')
    .select(`
      *,
      user:users!user_id(id, full_name, email),
      assessment:assessments!source_assessment_id(test_type),
      items:pdi_items(
        *,
        actions:pdi_actions(*),
        evidences:pdi_evidence(*)
      )
    `)
    .eq('id', pdiId)
    .single()

  if (data?.items) {
    type SortableItem = { order_index?: number | null; created_at: string }
    const items = data.items as SortableItem[]
    // Sort items by order_index to match assessment structure
    items.sort((a, b) => {
      // Primary sort: order_index
      if (a.order_index !== undefined && b.order_index !== undefined) {
        return (a.order_index ?? 0) - (b.order_index ?? 0)
      }
      // Fallback: created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }

  if (error) {
    console.error('Error fetching PDI:', JSON.stringify(error, null, 2))
    return null
  }

  return data
}

/**
 * Get all PDIs for a user
 */
export async function getUserPDIs(userId: string, workspaceId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pdi_plans')
    .select(`
      *,
      items:pdi_items(
        id,
        status,
        actions:pdi_actions(id, status),
        evidences:pdi_evidence(id)
      )
    `)
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user PDIs:', JSON.stringify(error, null, 2))
    return []
  }

  return data || []
}

/**
 * Get all PDIs for a workspace (for managers/admins)
 */
export async function getAllWorkspacePDIs(workspaceId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pdi_plans')
    .select(`
      *,
      user:users!user_id(id, full_name, email),
      assessment:assessments!source_assessment_id(test_type),
      items:pdi_items(
        id,
        status,
        actions:pdi_actions(id, status),
        evidences:pdi_evidence(id)
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching workspace PDIs:', JSON.stringify(error, null, 2))
    return []
  }

  return data || []
}

/**
 * Update PDI item status
 * Auto-completes PDI when all items are completed
 */
export async function updatePDIItemStatus(itemId: string, status: 'not_started' | 'in_progress' | 'completed') {
  const supabase = await createClient()

  // Update item status
  const { error, data } = await supabase
    .from('pdi_items')
    .update({ status })
    .eq('id', itemId)
    .select('pdi_plan_id')
    .single()

  if (error) {
    return { error: 'Erro ao atualizar status' }
  }

  // Check if all items in the PDI are completed
  if (data && status === 'completed') {
    const { data: allItems } = await supabase
      .from('pdi_items')
      .select('id, status')
      .eq('pdi_plan_id', data.pdi_plan_id)

    if (allItems && allItems.every(item => item.status === 'completed')) {
      // Auto-complete the PDI
      await supabase
        .from('pdi_plans')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', data.pdi_plan_id)
    }
  }

  revalidatePath('/pdi')
  return { success: true }
}

/**
 * Create new PDI action
 */
export async function createPDIAction(
  pdiItemId: string, 
  description: string, 
  deadlineDays?: number,
  startDate?: string,
  dueDate?: string,
  priority?: 'P1' | 'P2' | 'P3'
) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pdi_actions')
    .insert({
      pdi_item_id: pdiItemId,
      action_description: description,
      deadline_days: deadlineDays,
      start_date: startDate,
      due_date: dueDate,
      status: 'pending',
      priority: priority || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating PDI action:', JSON.stringify(error, null, 2))
    return { error: 'Erro ao criar ação' }
  }

  revalidatePath('/pdi')
  return { success: true, action: data }
}

/**
 * Update PDI action details
 */
export async function updatePDIAction(
  actionId: string,
  data: {
    description?: string
    deadlineDays?: number
    startDate?: string
    dueDate?: string
    priority?: 'P1' | 'P2' | 'P3'
  }
) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const updateData: {
    action_description?: string
    deadline_days?: number
    start_date?: string
    due_date?: string
    priority?: 'P1' | 'P2' | 'P3'
  } = {}
  if (data.description !== undefined) updateData.action_description = data.description
  if (data.deadlineDays !== undefined) updateData.deadline_days = data.deadlineDays
  if (data.startDate !== undefined) updateData.start_date = data.startDate
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate
  if (data.priority !== undefined) updateData.priority = data.priority

  const { error } = await supabase
    .from('pdi_actions')
    .update(updateData)
    .eq('id', actionId)

  if (error) {
    console.error('Error updating PDI action:', error)
    return { error: 'Erro ao atualizar ação' }
  }

  revalidatePath('/pdi')
  return { success: true }
}

/**
 * Update PDI plan dates
 */
export async function updatePDIPlanDates(
  planId: string,
  startDate: string | null,
  targetCompletionDate: string | null
) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('pdi_plans')
    .update({
      start_date: startDate,
      target_completion_date: targetCompletionDate
    })
    .eq('id', planId)

  if (error) {
    console.error('Error updating PDI plan dates:', error)
    return { error: 'Erro ao atualizar datas do plano' }
  }

  revalidatePath('/pdi')
  return { success: true }
}

/**
 * Toggle action completion
 * Auto-completes PDI item when all actions are done
 * Auto-completes PDI when all items are completed
 */
export async function togglePDIActionComplete(actionId: string, completed: boolean) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  console.log('[togglePDIActionComplete] Toggling action:', actionId, 'to', completed)

  // Update action
  const { error: actionError } = await supabase
    .from('pdi_actions')
    .update({
      status: completed ? 'done' : 'pending',
      completed_at: completed ? new Date().toISOString() : null
    })
    .eq('id', actionId)

  if (actionError) {
    console.error('[togglePDIActionComplete] Error updating action:', actionError)
    return { error: 'Erro ao atualizar ação' }
  }

  // Get the PDI item to check if all actions are done
  const { data: action } = await supabase
    .from('pdi_actions')
    .select('pdi_item_id, pdi_items!inner(pdi_plan_id, status)')
    .eq('id', actionId)
    .single()

  if (!action) {
    return { success: true }
  }

  const actionRow = action as unknown as {
    pdi_item_id: string
    pdi_items: { pdi_plan_id: string; status: 'not_started' | 'in_progress' | 'completed' } | null
  }
  const pdiItemId = actionRow.pdi_item_id
  const pdiItemInfo = actionRow.pdi_items

  if (!pdiItemInfo) {
    return { success: true }
  }

  const pdiPlanId = pdiItemInfo.pdi_plan_id
  const currentItemStatus = pdiItemInfo.status

  // Check if all actions for this item are done
  const { data: itemActions } = await supabase
    .from('pdi_actions')
    .select('id, status')
    .eq('pdi_item_id', pdiItemId)

  let itemCompleted = false
  let itemStatusMessage = null

  if (itemActions && itemActions.length > 0) {
    const allActionsDone = itemActions.every(a => a.status === 'done')
    
    // Auto-complete item if all actions are done and item is not already completed
    if (allActionsDone && currentItemStatus !== 'completed') {
      await supabase
        .from('pdi_items')
        .update({ status: 'completed' })
        .eq('id', pdiItemId)
      
      itemCompleted = true
      itemStatusMessage = 'Item de PDI concluído automaticamente! 🎉'
    }
    // If unchecking and item is completed, change to in_progress
    else if (!allActionsDone && currentItemStatus === 'completed') {
      await supabase
        .from('pdi_items')
        .update({ status: 'in_progress' })
        .eq('id', pdiItemId)
    }
    // Set to in_progress if at least one action is done
    else if (itemActions.some(a => a.status === 'done') && currentItemStatus === 'not_started') {
      await supabase
        .from('pdi_items')
        .update({ status: 'in_progress' })
        .eq('id', pdiItemId)
    }
  }

  // Check if all items in the PDI are completed
  const { data: allItems } = await supabase
    .from('pdi_items')
    .select('id, status')
    .eq('pdi_plan_id', pdiPlanId)

  let pdiCompleted = false
  let pdiStatusMessage = null

  if (allItems && allItems.length > 0) {
    const allItemsCompleted = allItems.every(item => item.status === 'completed')

    if (allItemsCompleted) {
      // Auto-complete the PDI
      await supabase
        .from('pdi_plans')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', pdiPlanId)
      
      pdiCompleted = true
      pdiStatusMessage = 'PDI completo! Parabéns pela conclusão! 🎊'
    }
  }

  revalidatePath('/', 'layout')
  
  return { 
    success: true,
    itemCompleted,
    pdiCompleted,
    message: pdiStatusMessage || itemStatusMessage
  }
}

export async function updatePDIActionStatus(
  actionId: string,
  status: 'pending' | 'in_progress' | 'done'
) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { error: actionError } = await supabase
    .from('pdi_actions')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null
    })
    .eq('id', actionId)

  if (actionError) {
    console.error('[updatePDIActionStatus] Error updating action:', actionError)
    return { error: 'Erro ao atualizar ação' }
  }

  const { data: action } = await supabase
    .from('pdi_actions')
    .select('pdi_item_id, pdi_items!inner(pdi_plan_id, status)')
    .eq('id', actionId)
    .single()

  if (!action) {
    return { success: true }
  }

  const actionRow = action as unknown as {
    pdi_item_id: string
    pdi_items: { pdi_plan_id: string; status: 'not_started' | 'in_progress' | 'completed' } | null
  }
  const pdiItemId = actionRow.pdi_item_id
  const pdiItemInfo = actionRow.pdi_items

  if (!pdiItemInfo) {
    return { success: true }
  }

  const pdiPlanId = pdiItemInfo.pdi_plan_id
  const currentItemStatus = pdiItemInfo.status

  const { data: itemActions } = await supabase
    .from('pdi_actions')
    .select('id, status')
    .eq('pdi_item_id', pdiItemId)

  let itemCompleted = false
  let itemStatusMessage = null

  if (itemActions && itemActions.length > 0) {
    const allActionsDone = itemActions.every(a => a.status === 'done')
    
    if (allActionsDone && currentItemStatus !== 'completed') {
      await supabase
        .from('pdi_items')
        .update({ status: 'completed' })
        .eq('id', pdiItemId)
      
      itemCompleted = true
      itemStatusMessage = 'Item de PDI concluído automaticamente! 🎉'
    }
    else if (!allActionsDone && currentItemStatus === 'completed') {
      await supabase
        .from('pdi_items')
        .update({ status: 'in_progress' })
        .eq('id', pdiItemId)
    }
    else if (itemActions.some(a => a.status === 'done') && currentItemStatus === 'not_started') {
      await supabase
        .from('pdi_items')
        .update({ status: 'in_progress' })
        .eq('id', pdiItemId)
    }
  }

  const { data: allItems } = await supabase
    .from('pdi_items')
    .select('id, status')
    .eq('pdi_plan_id', pdiPlanId)

  let pdiCompleted = false
  let pdiStatusMessage = null

  if (allItems && allItems.length > 0) {
    const allItemsCompleted = allItems.every(item => item.status === 'completed')

    if (allItemsCompleted) {
      await supabase
        .from('pdi_plans')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', pdiPlanId)
      
      pdiCompleted = true
      pdiStatusMessage = 'PDI completo! Parabéns pela conclusão! 🎊'
    }
  }

  revalidatePath('/', 'layout')
  
  return { 
    success: true,
    itemCompleted,
    pdiCompleted,
    message: pdiStatusMessage || itemStatusMessage
  }
}

/**
 * Delete PDI action
 */
export async function deletePDIAction(actionId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('pdi_actions')
    .delete()
    .eq('id', actionId)

  if (error) {
    return { error: 'Erro ao deletar ação' }
  }

  return { success: true }
}
