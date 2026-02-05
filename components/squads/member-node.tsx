'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MemberNodeData {
  name: string
  email?: string | null
  isLeader?: boolean
  squadId?: string
}

export const MemberNode = memo(({ data }: NodeProps<MemberNodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#94a3b8' }} />
      <Card className="w-[200px] border shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{data.name}</p>
              {data.email && (
                <p className="text-[10px] text-muted-foreground truncate">{data.email}</p>
              )}
            </div>
            {data.isLeader && (
              <Badge variant="secondary" className="text-[10px]">
                Líder
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} style={{ background: '#94a3b8' }} />
    </>
  )
})

MemberNode.displayName = 'MemberNode'
