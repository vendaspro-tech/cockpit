import { createAdminClient } from '@/lib/supabase/admin'
import { calculateResult } from '@/lib/assessment-calculator'
import { redirect } from 'next/navigation'
import { AssessmentForm } from './assessment-form'
import { revalidatePath } from 'next/cache'
import { ResultsView } from '@/components/assessments/results-view'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth-server'
import { getTeamAverageScore } from '@/app/actions/performance-analytics'

interface AssessmentPageProps {
  params: Promise<{ 
    workspaceId: string
    testType: string
    assessmentId: string
  }>
}

async function getAssessmentData(assessmentId: string) {
  const supabase = createAdminClient()
  
  // Get assessment details
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()
    
  if (!assessment) return null

  // Get test structure
  const { data: structure } = await supabase
    .from('test_structures')
    .select('*')
    .eq('test_type', assessment.test_type)
    .single()

  // Get existing responses
  const { data: responses } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('assessment_id', assessmentId)

  // Format responses for the form
  const formattedResponses = {
    answers: responses?.reduce((acc, r) => ({ ...acc, [r.question_id]: r.score }), {}) || {},
    comments: responses?.reduce((acc, r) => ({ ...acc, [r.question_id]: r.comment }), {}) || {}
  }

  // Get results if completed
  let results = null
  if (assessment.status === 'completed') {
    // Try to calculate on the fly to ensure latest format (with detailed items)
    if (responses && responses.length > 0 && structure?.structure) {
       const answers = responses.reduce((acc, r) => ({ ...acc, [r.question_id]: r.score }), {})
       results = calculateResult(assessment.test_type, answers, structure.structure as any)
    }

    // Fallback to stored results if calculation fails
    if (!results) {
      const { data: res } = await supabase
        .from('assessment_results')
        .select('scores')
        .eq('assessment_id', assessmentId)
        .single()
      results = res?.scores
    }
  }

  return {
    assessment,
    structure: structure?.structure,
    initialData: {
      ...formattedResponses,
      currentCategoryIndex: assessment.current_category_index ?? 0,
      currentQuestionIndex: assessment.current_question_index ?? 0
    },
    results,
    product_id: assessment.product_id
  }
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const { workspaceId, assessmentId } = await params
  const user = await getAuthUser()
  const baseAssessmentsPath = `/${workspaceId}/assessments`
  const defPath = `/${workspaceId}/def`
  
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  // Get internal user ID
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!dbUser) {
    redirect('/login')
  }

  let isOwner = false
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', dbUser.id)
    .maybeSingle()
    
  isOwner = member?.role === 'owner'

  const data = await getAssessmentData(assessmentId)
  
  // Fetch products if DEF
  const { testType } = await params
  let products: { id: string; name: string }[] = []
  if (testType === 'def_method') {
    const supabase = createAdminClient()
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .eq('workspace_id', workspaceId)
    products = productsData || []
  }

  if (!data) {
    return <div>Avaliação não encontrada</div>
  }

  const listPath =
    data.assessment.test_type === 'def_method'
      ? defPath
      : baseAssessmentsPath

  // Se estiver concluído, mostra os resultados
  if (data.assessment.status === 'completed' && data.results) {
    const supabase = createAdminClient()
    // Check for manager evaluation
    const { data: managerAssessment } = await supabase
      .from('assessments')
      .select('id, status, test_type')
      .eq('target_user_id', data.assessment.user_id) // Use data.assessment.user_id
      .eq('test_type', data.assessment.test_type)
      .eq('type', 'manager')
      .single()

    let managerResults = null
    if (managerAssessment && managerAssessment.status === 'completed') {
       // Fetch manager responses
       const { data: managerResponses } = await supabase
        .from('assessment_responses')
        .select('question_id, score')
        .eq('assessment_id', managerAssessment.id)

       // Calculate manager results on the fly
       if (managerResponses && managerResponses.length > 0 && data.structure) { // Use data.structure
          const managerAnswers = managerResponses.reduce((acc, r) => ({ ...acc, [r.question_id]: r.score }), {})
          managerResults = calculateResult(managerAssessment.test_type, managerAnswers, data.structure as any)
       }

       // Fallback to stored results
       if (!managerResults) {
          const { data: res } = await supabase
            .from('assessment_results')
            .select('scores')
            .eq('assessment_id', managerAssessment.id)
            .single()
          managerResults = res?.scores
       }
    }

    // Fetch team average for comparison
    const teamComparison = await getTeamAverageScore(workspaceId, data.assessment.test_type)
    
    // Get evaluated user info for PDF export
    const evaluatedUser = data.assessment.users as any

    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <ResultsView 
          testType={data.assessment.test_type} 
          result={data.results} 
          managerResult={managerResults}
          managerComments={managerAssessment ? 'Avaliação do Gestor disponível' : undefined} // Placeholder, need to fetch comments if needed
          hasManagerEvaluation={!!managerAssessment}
          managerScore={managerResults?.percentage || managerResults?.globalPercentage || managerResults?.score}
          selfScore={data.results?.percentage || data.results?.globalPercentage || data.results?.score}
          teamComparison={teamComparison}
          assessmentId={assessmentId}
          userName={evaluatedUser?.full_name || evaluatedUser?.email || 'Usuário'}
        />
        
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href={listPath}>Voltar para Avaliações</Link>
          </Button>
        </div>
      </div>
    )
  }

  async function saveAssessment(formData: any, status: 'draft' | 'completed', forceComplete: boolean = false) {
    'use server'
    
    const supabase = createAdminClient()
    const {
      answers,
      comments,
      currentCategoryIndex,
      currentQuestionIndex,
      product_id
    } = formData

    // Prepare upsert data
    const upsertData = Object.keys(answers).map(questionId => ({
      assessment_id: assessmentId,
      question_id: questionId,
      score: answers[questionId],
      comment: comments[questionId] || null,
      updated_at: new Date().toISOString()
    }))

    if (upsertData.length > 0) {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert(upsertData, { onConflict: 'assessment_id,question_id' })

      if (error) {
        console.error('Error saving responses:', JSON.stringify(error, null, 2))
        console.error('Upsert data sample:', upsertData[0])
        throw new Error(`Failed to save responses: ${error.message}`)
      }
    }

    // Determine final status
    let finalStatus: string = status
    const targetTypes = ['seniority_seller', 'seniority_leader']
    
    if (status === 'completed' && targetTypes.includes(data!.assessment.test_type)) {
      if (!forceComplete) {
        finalStatus = 'pending_evaluation'
      }
    }

    // Update assessment status
    const statusPayload = { 
      status: finalStatus,
      completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
      current_category_index: Number.isInteger(currentCategoryIndex) ? currentCategoryIndex : 0,
      current_question_index: Number.isInteger(currentQuestionIndex) ? currentQuestionIndex : 0,
      product_id: product_id ?? null
    }

    const { error: statusError } = await supabase
      .from('assessments')
      .update(statusPayload)
      .eq('id', assessmentId)
    
    // Se status não for aceito (ex.: enum sem pending_evaluation), faz fallback para completed
    if (statusError) {
      console.error('Error updating assessment status:', statusError, 'payload:', statusPayload)
      
      if (finalStatus !== 'completed') {
        const { error: fallbackError } = await supabase
          .from('assessments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', assessmentId)
        
        if (fallbackError) {
          console.error('Fallback update to completed failed:', fallbackError)
          throw new Error('Failed to update assessment status')
        }
      } else {
        throw new Error('Failed to update assessment status')
      }
    }

    if (finalStatus === 'completed') {
      try {
        const result = calculateResult(data!.assessment.test_type, answers, data!.structure as any)
        
        if (result) {
          const r = result as any
          const { error: resultsError } = await supabase
            .from('assessment_results')
            .upsert({
              assessment_id: assessmentId,
              scores: result,
              classification: r.level ? { level: r.level, description: r.description } : 
                             r.style ? { style: r.style, description: r.description } : null,
            }, { onConflict: 'assessment_id' })
          
          if (resultsError) {
            console.error('Error saving assessment results:', resultsError)
            throw new Error('Failed to save assessment results')
          }
        }
      } catch (e) {
        console.error('Error calculating/saving results:', e)
      }
      
      revalidatePath(baseAssessmentsPath)
      revalidatePath(listPath)
      redirect(listPath)
    } else if (finalStatus === 'pending_evaluation') {
      revalidatePath(baseAssessmentsPath)
      revalidatePath(listPath)
      redirect(listPath)
    }

    revalidatePath(baseAssessmentsPath)
    revalidatePath(listPath)
  }

  return (
    <AssessmentForm 
      structure={data.structure}
      assessmentId={assessmentId}
      testType={data.assessment.test_type}
      initialData={{
        ...data.initialData,
        product_id: data.product_id
      }}
      products={products}
      onSave={saveAssessment}
      isOwner={isOwner}
      workspaceId={workspaceId}
    />
  )
}
