import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { AssessmentConfigForm } from './assessment-config-form'
import { getAuthUser } from '@/lib/auth-server'

interface NewAssessmentPageProps {
  params: Promise<{ 
    workspaceId: string
    testType: string 
  }>
}

async function getWorkspaceUsers(workspaceId: string) {
  const supabase = createAdminClient()
  
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      role,
      users (
        id,
        full_name,
        email
      )
    `)
    .eq('workspace_id', workspaceId)
  
  const membersData = (members as any[]) || []

  return membersData
    .filter((member) => member.users?.id && member.users?.email)
    .map((member) => ({
      id: member.users.id,
      full_name: member.users.full_name || '',
      email: member.users.email,
      role: member.role,
    }))
}

async function getTestStructure(testType: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('test_structures')
    .select('*')
    .eq('test_type', testType)
    .single()
  
  return data
}

export default async function NewAssessmentPage({ params }: NewAssessmentPageProps) {
  const { workspaceId, testType } = await params
  const user = await getAuthUser()
  
  if (!user) redirect('/login')

  const users = await getWorkspaceUsers(workspaceId)
  const testStructure = await getTestStructure(testType)
  const structure = testStructure?.structure as any

  // Server Action para criar a avaliação
  async function createAssessment(formData: FormData) {
    'use server'
    
    const evaluatedId = formData.get('evaluatedId') as string
    const mode = formData.get('mode') as 'self' | 'manager'
    
    if (!evaluatedId || !mode) return

    // Fetch user again inside the action context
    const actionUser = await getAuthUser()
    if (!actionUser) return

    const supabase = createAdminClient()
    
    // Get current user ID from Supabase
    const { data: currentUserData } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', actionUser.id)
      .single()

    if (!currentUserData) return

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({
        workspace_id: workspaceId,
        test_type: testType,
        evaluated_user_id: evaluatedId,
        evaluator_user_id: currentUserData.id,
        assessment_mode: mode,
        status: 'draft',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assessment:', error)
      return
    }

    revalidatePath(`/${workspaceId}/assessments`)
    redirect(`/${workspaceId}/assessments/${testType}/${assessment.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nova Avaliação</h1>
        <p className="text-gray-600 mt-2">
          Configurar nova avaliação de {structure?.title}
        </p>
      </div>

      <AssessmentConfigForm 
        users={users} 
        testTitle={structure?.title} 
        onSubmit={createAssessment} 
      />
    </div>
  )
}
