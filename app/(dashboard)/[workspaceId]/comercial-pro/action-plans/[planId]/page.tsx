import { createClient } from "@/lib/supabase/server"
import { ActionPlanEditor } from "@/components/comercial-pro/action-plan-editor"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{
    workspaceId: string
    planId: string
  }>
}

export default async function ActionPlanPage({ params }: PageProps) {
  const { workspaceId, planId } = await params
  const supabase = await createClient()

  // Fetch plan
  const { data: plan, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('id', planId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !plan) {
    console.error('Error fetching plan:', error)
    return notFound()
  }

  // Fetch users for assignment
  const { data: usersData } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      users:user_id (
        id,
        full_name,
        email
      )
    `)
    .eq('workspace_id', workspaceId)

  const users = usersData?.map((member: any) => ({
    id: member.users.id,
    name: member.users.full_name || member.users.email,
  })) || []

  return (
    <ActionPlanEditor 
      initialPlan={plan} 
      workspaceId={workspaceId} 
      users={users} 
    />
  )
}
