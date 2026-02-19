"use client"

import React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface DashboardBreadcrumbProps {
  workspaceName: string
  workspaceId: string
}

const routeNameMap: Record<string, string> = {
  'overview': 'Dashboard',
  'assessments': 'Avaliações',
  'pdi': 'PDIs',
  'teams': 'Times',
  'goals': 'Metas',
  'products': 'Produtos',
  'settings': 'Configurações',
  'kpis': 'KPIs',
  'def': 'Matriz DEF',
  'disc': 'Perfil DISC',
  'notifications': 'Notificações',
  'copiloto-lider': 'Copiloto do Líder',
  'diagnosis': 'Diagnóstico',
  'otes': 'OTEs',
  'calendar': 'Agenda',
  'icp': 'ICPs',
  'comercial-pro': 'Comercial Pro',
  'action-plans': 'Planos de Ação',
  'consultancies': 'Consultorias',
  'start': 'Início',
  'infos': 'Informações',
  'billing': 'Cobrança',
  'history': 'Histórico',
  'new': 'Novo',
  'admin': 'Admin',
  'seniority_seller': 'Senioridade (Vendedor)',
  'seniority_leader': 'Senioridade (Líder)',
  'def_method': 'Matriz DEF',
  'leadership_style': 'Estilo de Liderança',
  'values_8d': 'Valores 8D'
}

export function DashboardBreadcrumb({ workspaceName, workspaceId }: DashboardBreadcrumbProps) {
  const pathname = usePathname()
  
  // Remove workspaceId from path to get relative segments
  // Path format: /[workspaceId]/[segment]/...
  // We want to ignore the first segment (workspaceId) for the loop, 
  // but we use it for constructing hrefs.
  const segments = pathname.split('/').filter(Boolean)
  const pathSegments = segments.slice(1) // Skip workspaceId
  const assessmentBaseSegments = new Set(['dashboard', 'def', 'disc'])

  // Helper to get readable name
  const getName = (segment: string, index: number, allSegments: string[]) => {
    // Special case for specific IDs or sub-paths could go here
    // For now, just use the map or capitalize
    if (routeNameMap[segment]) return routeNameMap[segment]
    
    // If it looks like an ID (long string/UUID), maybe show "Detalhes" or something generic
    // unless we have specific logic. For now, let's just try to be smart.
    if (segment.length > 20) return 'Detalhes'
    
    // Fallback: capitalize
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href={`/${workspaceId}/overview`}>
            {workspaceName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1
          let href = `/${workspaceId}/${pathSegments.slice(0, index + 1).join('/')}`
          if (segment === 'comercial-pro') {
            href = `/${workspaceId}/comercial-pro/start`
          } else if (pathSegments[index - 1] === 'assessments' && !assessmentBaseSegments.has(segment)) {
            href = `/${workspaceId}/assessments/${segment}/history`
          }
          const name = getName(segment, index, pathSegments)

          // Skip if name is 'Detalhes' and it's the last one? Or maybe just show it.
          // Also skip 'disc' if it's just an intermediate path without a page? 
          // Actually /assessments/disc might not be a valid page if it redirects.
          // But let's keep it simple for now.

          return (
            <React.Fragment key={`${segment}-${index}`}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>
                    {name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
