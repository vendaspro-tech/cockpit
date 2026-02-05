import { LucideIcon, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableCell, TableRow } from "@/components/ui/table"
import { H4, Muted } from "@/components/ui/typography"
import { ReactNode } from "react"

interface EmptyStateProps {
  /**
   * Icon to display
   */
  icon?: LucideIcon
  /**
   * Title text
   */
  title?: string
  /**
   * Description text
   */
  description?: string
  /**
   * Optional action button or element
   */
  action?: ReactNode
  /**
   * Additional class names
   */
  className?: string
}

/**
 * Reusable empty state component for when there's no data to display.
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   icon={FileText}
 *   title="Nenhum documento"
 *   description="Comece criando um novo documento."
 *   action={<Button>Criar Documento</Button>}
 * />
 * ```
 */
export function EmptyState({ 
  icon: Icon = Inbox,
  title = "Nenhum item encontrado",
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <H4 className="mb-1">{title}</H4>
      {description && (
        <Muted className="max-w-sm mb-4">{description}</Muted>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

interface TableEmptyStateProps {
  /**
   * Number of columns to span
   */
  colSpan: number
  /**
   * Message to display
   */
  message?: string
  /**
   * Additional class names
   */
  className?: string
}

/**
 * Empty state for use inside tables.
 * 
 * @example
 * ```tsx
 * <TableBody>
 *   {items.length === 0 ? (
 *     <TableEmptyState colSpan={5} message="Nenhum resultado encontrado." />
 *   ) : (
 *     items.map(...)
 *   )}
 * </TableBody>
 * ```
 */
export function TableEmptyState({ 
  colSpan, 
  message = "Nenhum item encontrado.",
  className 
}: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell 
        colSpan={colSpan} 
        className={cn("h-24 text-center text-muted-foreground", className)}
      >
        {message}
      </TableCell>
    </TableRow>
  )
}
