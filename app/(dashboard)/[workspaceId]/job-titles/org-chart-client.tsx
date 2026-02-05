'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { JobTitleNode } from '@/components/job-titles/job-title-node'
import { Briefcase } from 'lucide-react'

const nodeTypes: NodeTypes = {
  jobTitle: JobTitleNode,
}

interface OrgChartClientProps {
  jobTitles: Array<{
    id: string
    name: string
    slug: string
    hierarchy_level: number
    mission: string | null
    sector: string | null
    subordination: string | null
    allows_seniority: boolean
  }>
  workspaceId: string
}

export function OrgChartClient({ jobTitles, workspaceId }: OrgChartClientProps) {
  // Criar um mapa para encontrar job titles por nome
  const jobTitleMap = useMemo(() => {
    const map = new Map<string, typeof jobTitles[0]>()
    jobTitles.forEach(job => {
      map.set(job.name, job)
    })
    return map
  }, [jobTitles])

  // Criar nós para o React Flow - layout automático baseado em subordinação
  const initialNodes: Node[] = useMemo(() => {
    // Criar mapa de profundidade para cada nó (distância do topo)
    const depthMap = new Map<string, number>()
    const childrenMap = new Map<string, string[]>()

    // Inicializar
    jobTitles.forEach(job => {
      depthMap.set(job.id, 0)
      childrenMap.set(job.id, [])
    })

    // Calcular profundidade de cada nó baseado em subordinação
    const calculateDepth = (jobId: string, visited = new Set<string>()): number => {
      if (visited.has(jobId)) return 0 // Evitar ciclos
      visited.add(jobId)

      const job = jobTitles.find(j => j.id === jobId)
      if (!job || !job.subordination) return 0

      const parent = jobTitleMap.get(job.subordination)
      if (!parent) return 0

      const parentDepth = calculateDepth(parent.id, visited)
      const depth = parentDepth + 1

      // Adicionar este nó como filho do pai
      const children = childrenMap.get(parent.id) || []
      if (!children.includes(jobId)) {
        children.push(jobId)
        childrenMap.set(parent.id, children)
      }

      return depth
    }

    // Calcular profundidade para todos os jobs
    jobTitles.forEach(job => {
      const depth = calculateDepth(job.id)
      depthMap.set(job.id, depth)
    })

    // Agrupar por profundidade (nível)
    const groupedByDepth = new Map<number, typeof jobTitles>()
    depthMap.forEach((depth, jobId) => {
      const job = jobTitles.find(j => j.id === jobId)
      if (job) {
        if (!groupedByDepth.has(depth)) {
          groupedByDepth.set(depth, [])
        }
        groupedByDepth.get(depth)!.push(job)
      }
    })

    // Calcular posições
    const nodes: Node[] = []
    const levelHeight = 200
    const nodeWidth = 240

    // Ordenar níveis
    const sortedDepths = Array.from(groupedByDepth.keys()).sort((a, b) => a - b)

    sortedDepths.forEach((depth) => {
      const jobsInDepth = groupedByDepth.get(depth) || []
      const totalWidth = jobsInDepth.length * nodeWidth
      const startX = -(totalWidth / 2) + (nodeWidth / 2)

      jobsInDepth.forEach((job, index) => {
        nodes.push({
          id: job.id,
          type: 'jobTitle',
          position: {
            x: startX + (index * nodeWidth),
            y: depth * levelHeight,
          },
          data: {
            ...job,
            onClick: () => {
              window.location.href = `/${workspaceId}/job-titles/${job.slug}`
            }
          },
        })
      })
    })

    return nodes
  }, [jobTitles, workspaceId, jobTitleMap])

  // Criar edges (conexões) baseados em subordinação
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []

    jobTitles.forEach(job => {
      if (job.subordination) {
        const parent = jobTitleMap.get(job.subordination)
        if (parent) {
          edges.push({
            id: `${parent.id}-${job.id}`,
            source: parent.id,
            target: job.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#cbd5e1', strokeWidth: 2 },
          })
        }
      }
    })

    return edges
  }, [jobTitles, jobTitleMap])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const slug = node.data.slug
    if (slug) {
      window.location.href = `/${workspaceId}/job-titles/${slug}`
    }
  }, [workspaceId])

  return (
    <div className="space-y-6">
      {/* React Flow Container */}
      <div className="border rounded-lg overflow-hidden bg-background" style={{ height: '800px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const level = node.data.hierarchy_level
              const colors = {
                0: '#a855f7', // purple
                1: '#3b82f6', // blue
                2: '#22c55e', // green
                3: '#f97316', // orange
              }
              return colors[level as keyof typeof colors] || '#6b7280'
            }}
            maskColor="rgba(0, 0, 0, 0.05)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
