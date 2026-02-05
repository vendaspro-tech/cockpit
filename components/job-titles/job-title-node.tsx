import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Award, Building2 } from 'lucide-react'
import type { JobTitleNodeData } from '@/lib/types/job-titles'

export const JobTitleNode = memo(({ data, selected }: NodeProps<JobTitleNodeData>) => {
  const { name, sector, allows_seniority, hierarchy_level } = data

  // Cores por nível hierárquico
  const levelColors = {
    0: 'border-purple-500 bg-purple-500/10',
    1: 'border-blue-500 bg-blue-500/10',
    2: 'border-green-500 bg-green-500/10',
    3: 'border-orange-500 bg-orange-500/10'
  }

  const levelBadgeColors = {
    0: 'bg-purple-500 text-white',
    1: 'bg-blue-500 text-white',
    2: 'bg-green-500 text-white',
    3: 'bg-orange-500 text-white'
  }

  const borderColor = levelColors[hierarchy_level as keyof typeof levelColors] || 'border-gray-500 bg-gray-500/10'
  const badgeColor = levelBadgeColors[hierarchy_level as keyof typeof levelBadgeColors] || 'bg-gray-500 text-white'

  return (
    <div className="relative">
      {/* Input Handle (top) */}
      {hierarchy_level > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-border"
        />
      )}

      {/* Card */}
      <Card
        className={`
          w-[220px] transition-all duration-200 hover:shadow-lg
          ${borderColor} ${selected ? 'ring-2 ring-primary' : ''}
        `}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Briefcase className="w-4 h-4 shrink-0 text-muted-foreground" />
                <h4 className="font-semibold text-sm truncate">
                  {name}
                </h4>
              </div>
              {allows_seniority && (
                <span title="Permite avaliação de senioridade">
                  <Award className="w-4 h-4 shrink-0 text-primary" />
                </span>
              )}
            </div>

            {/* Sector */}
            {sector && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{sector}</span>
              </div>
            )}

            {/* Footer com indicador visual */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className={`w-2 h-2 rounded-full ${badgeColor}`} />
              <span className="text-xs text-muted-foreground">
                {getLevelLabel(hierarchy_level)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Handle (bottom) */}
      {hierarchy_level < 3 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-border"
        />
      )}
    </div>
  )
})

JobTitleNode.displayName = 'JobTitleNode'

function getLevelLabel(level: number): string {
  const labels = {
    0: 'Estratégico',
    1: 'Tático',
    2: 'Operacional',
    3: 'Execução'
  }
  return labels[level as keyof typeof labels] || 'Não definido'
}
