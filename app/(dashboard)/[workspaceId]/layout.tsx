import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWorkspaces } from "@/app/actions/workspace"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getAuthUser } from "@/lib/auth-server"
import { getUserRole } from "@/lib/auth-utils"
import { canAccessLeaderCopilot } from "@/lib/leader-scope"
import { getPlatformFeedbackPromptState } from "@/app/actions/platform-feedback"
import { PlatformFeedbackDialog } from "@/components/shared/platform-feedback-dialog"
import { DashboardHeaderProvider } from "@/components/dashboard/dashboard-header-context"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}

async function getWorkspace(workspaceId: string) {
  const supabase = createAdminClient()
  
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  return workspace
}



import { getActiveSystemAlerts } from "@/app/actions/system-alerts"

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const workspace = await getWorkspace(workspaceId)
  
  if (!workspace) {
    redirect('/') // Workspace not found
  }
  
  const userRole = await getUserRole(user.id, workspaceId, { createIfMissing: true })
  
  if (!userRole) {
    redirect('/') // User not a member of this workspace
  }

  const [workspaces, alerts, feedbackPromptState, showLeaderCopilot] = await Promise.all([
    getUserWorkspaces(),
    getActiveSystemAlerts(workspaceId),
    getPlatformFeedbackPromptState(),
    canAccessLeaderCopilot(workspaceId, user.id),
  ])

  // Get current path for breadcrumb
  const pathMap: Record<string, string> = {
    '/assessments': 'Avaliações',
    '/pdi': 'PDIs',
    '/teams': 'Time',
    '/metas': 'Metas',
    '/products': 'Produtos',
    '/settings': 'Configurações',
    '/notifications': 'Notificações',
    '': 'Visão Geral'
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        workspaceId={workspaceId} 
        workspaceName={workspace?.name || 'Workspace'}
        logoUrl={workspace?.logo_url}
        role={userRole}
        showLeaderCopilot={showLeaderCopilot}
        workspaces={workspaces}
        alertsCount={alerts.length}
        plan={workspace?.plan}
      />
      <SidebarInset>
        <DashboardHeaderProvider>
          <DashboardTopbar
            workspaceId={workspaceId}
            workspaceName={workspace?.name || 'Workspace'}
          />
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
            {children}
          </main>
          <PlatformFeedbackDialog initialOpen={feedbackPromptState.shouldShow} />
        </DashboardHeaderProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
