'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Edit, ChevronDown, ChevronRight } from 'lucide-react'
import { Squad } from '@/app/actions/squads'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface SquadNodeData {
  squad: Squad
  onEdit: (squad: Squad) => void
  onToggleCollapse: (squadId: string) => void
  isCollapsed: boolean
  childCount: number
  leaderTitle?: string | null
}

export const SquadNode = memo(({ data }: NodeProps<SquadNodeData>) => {
  const { squad, onEdit, onToggleCollapse, isCollapsed, childCount, leaderTitle } = data

  const members = squad.members || []
  const leaderId = squad.leader?.id
  const memberCount = members.filter((member) => member.user?.id !== leaderId).length
  const leaderInitials = squad.leader?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SQ'

  return (
    <div className="nodrag nopan">
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#64748b' }}
      />

      <Card
        className="w-[240px] shadow-lg hover:shadow-xl transition-shadow border-2 cursor-pointer"
        style={{ borderColor: squad.color }}
        onClick={() => onEdit(squad)}
      >
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: squad.color }}
              />
              <h3 className="font-semibold truncate" title={squad.name}>
                {squad.name}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {childCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 nodrag nopan"
                  type="button"
                  onPointerDown={(event) => {
                    event.stopPropagation()
                  }}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onToggleCollapse(squad.id)
                  }}
                  aria-label={isCollapsed ? 'Expandir squad' : 'Recolher squad'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 nodrag nopan"
                type="button"
                onPointerDown={(event) => {
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onEdit(squad)
                }}
                aria-label="Editar squad"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {squad.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {squad.description}
            </p>
          )}

          {/* Leader */}
          {squad.leader && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10">
                  {leaderInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {squad.leader.full_name || squad.leader.email}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    Líder
                  </Badge>
                  {leaderTitle && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {leaderTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members count */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#64748b' }}
      />
    </div>
  )
})

SquadNode.displayName = 'SquadNode'
