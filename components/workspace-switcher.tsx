'use client'

/* eslint-disable @next/next/no-img-element */

import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"

interface Workspace {
  id: string
  name: string
  logo_url?: string | null
}

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace
  workspaces: Workspace[]
}

export function WorkspaceSwitcher({ currentWorkspace, workspaces = [] }: WorkspaceSwitcherProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="w-full" suppressHydrationWarning>
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
            {currentWorkspace.logo_url ? (
              <img
                src={currentWorkspace.logo_url}
                alt={currentWorkspace.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-full w-full items-center justify-center text-lg font-semibold">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Cockpit Comercial</span>
            <span className="truncate text-xs">{currentWorkspace.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
        suppressHydrationWarning
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces && workspaces.length > 0 && workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => router.push(`/${workspace.id}/overview`)}
            className="gap-2 p-2"
            suppressHydrationWarning
          >
            <div className="flex size-6 items-center justify-center rounded-sm border overflow-hidden">
              {workspace.logo_url ? (
                <img
                  src={workspace.logo_url}
                  alt={workspace.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-full w-full items-center justify-center text-xs font-semibold">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {workspace.name}
            {workspace.id === currentWorkspace.id && (
              <Check className="ml-auto size-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 p-2" suppressHydrationWarning>
          <div className="flex size-6 items-center justify-center rounded-md border border-dashed bg-background">
            <Plus className="size-4" />
          </div>
          <div className="font-medium text-muted-foreground">Criar workspace</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
