import { cn } from "@/lib/utils"

/**
 * Determina a cor do badge baseado no score
 */
export function getScoreColor(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

/**
 * Retorna classes CSS para o badge de status
 */
export function getScoreBadgeClasses(status: 'success' | 'warning' | 'danger'): string {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  
  const statusClasses = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
  }
  
  return cn(baseClasses, statusClasses[status])
}

/**
 * Calcula o percentil de um valor em um dataset
 */
export function calculatePercentile(value: number, dataset: number[]): number {
  if (dataset.length === 0) return 0
  
  const sortedData = [...dataset].sort((a, b) => a - b)
  const index = sortedData.findIndex(v => v >= value)
  
  if (index === -1) return 100
  if (index === 0) return 0
  
  return Math.round((index / sortedData.length) * 100)
}

/**
 * Formata a tendência comparando valor atual com anterior
 */
export function formatTrend(current: number, previous: number): {
  direction: 'up' | 'down' | 'neutral'
  value: string
  icon: string
} {
  const diff = current - previous
  const percentChange = previous !== 0 ? (diff / previous) * 100 : 0
  
  if (Math.abs(percentChange) < 1) {
    return {
      direction: 'neutral',
      value: '→ 0%',
      icon: '→'
    }
  }
  
  return {
    direction: diff > 0 ? 'up' : 'down',
    value: `${diff > 0 ? '↑' : '↓'} ${Math.abs(percentChange).toFixed(1)}%`,
    icon: diff > 0 ? '↑' : '↓'
  }
}

/**
 * Determina o badge de performance baseado no score e média do time
 */
export function getPerformanceBadge(
  score: number,
  teamAverage: number,
  teamMax: number
): 'top' | 'rising' | 'attention' | null {
  // Top performer (acima de 90% do máximo do time)
  if (score >= teamMax * 0.9) return 'top'
  
  // Precisa de atenção (abaixo de 60)
  if (score < 60) return 'attention'
  
  // Acima da média
  if (score > teamAverage * 1.1) return 'rising'
  
  return null
}

/**
 * Formata um score para exibição
 */
export function formatScore(score: number, decimals: number = 0): string {
  return score.toFixed(decimals)
}

/**
 * Calcula a posição no ranking
 */
export function getRankPosition(score: number, allScores: number[]): {
  position: number
  total: number
  percentile: number
} {
  const sortedScores = [...allScores].sort((a, b) => b - a)
  const position = sortedScores.findIndex(s => s === score) + 1
  const percentile = calculatePercentile(score, allScores)
  
  return {
    position,
    total: allScores.length,
    percentile
  }
}

/**
 * Retorna emoji/ícone baseado na competência
 */
export function getCompetencyIcon(competency: string): string {
  const icons: Record<string, string> = {
    'prospecção': '🎯',
    'qualificação': '🔍',
    'negociação': '🤝',
    'objeções': '💬',
    'follow-up': '📞',
    'fechamento': '✅',
    'default': '📊'
  }
  
  const key = competency.toLowerCase()
  return icons[key] || icons['default']
}
