'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getScoreColor } from '@/lib/performance-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BarChart3 } from 'lucide-react'

export interface CompetencyHeatMapProps {
  data: Array<{
    userId: string
    userName: string
    scores: Record<string, number> // competência: score
  }>
  competencies: string[]
  title?: string
  className?: string
}

export function CompetencyHeatMap({
  data,
  competencies,
  title = "Mapa de Competências do Time",
  className
}: CompetencyHeatMapProps) {
  const getCellColor = (score: number): string => {
    const status = getScoreColor(score)
    
    const colors = {
      success: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
      warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      danger: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
    }
    
    return colors[status]
  }
  
  const getEmoji = (score: number): string => {
    if (score >= 80) return '🟢'
    if (score >= 60) return '🟡'
    return '🔴'
  }
  
  if (data.length === 0 || competencies.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Dados insuficientes para gerar o mapa de competências
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <span>🟢 Excele (≥80)</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🟡 Adequado (60-79)</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔴 Atenção (&lt;60)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium text-sm sticky left-0 bg-background z-10">
                  Vendedor
                </th>
                {competencies.map((comp, idx) => (
                  <th 
                    key={idx}
                    className="text-center p-2 font-medium text-xs min-w-[80px]"
                  >
                    <div className="truncate" title={comp}>
                      {comp.length > 10 ? `${comp.slice(0, 10)}...` : comp}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((user, userIdx) => (
                <tr 
                  key={user.userId}
                  className={cn(
                    "border-b hover:bg-muted/50 transition-colors",
                    userIdx % 2 === 0 && "bg-muted/20"
                  )}
                >
                  <td className="p-2 font-medium text-sm sticky left-0 bg-background">
                    <div className="truncate max-w-[150px]" title={user.userName}>
                      {user.userName}
                    </div>
                  </td>
                  {competencies.map((comp, compIdx) => {
                    const score = user.scores[comp]
                    
                    if (score === undefined || score === null) {
                      return (
                        <td key={compIdx} className="text-center p-2">
                          <div className="text-muted-foreground text-xs">-</div>
                        </td>
                      )
                    }
                    
                    return (
                      <TooltipProvider key={compIdx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <td className="text-center p-1">
                              <div className={cn(
                                "rounded-md py-2 px-1 cursor-pointer transition-all",
                                "flex items-center justify-center gap-1",
                                getCellColor(score)
                              )}>
                                <span className="text-lg">{getEmoji(score)}</span>
                                <span className="text-xs font-medium hidden sm:inline">
                                  {score.toFixed(0)}
                                </span>
                              </div>
                            </td>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-xs text-muted-foreground">{comp}</p>
                            <p className="text-sm font-bold mt-1">{score.toFixed(1)} pts</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Insights */}
        {data.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Dica:</span> Clique nas células para ver detalhes. 
              Identifique padrões e áreas que necessitam treinamento em equipe.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
