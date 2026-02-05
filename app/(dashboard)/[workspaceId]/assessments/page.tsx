import { createAdminClient } from '@/lib/supabase/admin'
import { AssessmentsDashboard } from './assessments-dashboard'

interface PageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function AssessmentsPage({ params }: PageProps) {
  const { workspaceId } = await params
  const supabase = createAdminClient()

  // Fetch assessments with relations
  const { data: assessments, error: assessmentsError } = await supabase
    .from('assessments')
    .select(`
      *,
      evaluated_user:users!evaluated_user_id(full_name, email),
      evaluator_user:users!evaluator_user_id(full_name, email),
      product:products(name)
    `)
    .eq('workspace_id', workspaceId)
    .neq('test_type', 'def_method')
    .order('started_at', { ascending: false })

  if (assessmentsError) {
    console.error('Error fetching assessments:', JSON.stringify(assessmentsError, null, 2))
  }

  // Fetch workspace users for filter
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select(`
      user:users(id, full_name, email)
    `)
    .eq('workspace_id', workspaceId)

  if (membersError) {
    console.error('Error fetching members:', JSON.stringify(membersError, null, 2))
  }

  // Flatten users list
  const users = members?.map(m => m.user).filter(Boolean) || []

  // Fetch products for DEF filter
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .order('name')

  return (
    <AssessmentsDashboard 
      initialData={assessments || []} 
      workspaceId={workspaceId}
      users={users}
      products={products || []}
    />
  )
}
