import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWorkspaces } from "@/app/actions/workspace"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { getAuthUser } from "@/lib/auth-server"
import { getUserRole } from "@/lib/auth-utils"

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

// ... imports ...

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

  const [workspaces, alerts] = await Promise.all([
    getUserWorkspaces(),
    getActiveSystemAlerts(workspaceId)
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
        workspaces={workspaces}
        alertsCount={alerts.length}
        plan={workspace?.plan}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <DashboardBreadcrumb 
              workspaceId={workspaceId}
              workspaceName={workspace?.name || 'Workspace'}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/${workspaceId}/notifications`}>
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notificações</span>
              </Link>
            </Button>
            <NavUser />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
