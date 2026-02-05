'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'

interface WorkspaceNodeData {
  workspaceName: string
  squadCount: number
}

function WorkspaceNodeComponent({ data }: NodeProps<WorkspaceNodeData>) {
  return (
    <div className="workspace-flow-node">
      <Card className="w-[320px] shadow-lg border-2 border-slate-300 overflow-hidden p-0">
        {/* Single unified section with gradient background */}
        <div className="px-4 py-4 bg-gradient-to-br from-slate-600 to-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight truncate">
                {data.workspaceName}
              </h3>
              <p className="text-white/70 text-xs mt-0.5">Workspace</p>
            </div>
          </div>
          
          {/* Squad count integrated in same section */}
          <div className="flex items-center justify-center gap-2 text-sm bg-white/10 rounded-md py-2 px-3 backdrop-blur-sm">
            <Users className="h-4 w-4 text-white/90" />
            <span className="text-white/90">
              <strong className="text-white">{data.squadCount}</strong> Squad{data.squadCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Card>

      {/* Only bottom handle since workspace is at the top */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-600 !border-2 !border-white"
      />
    </div>
  )
}

export const WorkspaceNode = memo(WorkspaceNodeComponent)
