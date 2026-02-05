import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableCell, TableRow } from "@/components/ui/table"

interface LoadingStateProps {
  /**
   * Variant of loading state:
   * - 'default': Centered spinner with optional text
   * - 'inline': Small spinner for inline use (e.g., in buttons)
   * - 'table': Full table row with centered spinner
   * - 'page': Full page centered loading
   */
  variant?: 'default' | 'inline' | 'table' | 'page'
  /**
   * Optional loading text
   */
  text?: string
  /**
   * Number of columns for table variant
   */
  colSpan?: number
  /**
   * Additional class names
   */
  className?: string
  /**
   * Size of the spinner
   */
  size?: 'sm' | 'md' | 'lg'
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

/**
 * Reusable loading state component with multiple variants.
 * 
 * @example
 * ```tsx
 * <LoadingState />
 * <LoadingState text="Carregando..." />
 * <LoadingState variant="table" colSpan={5} />
 * <LoadingState variant="inline" size="sm" />
 * ```
 */
export function LoadingState({ 
  variant = 'default', 
  text,
  colSpan = 5,
  className,
  size = 'md'
}: LoadingStateProps) {
  const spinnerClass = spinnerSizes[size]

  if (variant === 'inline') {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Loader2 className={cn(spinnerClass, "animate-spin")} />
        {text && <span>{text}</span>}
      </span>
    )
  }

  if (variant === 'table') {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className={cn("h-32 text-center", className)}>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className={cn(spinnerClass, "animate-spin text-muted-foreground")} />
            {text && <span className="text-muted-foreground">{text}</span>}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (variant === 'page') {
    return (
      <div className={cn("flex h-[calc(100vh-200px)] items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn(spinnerSizes.lg, "animate-spin text-muted-foreground")} />
          {text && <span className="text-muted-foreground">{text}</span>}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("flex items-center justify-center py-8 gap-2", className)}>
      <Loader2 className={cn(spinnerClass, "animate-spin text-muted-foreground")} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  )
}

/**
 * Loading spinner for use inside buttons
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", className)} />
}
