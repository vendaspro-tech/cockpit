import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth-utils"
import { getTeamMembers, getAvailableRoles } from "@/app/actions/teams"
import { getWorkspaceInvitations } from "@/app/actions/invitations"
import { getWorkspacePlanUsage } from "@/app/actions/plans"
import { createAdminClient } from "@/lib/supabase/admin"

import SettingsLayout from "./layout"
import { AccountSettings } from "@/components/settings/account-settings"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import { IntegrationsSettings } from "@/components/settings/integrations-settings"
import { UsersSettings } from "@/components/settings/users-settings"
import { BillingSettings } from "@/components/settings/billing-settings"
import { PlansSettings } from "@/components/settings/plans-settings"

interface SettingsPageProps {
  params: Promise<{
    workspaceId: string
  }>
  searchParams: Promise<{
    tab?: string
  }>
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { workspaceId } = await params
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const role = await getUserRole(user.id, workspaceId)
  
  if (!role) {
      redirect("/login")
  }

  // Determine which tab to show. Default to 'account'
  const currentTab = tab || 'account'

  // Fetch data required for specific tabs to avoid over-fetching
  // For simplicity in this implementation, we fetch what's needed for the active tab
  // But since we are server-side, we can just fetch.
  
  // Data for 'workspace' tab
  let workspaceData = null
  if (currentTab === 'workspace') {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()
      workspaceData = workspace
  }

  // Data for 'users' tab
  let members: any[] = []
  let invitations: any[] = []
  let planUsage: any = null
  let roles: any[] = []
  let jobTitles: any[] = []

  if (currentTab === 'users') {
      const adminClient = createAdminClient()

      // Fetch all job titles (all job titles are global, no workspace_id column)
      const { data: jobTitlesData, error: jobTitlesError } = await supabase
        .from('job_titles')
        .select('id, name, hierarchy_level')
        .order('hierarchy_level')

      if (jobTitlesError) {
        console.error('Error fetching job titles:', jobTitlesError)
      }

      const [membersData, invitationsData, planUsageData, rolesData] = await Promise.all([
          getTeamMembers(workspaceId),
          getWorkspaceInvitations(workspaceId),
          getWorkspacePlanUsage(workspaceId),
          getAvailableRoles()
      ])
      members = membersData
      invitations = invitationsData
      planUsage = planUsageData
      roles = rolesData
      jobTitles = jobTitlesData || []
  }

  // Prepare serializable user data
  const userData = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || '',
    avatarUrl: user.user_metadata?.avatar_url || ''
  }

  return (
    <div className="flex-1 lg:max-w-4xl">
        {currentTab === 'account' && (
            <AccountSettings userData={userData} role={role} />
        )}
        {currentTab === 'workspace' && (
             <WorkspaceSettings workspace={workspaceData} />
        )}
        {currentTab === 'integrations' && (
            <IntegrationsSettings />
        )}
        {currentTab === 'users' && (
            <UsersSettings
                workspaceId={workspaceId}
                members={members}
                invitations={invitations}
                planUsage={planUsage}
                roles={roles}
                jobTitles={jobTitles}
                currentUserRole={role}
                currentUserSupabaseId={user.id}
            />
        )}
        {currentTab === 'billing' && (
            <BillingSettings workspaceId={workspaceId} />
        )}
        {currentTab === 'plans' && (
            <PlansSettings workspaceId={workspaceId} />
        )}
    </div>
  )
}
