import { getTeamMembers, getJobTitles, getAvailableRoles } from "@/app/actions/teams"
import { createAdminClient } from "@/lib/supabase/admin"
import { getWorkspacePlanUsage } from "@/app/actions/plans"
import { getWorkspaceSquads } from "@/app/actions/squads"
import { TeamsClient } from "@/components/teams/teams-client"

interface TeamsPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { workspaceId } = await params
  const supabase = createAdminClient()
  const members = await getTeamMembers(workspaceId)
  const jobTitles = await getJobTitles(workspaceId)
  const roles = await getAvailableRoles()
  const planUsage = await getWorkspacePlanUsage(workspaceId)
  const squadsResult = await getWorkspaceSquads(workspaceId)
  const squads = squadsResult.data || []
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .single()

  return (
    <TeamsClient
      workspaceId={workspaceId}
      workspaceName={workspace?.name || 'Workspace'}
      members={members}
      jobTitles={jobTitles}
      roles={roles}
      planUsage={planUsage}
      squads={squads}
    />
  )
}
