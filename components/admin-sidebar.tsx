"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  Shield,
  BarChart,
  MessageSquare,
  Command,
  Bell,
  Bot,
  Blocks,
  Calendar,
  Settings,
  ChevronDown,
  Sparkles,
  Briefcase,
  ClipboardList,
  Rocket,
  FolderClosed,
  Activity,
  Palette,
  Award,
  Briefcase as BriefcaseIcon,
  LifeBuoy,
  Sun,
  Moon,
} from "lucide-react"

import Link from "next/link"
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
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function AdminSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const pathDefaultGroup = React.useMemo(() => {
    if (
      pathname === '/admin' ||
      pathname.includes('/admin/workspaces') ||
      pathname.includes('/admin/subscriptions') ||
      pathname.includes('/admin/users') ||
      pathname.includes('/admin/plans') ||
      pathname.includes('/admin/avaliacoes-pdis') ||
      pathname.includes('/admin/feedback') ||
      pathname.includes('/admin/bugs')
    ) return 'gestao'
    if (pathname.includes('/admin/comercial-pro')) return 'comercialpro'
    if (pathname.includes('/admin/kpis') || pathname.includes('/admin/roles') || pathname.includes('/admin/scoring-rules') || pathname.includes('/admin/job-titles') || pathname.includes('/admin/competency-frameworks') || pathname.includes('/admin/test-structures')) return 'config'
    if (pathname.includes('/admin/alerts') || pathname.includes('/admin/calendar')) return 'comunicacao'
    if (
      pathname.includes('/admin/integrations') ||
      pathname.includes('/admin/agents') ||
      pathname.includes('/admin/tracking') ||
      pathname.includes('/admin/design-system')
    ) return 'avancado'
    return null
  }, [pathname])
  const [userOpenGroup, setUserOpenGroup] = React.useState<string | null | undefined>(undefined)
  const openGroup = userOpenGroup === undefined ? pathDefaultGroup : userOpenGroup

  const toggleGroup = (group: string) => {
    setUserOpenGroup((prev) => (prev === group ? null : group))
  }

  return (
    <Sidebar variant="inset" className={cn("text-[14px]", className)} {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Command className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-xs leading-tight">
            <span className="truncate font-semibold">Cockpit Admin</span>
            <span className="truncate text-xs">System Owner</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Collapsible open={openGroup === "gestao"} onOpenChange={() => toggleGroup("gestao")} className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <span className="inline-flex items-center gap-2">
                  <FolderClosed className="size-4" />
                  Gestão
                </span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu className="pl-6">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === '/admin' ||
                      pathname.includes('/admin/workspaces') ||
                      pathname.includes('/admin/subscriptions')
                    }
                  >
                    <Link href="/admin/workspaces">
                      <LayoutDashboard />
                      <span>Workspaces &amp; Assinaturas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/users')}>
                    <Link href="/admin/users">
                      <Users />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/plans')}>
                    <Link href="/admin/plans">
                      <FileText />
                      <span>Planos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/avaliacoes-pdis')}>
                    <Link href="/admin/avaliacoes-pdis">
                      <Target />
                      <span>Avaliações e PDIs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/bugs')}>
                    <Link href="/admin/bugs">
                      <LifeBuoy />
                      <span>Bugs Reportados</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/feedback')}>
                    <Link href="/admin/feedback">
                      <MessageSquare />
                      <span>Feedback da Plataforma</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openGroup === "comercialpro"} onOpenChange={() => toggleGroup("comercialpro")} className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <span className="inline-flex items-center gap-2">
                  <FolderClosed className="size-4" />
                  Comercial PRO
                </span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu className="pl-6">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/admin/comercial-pro'}>
                    <Link href="/admin/comercial-pro">
                      <Sparkles />
                      <span>Visão Geral</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/comercial-pro/consultorias')}>
                    <Link href="/admin/comercial-pro/consultorias">
                      <Briefcase />
                      <span>Consultorias</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/comercial-pro/planos-de-acao')}>
                    <Link href="/admin/comercial-pro/planos-de-acao">
                      <ClipboardList />
                      <span>Planos de Ação</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/comercial-pro/onboarding')}>
                    <Link href="/admin/comercial-pro/onboarding">
                      <Rocket />
                      <span>Onboarding</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openGroup === "config"} onOpenChange={() => toggleGroup("config")} className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <span className="inline-flex items-center gap-2">
                  <FolderClosed className="size-4" />
                  Configurações Globais
                </span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu className="pl-6">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/kpis')}>
                    <Link href="/admin/kpis">
                      <BarChart />
                      <span>KPIs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/job-titles')}>
                    <Link href="/admin/job-titles">
                      <BriefcaseIcon />
                      <span>Cargos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/competency-frameworks')}>
                    <Link href="/admin/competency-frameworks">
                      <Award />
                      <span>Frameworks de Competências</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/test-structures')}>
                    <Link href="/admin/test-structures">
                      <ClipboardList />
                      <span>Estruturas de Teste</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/roles')}>
                    <Link href="/admin/roles">
                      <Shield />
                      <span>Níveis de Acesso</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/scoring-rules')}>
                    <Link href="/admin/scoring-rules">
                      <Settings />
                      <span>Setup Avaliações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openGroup === "comunicacao"} onOpenChange={() => toggleGroup("comunicacao")} className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <span className="inline-flex items-center gap-2">
                  <FolderClosed className="size-4" />
                  Comunicação
                </span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu className="pl-6">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/alerts')}>
                    <Link href="/admin/alerts">
                      <Bell />
                      <span>Alertas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/calendar')}>
                    <Link href="/admin/calendar">
                      <Calendar />
                      <span>Calendário</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openGroup === "avancado"} onOpenChange={() => toggleGroup("avancado")} className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <span className="inline-flex items-center gap-2">
                  <FolderClosed className="size-4" />
                  Avançado
                </span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu className="pl-6">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/integrations')}>
                    <Link href="/admin/integrations">
                      <Blocks />
                      <span>Integrações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/agents')}>
                    <Link href="/admin/agents">
                      <Bot />
                      <span>Agentes de IA</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/tracking')}>
                    <Link href="/admin/tracking">
                      <Activity />
                      <span>Tracking</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes('/admin/design-system')}>
                    <Link href="/admin/design-system">
                      <Palette />
                      <span>Design System</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarContent>
            <SidebarMenu className="flex-row">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Configurações">
                  <Link href="/admin/settings">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Suporte">
                  <Link href="/admin/support">
                    <LifeBuoy className="h-5 w-5" />
                    <span className="sr-only">Suporte</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ModeToggle />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </SidebarGroup>
      </SidebarFooter>
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
