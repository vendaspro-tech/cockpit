import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

interface StatusConfig {
  label: string
  variant: BadgeVariant
  className?: string
}

interface StatusBadgeProps {
  status: string
  labels: Record<string, StatusConfig>
  fallbackLabel?: string
  className?: string
}

/**
 * Reusable status badge component with configurable labels and variants.
 * 
 * @example
 * ```tsx
 * const STATUS_CONFIG = {
 *   completed: { label: 'Concluído', variant: 'default', className: 'bg-green-100 text-green-700' },
 *   pending: { label: 'Pendente', variant: 'outline' },
 *   draft: { label: 'Rascunho', variant: 'secondary' }
 * }
 * 
 * <StatusBadge status={item.status} labels={STATUS_CONFIG} />
 * ```
 */
export function StatusBadge({ 
  status, 
  labels, 
  fallbackLabel,
  className 
}: StatusBadgeProps) {
  const config = labels[status]
  
  return (
    <Badge 
      variant={config?.variant || 'default'}
      className={cn(config?.className, className)}
    >
      {config?.label || fallbackLabel || status}
    </Badge>
  )
}

// ============================================
// Pre-configured Status Badges for specific domains
// ============================================

// Assessment status configuration
export const ASSESSMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  pending_evaluation: { label: 'Aguardando', variant: 'outline' },
  completed: { label: 'Concluído', variant: 'outline', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900' }
}

interface AssessmentStatusBadgeProps {
  status: string
  className?: string
}

export function AssessmentStatusBadge({ status, className }: AssessmentStatusBadgeProps) {
  return <StatusBadge status={status} labels={ASSESSMENT_STATUS_CONFIG} className={className} />
}

// PDI status configuration
export const PDI_STATUS_CONFIG: Record<string, StatusConfig> = {
  not_started: { label: 'Não Iniciado', variant: 'secondary' },
  in_progress: { label: 'Em Progresso', variant: 'outline', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900' },
  completed: { label: 'Concluído', variant: 'outline', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900' },
  cancelled: { label: 'Cancelado', variant: 'destructive' }
}

interface PdiStatusBadgeProps {
  status: string
  className?: string
}

export function PdiStatusBadge({ status, className }: PdiStatusBadgeProps) {
  return <StatusBadge status={status} labels={PDI_STATUS_CONFIG} className={className} />
}

// Active/Inactive status configuration
export const ACTIVE_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { label: 'Ativo', variant: 'default' },
  inactive: { label: 'Inativo', variant: 'secondary' }
}

interface ActiveStatusBadgeProps {
  active: boolean
  className?: string
}

export function ActiveStatusBadge({ active, className }: ActiveStatusBadgeProps) {
  return <StatusBadge status={active ? 'active' : 'inactive'} labels={ACTIVE_STATUS_CONFIG} className={className} />
}
