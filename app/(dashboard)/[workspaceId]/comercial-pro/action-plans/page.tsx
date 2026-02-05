import { getActionPlans } from "@/app/actions/comercial-pro"
import { ActionPlansView } from "@/components/comercial-pro/action-plans-view"
import { createAdminClient } from "@/lib/supabase/admin"

interface ActionPlansPageProps {
  params: Promise<{ workspaceId: string }>
}

async function getWorkspaceUsers(workspaceId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('workspace_members')
    .select('user_id, user:users(id, full_name)')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error fetching workspace users:', error)
    return []
  }

  return data.map((item: any) => ({
    id: item.user.id,
    name: item.user.full_name
  }))
}

export default async function ActionPlansPage({ params }: ActionPlansPageProps) {
  const { workspaceId } = await params
  const [plans, users] = await Promise.all([
    getActionPlans(workspaceId),
    getWorkspaceUsers(workspaceId)
  ])

  return (
    <div className="container mx-auto py-6">
      <ActionPlansView 
        initialPlans={plans} 
        workspaceId={workspaceId} 
        users={users}
      />
    </div>
  )
}
