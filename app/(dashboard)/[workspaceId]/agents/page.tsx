import { getActiveAgents } from "@/app/actions/ai-agents"
import { AgentLibraryFilters } from "@/components/agents/agent-library-filters"

interface AgentsPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function AgentsPage({ params }: AgentsPageProps) {
  const { workspaceId } = await params
  const agents = await getActiveAgents()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Agentes</h1>
        <p className="text-muted-foreground">
          Filtre por produto, nome e categoria para encontrar o agente certo.
        </p>
      </div>
      <AgentLibraryFilters agents={agents} workspaceId={workspaceId} />
    </div>
  )
}
