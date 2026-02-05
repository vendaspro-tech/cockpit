'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  avatar?: string
  trend?: number // Variação vs período anterior
  badge?: 'top' | 'rising' | 'attention'
}

export interface LeaderboardProps {
  data: LeaderboardEntry[]
  limit?: number
  showBottomPerformers?: boolean
  title?: string
  className?: string
}

export function Leaderboard({
  data,
  limit = 5,
  showBottomPerformers = false,
  title = "Ranking de Performance",
  className
}: LeaderboardProps) {
  const topPerformers = data.slice(0, limit)
  const bottomPerformers = showBottomPerformers 
    ? data.slice(-Math.min(3, data.length))
    : []
  
  const getBadgeIcon = (badge?: 'top' | 'rising' | 'attention') => {
    switch (badge) {
      case 'top':
        return <Trophy className="w-3 h-3" />
      case 'rising':
        return <TrendingUp className="w-3 h-3" />
      case 'attention':
        return <AlertTriangle className="w-3 h-3" />
      default:
        return null
    }
  }
  
  const getBadgeColor = (badge?: 'top' | 'rising' | 'attention') => {
    switch (badge) {
      case 'top':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'rising':
        return 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'attention':
        return 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }
  
  const getPositionBadge = (position: number) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `#${position}`
  }
  
  const renderEntry = (entry: LeaderboardEntry, position: number) => {
    const initials = entry.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return (
      <div
        key={entry.id}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg transition-colors",
          position <= 3 && "bg-muted/50",
          "hover:bg-muted"
        )}
      >
        {/* Position */}
        <div className="w-8 text-center font-semibold text-sm">
          {getPositionBadge(position)}
        </div>
        
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(
            "text-xs font-medium",
            position === 1 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
            position === 2 && "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
            position === 3 && "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Name & Badge */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{entry.name}</div>
          {entry.badge && (
            <Badge className={cn("text-xs mt-1", getBadgeColor(entry.badge))}>
              {getBadgeIcon(entry.badge)}
              <span className="ml-1">
                {entry.badge === 'top' && 'Top Performer'}
                {entry.badge === 'rising' && 'Em Crescimento'}
                {entry.badge === 'attention' && 'Atenção'}
              </span>
            </Badge>
          )}
        </div>
        
        {/* Score & Trend */}
        <div className="text-right">
          <div className="font-bold text-lg">{entry.score.toFixed(1)}</div>
          {entry.trend !== undefined && (
            <div className={cn(
              "text-xs",
              entry.trend > 0 && "text-green-600 dark:text-green-400",
              entry.trend < 0 && "text-red-600 dark:text-red-400",
              entry.trend === 0 && "text-muted-foreground"
            )}>
              {entry.trend > 0 && '↑'}
              {entry.trend < 0 && '↓'}
              {entry.trend === 0 && '→'}
              {entry.trend !== 0 && ` ${Math.abs(entry.trend).toFixed(1)}pts`}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Top Performers */}
        <div className="space-y-2">
          {topPerformers.map((entry, index) => renderEntry(entry, index + 1))}
        </div>
        
        {/* Bottom Performers (optional) */}
        {showBottomPerformers && bottomPerformers.length > 0 && (
          <>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Necessitam Atenção:
              </p>
            </div>
            <div className="space-y-2">
              {bottomPerformers.map((entry, index) => 
                renderEntry(entry, data.length - bottomPerformers.length + index + 1)
              )}
            </div>
          </>
        )}
        
        {data.length > limit && !showBottomPerformers && (
          <div className="text-center pt-2 text-sm text-muted-foreground">
            +{data.length - limit} outros vendedores
          </div>
        )}
      </CardContent>
    </Card>
  )
}
