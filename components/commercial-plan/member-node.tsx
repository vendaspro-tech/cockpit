'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { User } from 'lucide-react'

interface MemberNodeData {
  userId: string
  fullName: string
  email: string
}

function MemberNodeComponent({ data }: NodeProps<MemberNodeData>) {
  // Get initials from full name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="member-flow-node">
      {/* Top handle to connect to squad */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-green-500 !border-2 !border-white"
      />

      <Card className="w-[200px] shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 p-0">
        <div className="p-2.5 flex items-center gap-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {data.fullName ? getInitials(data.fullName) : <User className="h-4 w-4" />}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs leading-tight truncate text-gray-900">
              {data.fullName || 'Unnamed'}
            </h4>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">
              {data.email}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export const MemberNode = memo(MemberNodeComponent)
