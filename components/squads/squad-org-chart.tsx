'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Squad } from '@/app/actions/squads'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SquadNode } from './squad-node'
import { MemberNode } from './member-node'
import { SquadDialog } from './squad-dialog'
import { WorkspaceNode } from './workspace-node'

interface SquadOrgChartProps {
  workspaceId: string
  workspaceName: string
  squads: Squad[]
  members: Array<{
    user?: { id: string; full_name?: string | null; email: string }
    job_title?: { name: string } | null
  }>
  onSquadUpdate?: () => void
}

const MAX_MEMBERS_PER_ROW = 5
const SQUAD_SPACING_X = 340
const ROOT_TO_SQUAD_Y = 180
const MEMBER_SPACING_X = 210
const MEMBER_ROW_SPACING = 90
const MEMBER_OFFSET_Y = 130

// Define nodeTypes outside component to prevent re-creation on each render
const nodeTypes: NodeTypes = {
  workspaceNode: WorkspaceNode,
  squadNode: SquadNode,
  memberNode: MemberNode,
}

export function SquadOrgChart({
  workspaceId,
  workspaceName,
  squads,
  members = [],
  onSquadUpdate,
}: SquadOrgChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [collapsedSquadIds, setCollapsedSquadIds] = useState<string[]>([])

  const buildGraph = useCallback(() => {
    const rootId = `workspace-${workspaceId}`
    const sortedSquads = [...(squads || [])]

    const memberTitleMap = new Map<string, string | null>()
    const workspaceMemberIds = new Set<string>()
    members.forEach((member) => {
      const userId = member.user?.id
      if (!userId) return
      memberTitleMap.set(userId, member.job_title?.name || null)
      workspaceMemberIds.add(userId)
    })

    const squadPositions = new Map<string, { x: number; y: number }>()
    const memberPositions = new Map<string, { x: number; y: number }>()

    const squadCount = sortedSquads.length
    const totalWidth = (squadCount - 1) * SQUAD_SPACING_X
    const startX = -totalWidth / 2

    sortedSquads.forEach((squad, index) => {
      const x = startX + index * SQUAD_SPACING_X
      const y = ROOT_TO_SQUAD_Y
      squadPositions.set(squad.id, { x, y })

      const memberIds = new Set<string>()
      squad.members?.forEach((member) => {
        const userId = member.user?.id || member.user_id
        if (!userId || userId === squad.leader?.id) return
        memberIds.add(userId)
      })

      const memberIdsArray = Array.from(memberIds)
      const memberCount = memberIdsArray.length
      if (memberCount === 0) return

      const membersPerRow = Math.min(MAX_MEMBERS_PER_ROW, Math.max(1, memberCount))

      memberIdsArray.forEach((userId, memberIndex) => {
        const row = Math.floor(memberIndex / membersPerRow)
        const col = memberIndex % membersPerRow
        const itemsInRow = Math.min(membersPerRow, memberCount - row * membersPerRow)
        const rowWidth = (itemsInRow - 1) * MEMBER_SPACING_X
        const rowStartX = x - rowWidth / 2
        const nodeX = rowStartX + col * MEMBER_SPACING_X
        const nodeY = y + MEMBER_OFFSET_Y + row * MEMBER_ROW_SPACING
        memberPositions.set(`member-${squad.id}-${userId}`, { x: nodeX, y: nodeY })
      })
    })

    const flowNodes: Node[] = [
      {
        id: rootId,
        type: 'workspaceNode',
        position: { x: 0, y: 0 },
        selectable: false,
        draggable: false,
        data: {
          name: workspaceName,
          squadsCount: sortedSquads.length,
          membersCount: workspaceMemberIds.size,
        },
      },
    ]
    const flowEdges: Edge[] = []

    if (sortedSquads.length === 0) {
      setNodes(flowNodes)
      setEdges(flowEdges)
      return
    }

    sortedSquads.forEach((squad) => {
      const position = squadPositions.get(squad.id) || { x: 0, y: 0 }
      const isCollapsed = collapsedSquadIds.includes(squad.id)
      const memberCount = (squad.members || []).filter(
        (member) => (member.user?.id || member.user_id) && (member.user?.id || member.user_id) !== squad.leader?.id
      ).length

      flowNodes.push({
        id: squad.id,
        type: 'squadNode',
        position,
        data: {
          squad,
          leaderTitle: memberTitleMap.get(squad.leader?.id || '') || null,
          onEdit: (s: Squad) => {
            setSelectedSquad(s)
            setIsDialogOpen(true)
          },
          onToggleCollapse: (squadId: string) => {
            setCollapsedSquadIds((prev) =>
              prev.includes(squadId) ? prev.filter((id) => id !== squadId) : [...prev, squadId]
            )
          },
          isCollapsed,
          childCount: memberCount,
        },
      })

      flowEdges.push({
        id: `e-${rootId}-${squad.id}`,
        source: rootId,
        target: squad.id,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
        },
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      })

      const membersMap = new Map<string, { name: string; email?: string | null }>()
      squad.members?.forEach((member) => {
        const userId = member.user?.id || member.user_id
        if (!userId || userId === squad.leader?.id) return
        membersMap.set(userId, {
          name: member.user?.full_name || member.user?.email || 'Membro',
          email: member.user?.email,
        })
      })

      Array.from(membersMap.entries()).forEach(([userId, info]) => {
        const memberId = `member-${squad.id}-${userId}`
        const position = memberPositions.get(memberId) || { x: 0, y: 0 }
        flowNodes.push({
          id: memberId,
          type: 'memberNode',
          position,
          hidden: isCollapsed,
          draggable: false,
          selectable: false,
          data: {
            name: info.name,
            email: info.email,
            squadId: squad.id,
          },
        })
        flowEdges.push({
          id: `e-${squad.id}-${memberId}`,
          source: squad.id,
          target: memberId,
          type: 'smoothstep',
          animated: false,
          hidden: isCollapsed,
          style: { stroke: '#cbd5f5', strokeWidth: 1.5 },
        })
      })
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [
    squads,
    members,
    workspaceId,
    workspaceName,
    collapsedSquadIds,
    setNodes,
    setEdges,
  ])

  useEffect(() => {
    buildGraph()
  }, [buildGraph])

  const handleNodeEdit = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const squad = squads.find((item) => item.id === node.id)
      if (!squad) return
      setSelectedSquad(squad)
      setIsDialogOpen(true)
    },
    [squads]
  )

  const handleCreateSquad = () => {
    setSelectedSquad(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeEdit}
        onNodeDoubleClick={handleNodeEdit}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Panel position="top-right" className="flex gap-2">
          <Button variant="outline" size="sm" onClick={buildGraph}>
            Auto Layout
          </Button>
          <Button size="sm" onClick={handleCreateSquad}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Squad
          </Button>
        </Panel>
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'workspaceNode') return '#0f172a'
            if (node.type === 'memberNode') return '#94a3b8'
            const squad = squads.find((s) => s.id === node.id)
            return squad?.color || '#3b82f6'
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>

      {isDialogOpen && (
        <SquadDialog
          workspaceId={workspaceId}
          squad={selectedSquad}
          squads={squads}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={onSquadUpdate}
        />
      )}
    </div>
  )
}
