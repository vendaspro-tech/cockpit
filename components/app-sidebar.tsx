"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  LayoutDashboard,
  ClipboardList,
  Target,
  Users,
  Settings,
  GraduationCap,
  Package,
  TrendingUp,
  ChevronRight,
  Calendar,
  Bell,
  BarChart3,
  Grid3x3,
  Rocket,
  ClipboardCheck,
  Video,
  Info,
  ListTodo,
  FolderClosed,
  LifeBuoy,
  UserPlus,
  Sun,
  Moon,
  Briefcase,
  Award,
  Bot,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { usePathname } from "next/navigation"

import { WorkspaceSwitcher } from "@/components/workspace-switcher"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  workspaceId: string
  workspaceName: string
  logoUrl?: string | null
  role?: string
  workspaces: { id: string; name: string; logo_url?: string | null }[]
  alertsCount?: number
  plan?: string
}

export function AppSidebar({ workspaceId, workspaceName, logoUrl, role, workspaces, alertsCount = 0, plan, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const pathDefaultGroup = useMemo(() => {
    if (pathname.includes('/comercial-pro')) return 'comercialpro'
    if (pathname.includes('/assessments/seniority-v2') || pathname.includes('/performance')) return 'skillsv2'
    if (pathname.includes('/assessments') || pathname.includes('/pdi') || pathname.includes('/kpis') || pathname.includes('/job-titles')) return 'skills'
    if (pathname.includes('/products') || pathname.includes('/commercial-plan') || pathname.includes('/otes') || pathname.includes('/strategy')) return 'estrategia'
    return null
  }, [pathname])
  const showSupportEntry = role !== 'system_owner'
  const [userOpenGroup, setUserOpenGroup] = useState<string | null | undefined>(undefined)
  const resolvedOpenGroup = userOpenGroup === undefined ? pathDefaultGroup : userOpenGroup
  const setGroupOpen = (group: string, open: boolean) => {
    setUserOpenGroup(open ? group : null)
  }
  const isComercialPro = plan === 'Comercial Pro'
  const showComercialPro = false
  const showSkillsV2 = false
  const showEstrategia = false

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher 
          currentWorkspace={{ id: workspaceId, name: workspaceName, logo_url: logoUrl }}
          workspaces={workspaces}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes('/overview')}>
                <a href={`/${workspaceId}/overview`}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes('/calendar')}>
                <a href={`/${workspaceId}/calendar`}>
                  <Calendar />
                  <span>Agenda</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes('/tasks')}>
                <a href={`/${workspaceId}/tasks`}>
                  <ListTodo />
                  <span>Tarefas</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes('/products')}>
                <a href={`/${workspaceId}/products`}>
                  <Package />
                  <span>Produtos & ICPs</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes('/agents')}>
                <a href={`/${workspaceId}/agents`}>
                  <Bot />
                  <span>Biblioteca de Agentes</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes('/teams')}>
                <a href={`/${workspaceId}/teams`}>
                  <Users />
                  <span>Times e Squads</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {showSupportEntry ? (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes('/support')}>
                  <a href={`/${workspaceId}/support`}>
                    <LifeBuoy />
                    <span>Suporte</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>

        {showComercialPro && (
          <>
            {/* Group - Comercial PRO */}
            <Collapsible
              open={resolvedOpenGroup === "comercialpro"}
              onOpenChange={(open) => setGroupOpen("comercialpro", open)}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    <span className="inline-flex items-center gap-2">
                      <FolderClosed className="size-4" />
                      Comercial PRO
                    </span>
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarMenu>
                    {isComercialPro ? (
                      <>
                        <SidebarMenuItem className="pl-4">
                          <SidebarMenuButton asChild isActive={pathname.includes('/comercial-pro/start')}>
                            <a href={`/${workspaceId}/comercial-pro/start`}>
                              <Rocket />
                              <span>Comece Aqui</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="pl-4">
                          <SidebarMenuButton asChild isActive={pathname.includes('/comercial-pro/action-plans')}>
                            <a href={`/${workspaceId}/comercial-pro/action-plans`}>
                              <ClipboardCheck />
                              <span>Planos de Ação</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="pl-4">
                          <SidebarMenuButton asChild isActive={pathname.includes('/comercial-pro/consultancies')}>
                            <a href={`/${workspaceId}/comercial-pro/consultancies`}>
                              <Video />
                              <span>Consultorias</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </>
                    ) : (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.includes('/comercial-pro/infos')}>
                          <a href={`/${workspaceId}/comercial-pro/infos`}>
                            <Info />
                            <span>Infos</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}

        {/* Group 1 - Skills */}
        <Collapsible
          open={resolvedOpenGroup === "skills"}
          onOpenChange={(open) => setGroupOpen("skills", open)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <span className="inline-flex items-center gap-2">
                  <FolderClosed className="size-4" />
                  Skills
                </span>
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname.includes('/job-titles')}>
                    <a href={`/${workspaceId}/job-titles`}>
                      <Briefcase />
                      <span>Cargos</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname.includes('/kpis')}>
                    <a href={`/${workspaceId}/kpis`}>
                      <BarChart3 />
                      <span>KPIs</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes('/assessments') && !pathname.includes('/assessments/def') && !pathname.includes('/assessments/seniority-v2')}
                  >
                    <a href={`/${workspaceId}/assessments`}>
                      <ClipboardList />
                      <span>Avaliações</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname.includes('/assessments/def')}>
                    <a href={`/${workspaceId}/assessments/def`}>
                      <Grid3x3 />
                      <span>Matriz DEF</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname.includes('/pdi')}>
                    <a href={`/${workspaceId}/pdi`}>
                      <GraduationCap />
                      <span>PDI</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {showSkillsV2 && (
          <>
            {/* Group - Skills V2 */}
            <Collapsible
              open={resolvedOpenGroup === "skillsv2"}
              onOpenChange={(open) => setGroupOpen("skillsv2", open)}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    <span className="inline-flex items-center gap-2">
                      <FolderClosed className="size-4" />
                      Skills V2
                    </span>
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarMenu>
                    <SidebarMenuItem className="pl-4">
                      <SidebarMenuButton asChild isActive={pathname.includes('/assessments/seniority-v2')}>
                        <a href={`/${workspaceId}/assessments/seniority-v2`}>
                          <Award />
                          <span>Senioridade</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="pl-4">
                      <SidebarMenuButton asChild isActive={pathname.includes('/performance')}>
                        <a href={`/${workspaceId}/performance`}>
                          <TrendingUp />
                          <span>Performance</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}

        {showEstrategia && (
          <>
            {/* Group 2 - Estratégia */}
            <Collapsible
              open={resolvedOpenGroup === "estrategia"}
              onOpenChange={(open) => setGroupOpen("estrategia", open)}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    <span className="inline-flex items-center gap-2">
                      <FolderClosed className="size-4" />
                      Estratégia
                    </span>
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarMenu>
                    <SidebarMenuItem className="pl-4">
                      <SidebarMenuButton asChild isActive={pathname.includes('/commercial-plan')}>
                        <a href={`/${workspaceId}/commercial-plan`}>
                          <BarChart3 />
                          <span>Plano Comercial</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="pl-4">
                      <SidebarMenuButton asChild isActive={pathname.includes('/teams')}>
                        <a href={`/${workspaceId}/teams`}>
                          <Users />
                          <span>Times e Squads</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}



        <SidebarGroup className="mt-auto">
          <SidebarSeparator className="mb-2" />
          <SidebarContent>
            <SidebarMenu className="flex flex-row items-center justify-between gap-1 px-2 py-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Configurações">
                  <a href={`/${workspaceId}/settings`} suppressHydrationWarning>
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Configurações</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <ModeToggle />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Convidar Membros">
                  <a href={`/${workspaceId}/settings?tab=users`} suppressHydrationWarning>
                    <UserPlus className="h-5 w-5" />
                    <span className="sr-only">Convidar</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {showSupportEntry ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Suporte">
                    <a href={`/${workspaceId}/support`} suppressHydrationWarning>
                      <LifeBuoy className="h-5 w-5" />
                      <span className="sr-only">Suporte</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="Alterar tema" suppressHydrationWarning>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alterar tema</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" suppressHydrationWarning>
        <DropdownMenuItem onClick={() => setTheme("light")} suppressHydrationWarning>
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} suppressHydrationWarning>
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} suppressHydrationWarning>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
