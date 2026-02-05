'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthUser } from '@/lib/auth-server'
import { getUserHierarchyInfo, getVisibleUsers } from '@/lib/hierarchy-access'
import { writeAuditLog } from '@/lib/audit'
import type {
  SeniorityAssessment,
  CreateSeniorityAssessmentInput,
  UpdateSeniorityScoresInput,
  SeniorityLevel,
  CompetencyFramework,
  SeniorityAssessmentWithUser,
} from '@/lib/types/competency'

async function getInternalUserId(
  supabaseUserId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', supabaseUserId)
    .single()

  if (error || !data) {
    throw new Error('Usuário não encontrado. Por favor, faça login novamente.')
  }

  return data.id
}

// ============================================================================
// 1. CREATE SENIORITY ASSESSMENT
// ============================================================================

export async function createSeniorityAssessment(
  data: CreateSeniorityAssessmentInput
) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para criar uma avaliação.')

  const supabase = await createClient()

  // Get internal user ID
  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (userError || !dbUser) {
    throw new Error('Perfil de usuário não encontrado. Contate o suporte se o problema persistir.')
  }

  // Validate: user must be creating for themselves (self) or for subordinate (leader)
  if (data.assessment_type === 'self' && data.evaluated_user_id !== dbUser.id) {
    throw new Error('Você não pode criar uma autoavaliação para outro usuário.')
  }

  // Verify competency framework exists
  const { data: framework, error: frameworkError } = await supabase
    .from('competency_frameworks')
    .select('*')
    .eq('id', data.competency_framework_id)
    .single()

  if (frameworkError || !framework) {
    throw new Error('Framework de competências não encontrado. Verifique se há um framework publicado para este cargo.')
  }

  // Create assessment
  const { data: assessment, error } = await supabase
    .from('seniority_assessments')
    .insert({
      ...data,
      evaluator_user_id: data.assessment_type === 'leader' ? dbUser.id : null,
      status: 'draft',
      behavioral_scores: {},
      technical_def_scores: {},
      process_scores: {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating seniority assessment:', error)
    throw new Error(`Erro ao criar avaliação: ${error.message || 'Verifique se você tem permissão para criar avaliações neste workspace.'}`)
  }

  revalidatePath(`/${data.workspace_id}/assessments/seniority`)

  return { success: true, data: assessment }
}

// ============================================================================
// 2. SAVE SENIORITY SCORES (Draft)
// ============================================================================

export async function saveSeniorityScores(
  assessmentId: string,
  scores: UpdateSeniorityScoresInput
) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para salvar pontuações.')

  const supabase = await createClient()

  // Update scores
  const { data, error } = await supabase
    .from('seniority_assessments')
    .update(scores)
    .eq('id', assessmentId)
    .select()
    .single()

  if (error) {
    console.error('Error saving scores:', error)
    throw new Error(`Erro ao salvar pontuações: ${error.message || 'Verifique suas permissões.'}`)
  }

  return { success: true, data }
}

// ============================================================================
// 3. CALCULATE SENIORITY LEVELS
// ============================================================================

function classifyLevel(score: number, ranges: { junior: [number, number]; pleno: [number, number]; senior: [number, number] }): SeniorityLevel {
  if (score >= ranges.senior[0] && score <= ranges.senior[1]) return 'senior'
  if (score >= ranges.pleno[0] && score <= ranges.pleno[1]) return 'pleno'
  return 'junior'
}

function calculateDimensionTotal(
  scores: { [key: string]: number },
  competencies: Array<{ id: string | number }> | undefined,
  weight: number
): number {
  const competencyIds = (competencies ?? []).map(c => c.id.toString())
  const validScores = competencyIds
    .map(id => scores[id] || 0)
    .filter(s => s > 0)

  if (validScores.length === 0) return 0

  const average = validScores.reduce((sum, s) => sum + s, 0) / validScores.length
  // Normalize to 100 scale: score range is 1-3, convert to 0-100
  const normalized = ((average - 1) / 2) * 100

  return normalized * weight
}

export async function calculateSeniorityLevels(
  assessmentId: string,
  frameworkId: string
) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para calcular níveis de senioridade.')

  const supabase = await createClient()

  // Get assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('seniority_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (assessmentError || !assessment) {
    throw new Error('Avaliação não encontrada ou você não tem permissão para acessá-la.')
  }

  // Get framework
  const { data: framework, error: frameworkError } = await supabase
    .from('competency_frameworks')
    .select('*')
    .eq('id', frameworkId)
    .single()

  if (frameworkError || !framework) {
    throw new Error('Framework de competências não encontrado. Contate o administrador do sistema.')
  }

  const fw = framework as CompetencyFramework

  if (!fw.weights) {
    throw new Error('Framework de competências mal configurado: faltam pesos das dimensões. Contate o administrador.')
  }

  const weights = fw.weights

  // Calculate totals for each dimension
  const behavioralTotal = calculateDimensionTotal(
    assessment.behavioral_scores,
    fw.behavioral_competencies,
    weights.behavioral
  )

  const technicalDefTotal = calculateDimensionTotal(
    assessment.technical_def_scores,
    fw.technical_def_competencies,
    weights.technical_def
  )

  const processTotal = calculateDimensionTotal(
    assessment.process_scores,
    fw.process_competencies,
    weights.process
  )

  const globalScore = behavioralTotal + technicalDefTotal + processTotal

  // Classify levels based on scoring ranges
  const behavioralLevel = classifyLevel(behavioralTotal / weights.behavioral, fw.scoring_ranges.behavioral)
  const technicalDefLevel = classifyLevel(technicalDefTotal / weights.technical_def, fw.scoring_ranges.technical_def)
  const processLevel = classifyLevel(processTotal / weights.process, fw.scoring_ranges.process)
  const globalLevel = classifyLevel(globalScore, fw.scoring_ranges.global)

  // Update assessment with calculated values
  const { data, error } = await supabase
    .from('seniority_assessments')
    .update({
      behavioral_total: behavioralTotal,
      technical_def_total: technicalDefTotal,
      process_total: processTotal,
      global_score: globalScore,
      behavioral_level: behavioralLevel,
      technical_def_level: technicalDefLevel,
      process_level: processLevel,
      global_level: globalLevel,
    })
    .eq('id', assessmentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating levels:', error)
    throw new Error(`Erro ao calcular níveis de senioridade: ${error.message}. Por favor, tente novamente.`)
  }

  return { success: true, data }
}

// ============================================================================
// 4. SUBMIT SENIORITY ASSESSMENT
// ============================================================================

export async function submitSeniorityAssessment(assessmentId: string, assessmentType: 'self' | 'leader') {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para submeter uma avaliação.')

  const supabase = await createClient()

  // Get internal user ID
  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (userError || !dbUser) {
    throw new Error('Usuário não encontrado. Por favor, faça login novamente.')
  }

  // Get assessment to calculate levels first
  const { data: assessment, error: getError } = await supabase
    .from('seniority_assessments')
    .select('*, competency_framework_id, workspace_id')
    .eq('id', assessmentId)
    .single()

  if (getError || !assessment) {
    throw new Error('Avaliação não encontrada ou você não tem permissão para acessá-la.')
  }

  const before = { ...assessment }

  // Calculate levels before submitting
  await calculateSeniorityLevels(assessmentId, assessment.competency_framework_id)

  const newStatus = assessmentType === 'self' ? 'self_submitted' : 'leader_submitted'

  // Submit assessment
  const { data, error } = await supabase
    .from('seniority_assessments')
    .update({
      status: newStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .select()
    .single()

  if (error) {
    console.error('Error submitting assessment:', error)
    throw new Error(`Erro ao submeter avaliação: ${error.message}. Verifique se todas as competências foram pontuadas.`)
  }

  // Audit (T038)
  await writeAuditLog({
    actorUserId: dbUser.id,
    action: `seniority_assessment.${assessmentType}_submitted`,
    entityType: 'seniority_assessment',
    entityId: assessmentId,
    workspaceId: assessment.workspace_id,
    before,
    after: data,
    metadata: {
      assessment_type: assessmentType,
      evaluated_user_id: assessment.evaluated_user_id,
    },
    client: supabase,
  })

  revalidatePath(`/*/assessments/seniority`)

  return { success: true, data }
}

// ============================================================================
// 5. CALIBRATE SENIORITY ASSESSMENT (Leader only)
// ============================================================================

export async function calibrateSeniorityAssessment(
  assessmentId: string,
  calibrationData: {
    calibration_notes: string
    final_global_level: SeniorityLevel
  }
) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para calibrar uma avaliação.')

  const supabase = await createClient()

  // Get internal user ID
  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (userError || !dbUser) {
    throw new Error('Usuário não encontrado. Por favor, faça login novamente.')
  }

  // Get assessment
  const { data: assessment, error: getError } = await supabase
    .from('seniority_assessments')
    .select('*, evaluated_user_id, workspace_id')
    .eq('id', assessmentId)
    .single()

  if (getError || !assessment) {
    throw new Error('Avaliação não encontrada ou você não tem permissão para calibrá-la.')
  }

  const before = { ...assessment }

  // Calibrate assessment
  const { data, error } = await supabase
    .from('seniority_assessments')
    .update({
      status: 'calibrated',
      calibration_notes: calibrationData.calibration_notes,
      global_level: calibrationData.final_global_level,
      calibrated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .select()
    .single()

  if (error) {
    console.error('Error calibrating assessment:', error)
    throw new Error(`Erro ao calibrar avaliação: ${error.message}. Verifique se você tem permissão para calibrar esta avaliação.`)
  }

  // Update workspace_members snapshot (FR-006/T037)
  const { error: updateUserError } = await supabase
    .from('workspace_members')
    .update({
      current_seniority_level: calibrationData.final_global_level,
      seniority_last_calibrated_at: new Date().toISOString(),
      seniority_last_assessment_id: assessmentId,
    })
    .eq('user_id', assessment.evaluated_user_id)
    .eq('workspace_id', assessment.workspace_id)

  if (updateUserError) {
    console.error('Error updating user seniority snapshot:', updateUserError)
  }

  // Audit (T038)
  await writeAuditLog({
    actorUserId: dbUser.id,
    action: 'seniority_assessment.calibrated',
    entityType: 'seniority_assessment',
    entityId: assessmentId,
    workspaceId: assessment.workspace_id,
    before,
    after: data,
    metadata: {
      evaluated_user_id: assessment.evaluated_user_id,
      final_global_level: calibrationData.final_global_level,
    },
    client: supabase,
  })

  revalidatePath(`/*/assessments/seniority`)

  return { success: true, data }
}

// ============================================================================
// 6. GET SENIORITY ASSESSMENT BY ID
// ============================================================================

export async function getSeniorityAssessment(assessmentId: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para visualizar avaliações.')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seniority_assessments')
    .select(`
      *,
      evaluated_user:users!seniority_assessments_evaluated_user_id_fkey(id, full_name, email),
      evaluator_user:users!seniority_assessments_evaluator_user_id_fkey(id, full_name, email),
      competency_framework:competency_frameworks(*)
    `)
    .eq('id', assessmentId)
    .single()

  if (error) {
    console.error('Error fetching assessment:', error)
    throw new Error('Avaliação não encontrada ou você não tem permissão para visualizá-la.')
  }

  return { success: true, data }
}

// ============================================================================
// 7. GET SENIORITY HISTORY (User's assessment timeline)
// ============================================================================

export async function getSeniorityHistory(userId: string, workspaceId: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para visualizar o histórico de avaliações.')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seniority_assessments')
    .select(`
      *,
      evaluator_user:users!seniority_assessments_evaluator_user_id_fkey(id, full_name)
    `)
    .eq('evaluated_user_id', userId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error)
    throw new Error(`Erro ao buscar histórico de avaliações: ${error.message}. Tente novamente.`)
  }

  return { success: true, data: data || [] }
}

// ============================================================================
// 8. GET PENDING CALIBRATIONS (Leader view)
// ============================================================================

export async function getPendingCalibrationsForLeader(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para visualizar calibrações pendentes.')

  const supabase = await createClient()

  const internalUserId = await getInternalUserId(user.id, supabase)
  const viewerInfo = await getUserHierarchyInfo(internalUserId, workspaceId, supabase)
  const hierarchyLevel = viewerInfo?.hierarchyLevel ?? null

  // Only leaders (levels 0-2) can see pending calibrations
  if (hierarchyLevel === null || hierarchyLevel > 2) {
    return { success: true, data: [] }
  }

  const visibleUserIds = await getVisibleUsers(internalUserId, workspaceId, supabase)
  if (!visibleUserIds.length) {
    return { success: true, data: [] }
  }

  const { data, error } = await supabase
    .from('seniority_assessments')
    .select(`
      *,
      evaluated_user:users!seniority_assessments_evaluated_user_id_fkey(id, full_name, email)
    `)
    .eq('workspace_id', workspaceId)
    .in('status', ['self_submitted', 'leader_submitted'])
    .in('evaluated_user_id', visibleUserIds)
    .order('completed_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending calibrations:', error)
    throw new Error(`Erro ao buscar calibrações pendentes: ${error.message}. Tente novamente.`)
  }

  return { success: true, data: data || [] }
}

// ============================================================================
// HELPER: List all assessments for a workspace (with filters)
// ============================================================================

export async function listSeniorityAssessments(
  workspaceId: string,
  filters?: {
    status?: 'draft' | 'self_submitted' | 'leader_submitted' | 'calibrated' | 'cancelled'
    userId?: string
    assessmentType?: 'self' | 'leader'
  }
) {
  const user = await getAuthUser()
  if (!user) throw new Error('Você precisa estar autenticado para visualizar avaliações.')

  const supabase = await createClient()

  const internalUserId = await getInternalUserId(user.id, supabase)
  const visibleUserIds = await getVisibleUsers(internalUserId, workspaceId, supabase)

  if (!visibleUserIds.length) {
    return { success: true, data: [] }
  }

  if (filters?.userId && !visibleUserIds.includes(filters.userId)) {
    return { success: true, data: [] }
  }

  let query = supabase
    .from('seniority_assessments')
    .select(`
      *,
      evaluated_user:users!seniority_assessments_evaluated_user_id_fkey(id, full_name, email),
      evaluator_user:users!seniority_assessments_evaluator_user_id_fkey(id, full_name)
    `)
    .eq('workspace_id', workspaceId)
    .in('evaluated_user_id', visibleUserIds)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.userId) {
    query = query.eq('evaluated_user_id', filters.userId)
  }

  if (filters?.assessmentType) {
    query = query.eq('assessment_type', filters.assessmentType)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error listing assessments:', error)
    throw new Error(`Erro ao listar avaliações: ${error.message}. Tente novamente.`)
  }

  return { success: true, data: data || [] }
}
