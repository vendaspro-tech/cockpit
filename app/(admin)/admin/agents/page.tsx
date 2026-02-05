import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot } from "lucide-react"
import { getAuthUser } from "@/lib/auth-server"
import Link from "next/link"
import { getAdminAgents } from "@/app/actions/admin/ai-agents"
import { Badge } from "@/components/ui/badge"

export default async function AdminAgentsPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const agents = await getAdminAgents()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agentes de IA</h1>
          <p className="text-muted-foreground">
            Crie e gerencie agentes inteligentes para automatizar tarefas no sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {agent.name}
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                  {agent.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {agent.description || "Sem descrição"}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/admin/agents/${agent.id}`}>Configurar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {agents.length === 0 && (
          <Card className="flex flex-col items-center justify-center border-dashed p-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Nenhum agente criado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro agente para liberar a experiência de IA.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/agents/new">Criar agente</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
