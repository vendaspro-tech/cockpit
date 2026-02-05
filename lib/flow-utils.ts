import dagre from 'dagre'
import { Node, Edge, Position } from 'reactflow'

const nodeWidth = 280  // Reduced from 320
const nodeHeight = 180 // Reduced from 220

export interface LayoutOptions {
  direction?: 'TB' | 'LR' // Top-Bottom or Left-Right
  nodeSpacing?: number
  rankSpacing?: number
}

/**
 * Auto-layout nodes using Dagre algorithm
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
) {
  const {
    direction = 'TB',
    nodeSpacing = 100,
    rankSpacing = 150
  } = options

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 50,
    marginy: 50
  })

  // Add nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight
    })
  })

  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    
    return {
      ...node,
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

/**
 * Create edges from parent_squad_id relationships
 */
export function createEdgesFromHierarchy(squads: any[]): Edge[] {
  const edges: Edge[] = []

  squads.forEach(squad => {
    if (squad.parent_squad_id) {
      edges.push({
        id: `e-${squad.parent_squad_id}-${squad.squad_id}`,
        source: squad.parent_squad_id,
        target: squad.squad_id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 }
      })
    }
  })

  return edges
}
