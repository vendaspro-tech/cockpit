'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'

interface WorkspaceNodeData {
  name: string
  squadsCount: number
  membersCount: number
}

export const WorkspaceNode = memo(({ data }: NodeProps<WorkspaceNodeData>) => {
  return (
    <>
      <Card className="w-[260px] border-2 shadow-md">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Workspace</p>
              <h3 className="font-semibold truncate" title={data.name}>
                {data.name}
              </h3>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {data.squadsCount} {data.squadsCount === 1 ? 'squad' : 'squads'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {data.membersCount} {data.membersCount === 1 ? 'membro' : 'membros'}
            </Badge>
          </div>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} style={{ background: '#64748b' }} />
    </>
  )
})

WorkspaceNode.displayName = 'WorkspaceNode'
