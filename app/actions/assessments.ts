'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'

export async function createAssessment(workspaceId: string, testType: string, productId?: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  // Get internal user ID from Clerk ID
  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (userError || !dbUser) {
    console.error('Error finding user:', userError)
    throw new Error('User not found')
  }

  // Create a new draft assessment
  const insertData: {
    workspace_id: string
    test_type: string
    evaluator_user_id: string
    evaluated_user_id: string
    assessment_mode: 'self'
    status: 'draft'
    product_id?: string
  } = {
    workspace_id: workspaceId,
    test_type: testType,
    evaluator_user_id: dbUser.id,
    evaluated_user_id: dbUser.id, // Default to self
    assessment_mode: 'self',
    status: 'draft'
  }

  // Only add product_id if explicitly provided
  if (productId) {
    insertData.product_id = productId
  }

  const { data, error } = await supabase
    .from('assessments')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating assessment:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to create assessment: ${error.message}`)
  }

  revalidatePath(`/${workspaceId}/assessments`)
  
  if (testType === 'disc') {
    redirect(`/${workspaceId}/assessments/disc/${data.id}`)
  }
  
  redirect(`/${workspaceId}/assessments/${testType}/${data.id}`)
}

export async function deleteAssessment(workspaceId: string, assessmentId: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
    
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', assessmentId)

  if (error) {
    console.error('Error deleting assessment:', error)
    throw new Error('Failed to delete assessment')
  }

  revalidatePath(`/${workspaceId}/assessments`)
}

export async function createAssessmentResponse(assessmentId: string, questionId: string, value: number) {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('assessment_responses')
    .upsert({
      assessment_id: assessmentId,
      question_id: questionId,
      score: value
    }, {
      onConflict: 'assessment_id,question_id'
    })

  if (error) {
    console.error('Error saving response:', error)
    throw new Error('Failed to save response')
  }
}

export async function completeAssessment(assessmentId: string, results: { scores: unknown; profile: string; answers?: unknown; [key: string]: unknown }) {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  // 1. Save results to assessment_results table
  const { error: resultsError } = await supabase
    .from('assessment_results')
    .upsert({
      assessment_id: assessmentId,
      scores: results.scores,
      classification: { profile: results.profile },
      divergences: results.answers // Storing raw answers here for now
    }, { onConflict: 'assessment_id' })

  if (resultsError) {
    console.error('Error saving results:', resultsError)
    throw new Error('Failed to save results')
  }

  // 2. Update assessment status
  const { error: updateError } = await supabase
    .from('assessments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', assessmentId)

  if (updateError) {
    console.error('Error updating assessment status:', updateError)
    throw new Error('Failed to update assessment status')
  }
}

export async function resetAssessment(workspaceId: string, assessmentId: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  // Reset status to draft
  const { error } = await supabase
    .from('assessments')
    .update({
      status: 'draft',
      completed_at: null
    })
    .eq('id', assessmentId)

  if (error) {
    console.error('Error resetting assessment:', error)
    throw new Error('Failed to reset assessment')
  }

  // Delete any partial results if they exist (just in case)
  await supabase
    .from('assessment_results')
    .delete()
    .eq('assessment_id', assessmentId)

  revalidatePath(`/${workspaceId}/assessments`)
  redirect(`/${workspaceId}/assessments/disc/${assessmentId}`)
}

export async function recoverAssessmentResults(workspaceId: string, assessmentId: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  // Fetch assessment to get test_type
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('test_type')
    .eq('id', assessmentId)
    .single()

  if (assessmentError || !assessment) {
    console.error('Error fetching assessment:', assessmentError)
    throw new Error('Assessment not found')
  }

  // Fetch all responses
  const { data: responses, error: responsesError } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('assessment_id', assessmentId)

  if (responsesError || !responses || responses.length === 0) {
    console.error('Error fetching responses for recovery:', responsesError)
    throw new Error('No responses found to recover')
  }

  // Fetch test structure
  const { data: structureData, error: structureError } = await supabase
    .from('test_structures')
    .select('structure')
    .eq('test_type', assessment.test_type)
    .eq('is_active', true)
    .single()

  if (structureError || !structureData) {
    console.error('Error fetching test structure:', structureError)
    throw new Error('Test structure not found')
  }

  // Reconstruct answers object: statement_id -> score
  const answers: Record<string, number> = {}

  type ResponseRow = { question_id: string; value: number | string; score?: number }
  const responseRows = (responses ?? []) as ResponseRow[]

  responseRows.forEach((response) => {
    // Handle both old format (value) and new format (score)
    const score = response.score !== undefined ? Number(response.score) : Number(response.value)
    answers[response.question_id] = score
  })

  // Calculate results using the generic calculator
  const { calculateResult } = await import('@/lib/assessment-calculator')
  const calculatedResults = calculateResult(assessment.test_type, answers, structureData.structure as any)

  if (!calculatedResults) {
    console.error('Failed to calculate results')
    throw new Error('Failed to calculate results')
  }

  // Save recovered results
  const resultData = calculatedResults as any
  await completeAssessment(assessmentId, {
    scores: resultData.scores || calculatedResults,
    profile: resultData.profile || '',
    answers: resultData.items || answers
  })

  revalidatePath(`/${workspaceId}/assessments`)
  redirect(`/${workspaceId}/assessments/${assessment.test_type}/${assessmentId}`)
}
