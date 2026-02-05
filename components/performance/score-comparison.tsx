'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Trophy } from 'lucide-react'
import { getRankPosition } from '@/lib/performance-utils'

export interface ScoreComparisonProps {
  userScore: number
  teamAverage: number
  teamMax: number
  teamMin?: number
  allScores?: number[] // Para calcular percentil
  userName?: string
}

export function ScoreComparison({
  userScore,
  teamAverage,
  teamMax,
  teamMin,
  allScores = [],
  userName = 'Você'
}: ScoreComparisonProps) {
  const rankData = allScores.length > 0 
    ? getRankPosition(userScore, allScores)
    : null
  
  const percentageOfMax = (userScore / 100) * 100
  const isAboveAverage = userScore > teamAverage
  const difference = userScore - teamAverage
  
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Comparação com o Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seu Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Seu Resultado</span>
            <span className="text-2xl font-bold text-primary">{userScore} pts</span>
          </div>
          <Progress value={percentageOfMax} className="h-2" />
        </div>
        
        {/* Comparação */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              Média do Time
            </div>
            <div className="text-lg font-semibold">{teamAverage.toFixed(1)} pts</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3 h-3" />
              Top Performer
            </div>
            <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {teamMax.toFixed(1)} pts
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2 pt-2">
          {isAboveAverage ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              {difference > 0 ? '+' : ''}{difference.toFixed(1)} pts acima da média
            </Badge>
          ) : (
            <Badge variant="secondary">
              {difference.toFixed(1)} pts da média
            </Badge>
          )}
          
          {rankData && (
            <Badge variant="outline">
              #{rankData.position} de {rankData.total}
            </Badge>
          )}
        </div>
        
        {/* Percentil */}
        {rankData && rankData.percentile > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            Você está no <span className="font-semibold text-foreground">Top {100 - rankData.percentile}%</span> do time
          </div>
        )}
      </CardContent>
    </Card>
  )
}
