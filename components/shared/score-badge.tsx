'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScoreBadgeProps {
  /**
   * The score value to display
   */
  score: number
  /**
   * Maximum possible score (default: 100)
   */
  maxScore?: number
  /**
   * Whether to show the percentage in addition to the score
   */
  showPercentage?: boolean
  /**
   * Size of the badge
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Additional class names
   */
  className?: string
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-2.5 py-1',
}

/**
 * Get color classes based on score percentage.
 * Green: >=80%, Yellow: >=60%, Orange: >=40%, Red: <40%
 */
function getScoreColors(percentage: number): string {
  if (percentage >= 80) {
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900'
  }
  if (percentage >= 60) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900'
  }
  if (percentage >= 40) {
    return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900'
  }
  return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
}

/**
 * Reusable score badge component for displaying assessment scores.
 * Automatically applies color coding based on the score percentage.
 * 
 * @example
 * ```tsx
 * <ScoreBadge score={85} maxScore={100} />
 * <ScoreBadge score={7} maxScore={10} showPercentage />
 * <ScoreBadge score={42} size="lg" />
 * ```
 */
export function ScoreBadge({ 
  score, 
  maxScore = 100, 
  showPercentage = false,
  size = 'md',
  className 
}: ScoreBadgeProps) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
  const colorClasses = getScoreColors(percentage)

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border',
        colorClasses,
        sizeClasses[size],
        className
      )}
    >
      {score}{maxScore !== 100 && `/${maxScore}`}
      {showPercentage && ` (${Math.round(percentage)}%)`}
    </Badge>
  )
}

/**
 * Get score color class for use outside of badge (e.g., progress bars)
 */
export function getScoreColorClass(score: number, maxScore: number = 100): string {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
  return getScoreColors(percentage)
}
