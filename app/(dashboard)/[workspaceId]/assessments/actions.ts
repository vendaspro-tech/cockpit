'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveManagerComment(assessmentId: string, comment: string, workspaceId: string) {
  const supabase = createAdminClient()
  
  try {
    const { error } = await supabase
      .from('assessments')
      .update({ manager_comments: comment })
      .eq('id', assessmentId)
      
    if (error) {
      console.error('Error saving manager comment:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/${workspaceId}/assessments`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error saving comment:', error)
    return { success: false, error: 'Failed to save comment' }
  }
}

export async function getAssessmentResult(assessmentId: string) {
  const supabase = createAdminClient()
  
  try {
    // Get assessment details to know the test type
    const { data: assessment } = await supabase
      .from('assessments')
      .select('test_type')
      .eq('id', assessmentId)
      .single()
    
    if (!assessment) {
      console.error('Assessment not found')
      return null
    }

    // Try to calculate on the fly from responses (like the detail page does)
    const { data: responses } = await supabase
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', assessmentId)

    if (responses && responses.length > 0) {
      // Get test structure
      const { data: structure } = await supabase
        .from('test_structures')
        .select('structure')
        .eq('test_type', assessment.test_type)
        .single()

      if (structure?.structure) {
        // Import calculateResult dynamically to avoid circular dependencies
        const { calculateResult } = await import('@/lib/assessment-calculator')
        const answers = responses.reduce((acc, r) => ({ ...acc, [r.question_id]: r.score }), {})
        const calculatedResults = calculateResult(assessment.test_type, answers, structure.structure as any)
        
        if (calculatedResults) {
          // Return in the same format as stored results
          return {
            scores: calculatedResults,
            classification: null // Will be populated if needed
          }
        }
      }
    }

    // Fallback to stored results if calculation fails
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single()
      
    if (error) {
      console.error('Error fetching assessment result:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Unexpected error fetching result:', error)
    return null
  }
}
