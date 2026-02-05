import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSeniorityAssessment } from '@/app/actions/seniority-assessments'
import { SeniorityAssessmentForm } from '@/components/assessments/seniority/seniority-assessment-form'
import { SeniorityResultsView } from '@/components/assessments/seniority/seniority-results-view'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ workspaceId: string; assessmentId: string }>
}

async function AssessmentContent({ workspaceId, assessmentId }: { workspaceId: string; assessmentId: string }) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get internal user
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!dbUser) {
    redirect('/login')
  }

  // Get assessment with framework
  const assessmentResult = await getSeniorityAssessment(assessmentId)

  if (!assessmentResult.success || !assessmentResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Avaliação não encontrada ou você não tem permissão para visualizá-la.
        </AlertDescription>
      </Alert>
    )
  }

  const assessment = assessmentResult.data
  const framework = assessment.competency_framework

  // Check if user can edit (only if draft and is evaluator/evaluated)
  const canEdit = assessment.status === 'draft' && (
    assessment.evaluated_user_id === dbUser.id ||
    assessment.evaluator_user_id === dbUser.id
  )

  // If draft and can edit, show form
  if (canEdit) {
    return (
      <SeniorityAssessmentForm
        assessment={assessment}
        framework={framework}
        workspaceId={workspaceId}
      />
    )
  }

  // Otherwise, show results
  return (
    <SeniorityResultsView
      assessment={assessment}
      framework={framework}
      workspaceId={workspaceId}
    />
  )
}

export default async function AssessmentPage({ params }: PageProps) {
  const { workspaceId, assessmentId } = await params

  return (
    <Suspense fallback={<div>Carregando avaliação...</div>}>
      <AssessmentContent workspaceId={workspaceId} assessmentId={assessmentId} />
    </Suspense>
  )
}
