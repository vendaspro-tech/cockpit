"use client"

import Link from "next/link"
import { Bell } from "lucide-react"

import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useDashboardHeaderContext } from "@/components/dashboard/dashboard-header-context"

type DashboardTopbarProps = {
  workspaceId: string
  workspaceName: string
}

export function DashboardTopbar({ workspaceId, workspaceName }: DashboardTopbarProps) {
  const { state } = useDashboardHeaderContext()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {state.title ? (
          <h1 className="text-base font-semibold tracking-tight">{state.title}</h1>
        ) : state.hideBreadcrumb ? null : (
          <DashboardBreadcrumb workspaceId={workspaceId} workspaceName={workspaceName} />
        )}
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
  )
}
