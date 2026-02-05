'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  useReactFlow,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { SquadNode } from './squad-node'
import { WorkspaceNode } from './workspace-node'
import { MemberNode } from './member-node'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2, Plus, Package } from 'lucide-react'
import { getLayoutedElements } from '@/lib/flow-utils'
import type { PlanSquadSimple } from '@/app/actions/commercial-plans-squads'

const nodeTypes = {
  squadNode: SquadNode,
  workspaceNode: WorkspaceNode,
  memberNode: MemberNode
}

interface SquadsFlowViewProps {
  squads: PlanSquadSimple[]
  workspaceName?: string
  onCreateSquad: () => void
  onViewKPIs: (squadId: string) => void
  onLinkProducts: (squadId: string) => void
  onAddMembers: (squadId: string) => void
}

export function SquadsFlowView({
  squads,
  workspaceName = 'Workspace',
  onCreateSquad,
  onViewKPIs,
  onLinkProducts,
  onAddMembers
}: SquadsFlowViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { fitView, zoomIn, zoomOut } = useReactFlow()



  // Build nodes and edges from squads data
  useEffect(() => {
    if (!squads || squads.length === 0) {
      // Create just workspace node when no squads
      const workspaceNode: Node = {
        id: 'workspace',
        type: 'workspaceNode',
        position: { x: 0, y: 0 },
        data: {
          workspaceName,
          squadCount: 0
        }
      }
      setNodes([workspaceNode])
      setEdges([])
      return
    }

    // 1. Create workspace node
    const workspaceNode: Node = {
      id: 'workspace',
      type: 'workspaceNode',
      position: { x: 0, y: 0 },
      data: {
        workspaceName,
        squadCount: squads.length
      }
    }

    // 2. Create squad nodes
    const squadNodes: Node[] = squads.map((squad, index) => ({
      id: squad.squad_id,
      type: 'squadNode',
      position: { x: index * 350, y: 200 },
      data: {
        ...squad,
        onViewKPIs,
        onLinkProducts,
        onAddMembers
      }
    }))



    // 3. Create edges
    const initialEdges: Edge[] = []

    // Workspace to squads (with arrows)
    squads.forEach((squad) => {
      initialEdges.push({
        id: `e-workspace-${squad.squad_id}`,
        source: 'workspace',
        target: squad.squad_id,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
          width: 20,
          height: 20
        },
        style: { stroke: '#94a3b8', strokeWidth: 2 }
      })
    })



    // 4. Combine all nodes (only workspace and squads now)
    const allNodes = [workspaceNode, ...squadNodes]

    // 5. Apply auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      allNodes,
      initialEdges,
      { direction: 'TB', nodeSpacing: 100, rankSpacing: 200 }
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 })
    }, 50)
  }, [squads, workspaceName, setNodes, setEdges, fitView, onViewKPIs, onLinkProducts, onAddMembers])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 })
  }, [fitView])

  if (squads.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center border-2 border-dashed rounded-lg">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-lg">Nenhum squad criado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie squads para visualizar o organograma
            </p>
          </div>
          <Button onClick={onCreateSquad}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Squad
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[700px] w-full border rounded-lg relative bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Background Pattern */}
        <Background 
          variant={BackgroundVariant.Dots}
          gap={16} 
          size={1}
          color="#cbd5e1"
        />

        {/* Mini Map */}
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'workspaceNode') return '#6b7280'
            if (node.type === 'memberNode') return '#4ade80'
            const squadData = node.data as PlanSquadSimple
            return squadData?.color || '#3b82f6'
          }}
          nodeBorderRadius={6}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white !border !border-gray-200"
        />

        {/* Controls */}
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-gray-200 !shadow-lg"
        />

        {/* Custom Toolbar - Compact */}
        <Panel position="top-right" className="flex gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => zoomIn({ duration: 400 })}
            className="shadow-md h-8 w-8 p-0"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => zoomOut({ duration: 400 })}
            className="shadow-md h-8 w-8 p-0"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleFitView}
            className="shadow-md h-8 w-8 p-0"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </Panel>
      </ReactFlow>

      <style jsx global>{`
        .squad-flow-node .react-flow__handle,
        .workspace-flow-node .react-flow__handle,
        .member-flow-node .react-flow__handle {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .squad-flow-node:hover .react-flow__handle,
        .workspace-flow-node:hover .react-flow__handle,
        .member-flow-node:hover .react-flow__handle {
          opacity: 1;
        }

        .react-flow__edge-path {
          stroke-width: 2;
          stroke: #94a3b8;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #3b82f6;
          stroke-width: 3;
        }
      `}</style>
    </div>
  )
}
