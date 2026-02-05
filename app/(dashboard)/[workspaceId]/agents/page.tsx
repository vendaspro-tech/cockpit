import { getActiveAgents } from "@/app/actions/ai-agents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import Link from "next/link"

interface AgentsPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function AgentsPage({ params }: AgentsPageProps) {
  const { workspaceId } = await params
  const agents = await getActiveAgents()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agentes de IA</h1>
        <p className="text-muted-foreground">
          Escolha um agente para iniciar uma conversa personalizada.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>{agent.description || "Sem descrição"}</CardDescription>
              <Button asChild size="sm" className="w-full">
                <Link href={`/${workspaceId}/agents/${agent.id}`}>Conversar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {agents.length === 0 && (
          <Card className="flex flex-col items-center justify-center border-dashed p-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Nenhum agente disponível</h3>
            <p className="text-sm text-muted-foreground">
              Peça ao administrador para publicar um agente.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
