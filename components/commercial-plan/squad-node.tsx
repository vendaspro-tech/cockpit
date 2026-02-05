'use client'

import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Users, Package, TrendingUp, Link, ChevronDown, ChevronRight } from 'lucide-react'
import type { PlanSquadSimple } from '@/app/actions/commercial-plans-squads'

interface SquadNodeData extends PlanSquadSimple {
  onViewKPIs: (squadId: string) => void
  onLinkProducts: (squadId: string) => void
  onAddMembers?: (squadId: string) => void
  showMembers?: boolean
}

function SquadNodeComponent({ data }: NodeProps<SquadNodeData>) {
  const [expanded, setExpanded] = useState(false)
  const hasProducts = data.products && data.products.length > 0
  const hasMembers = data.members && data.members.length > 0
  const sharePercentage = (data.share_calculated * 100).toFixed(0)

  return (
    <div className="squad-flow-node">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white"
      />

      <Card className="w-[280px] shadow-md hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-400 p-0">
        {/* Header with squad color - NO GAP */}
        <div 
          className="px-3 py-2 flex items-center justify-between rounded-t-lg"
          style={{ backgroundColor: data.color }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {data.squad_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-xs leading-tight truncate">
                {data.squad_name}
              </h3>
              {data.leader_name && (
                <div className="flex items-center gap-1 text-white/90 text-[10px] mt-0.5">
                  <Crown className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{data.leader_name}</span>
                </div>
              )}
            </div>
          </div>

          <Badge 
            variant={hasProducts ? "default" : "secondary"}
            className="font-bold text-xs bg-white/90 text-gray-900 flex-shrink-0 ml-1"
          >
            {sharePercentage}%
          </Badge>
        </div>

        {/* Stats Section - Compact */}
        <div className="p-2.5 space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span><strong className="text-foreground">{data.member_count}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-3 w-3" />
              <span><strong className="text-foreground">{data.products?.length || 0}</strong></span>
            </div>
          </div>

          {/* Collapsible Product List */}
          {hasProducts && (
            <div className="bg-muted/30 rounded border border-muted">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span>Produtos ({data.products.length})</span>
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              
              {expanded && (
                <div className="px-2 pb-1 space-y-0.5 border-t border-muted/50">
                  {data.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-[10px] py-0.5">
                      <span className="truncate flex-1 font-medium">{product.name}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 ml-1">
                        {(product.share_target * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasProducts && (
            <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
              <p className="text-[10px] text-yellow-800 text-center">
                Sem produtos
              </p>
            </div>
          )}

          {/* Member Expansion Button */}
          {data.onAddMembers && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                data.onAddMembers?.(data.squad_id)
              }}
              className="w-full px-2 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 rounded text-[11px] font-medium text-green-700 dark:text-green-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Adicionar Membros ({data.member_count})</span>
            </button>
          )}

          {/* Action Buttons - Compact */}
          <div className="flex gap-1.5 pt-1 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[10px] px-2"
              onClick={(e) => {
                e.stopPropagation()
                data.onLinkProducts(data.squad_id)
              }}
            >
              <Link className="h-2.5 w-2.5 mr-1" />
              Produtos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[10px] px-2"
              onClick={(e) => {
                e.stopPropagation()
                data.onViewKPIs(data.squad_id)
              }}
              disabled={!hasProducts}
            >
              <TrendingUp className="h-2.5 w-2.5 mr-1" />
              KPIs
            </Button>
          </div>
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  )
}

export const SquadNode = memo(SquadNodeComponent)
