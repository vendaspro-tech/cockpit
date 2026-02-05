'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getScoreBadgeClasses, formatTrend } from '@/lib/performance-utils'
import { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: number | string
  icon?: LucideIcon
  trend?: {
    current: number
    previous: number
  }
  description?: string
  status?: 'success' | 'warning' | 'danger'
  suffix?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  status,
  suffix,
  className
}: StatCardProps) {
  const trendData = trend ? formatTrend(trend.current, trend.previous) : null
  
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-foreground">
            {value}
            {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
          </div>
          {status && (
            <span className={getScoreBadgeClasses(status)}>
              {status === 'success' && '🟢'}
              {status === 'warning' && '🟡'}
              {status === 'danger' && '🔴'}
            </span>
          )}
        </div>
        
        {trendData && (
          <p className={cn(
            "text-xs mt-1",
            trendData.direction === 'up' && "text-green-600 dark:text-green-400",
            trendData.direction === 'down' && "text-red-600 dark:text-red-400",
            trendData.direction ==='neutral' && "text-muted-foreground"
          )}>
            {trendData.value} vs período anterior
          </p>
        )}
        
        {description && !trendData && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
