import { getAgent, getConversationMessages, getUserConversations } from "@/app/actions/ai-agents"
import {
  getLeaderCopilotConversations,
  getLeaderCopilotMessages,
  getPendingActionsForConversation,
} from "@/app/actions/leader-copilot"
import { AgentChat } from "@/components/agents/agent-chat"
import { LeaderCopilotChat } from "@/components/agents/leader-copilot-chat"
import { Card, CardContent } from "@/components/ui/card"
import { canAccessLeaderCopilot } from "@/lib/leader-scope"
import { getAuthUser } from "@/lib/auth-server"

interface AgentChatPageProps {
  params: Promise<{ workspaceId: string; agentId: string }>
}

export default async function AgentChatPage({ params }: AgentChatPageProps) {
  const { workspaceId, agentId } = await params
  const agent = await getAgent(agentId)

  if (!agent || agent.status !== "active") {
    return (
      <Card className="p-6">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este agente não está disponível no momento.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (agent.name === "Copiloto do Líder") {
    const user = await getAuthUser()
    if (!user) {
      return (
        <Card className="p-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Faça login para acessar o Copiloto do Líder.
            </p>
          </CardContent>
        </Card>
      )
    }

    const canAccess = await canAccessLeaderCopilot(workspaceId, user.id)
    if (!canAccess) {
      return (
        <Card className="p-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você não possui permissão para acessar este copiloto.
            </p>
          </CardContent>
        </Card>
      )
    }

    const conversations = await getLeaderCopilotConversations(workspaceId)
    const initialConversationId = conversations[0]?.id ?? null
    const initialMessages = initialConversationId
      ? await getLeaderCopilotMessages(initialConversationId)
      : []
    const initialPendingActions = initialConversationId
      ? await getPendingActionsForConversation(initialConversationId)
      : []

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description || "Assistente disponível para seu time."}</p>
        </div>

        <LeaderCopilotChat
          workspaceId={workspaceId}
          initialConversations={conversations}
          initialConversationId={initialConversationId}
          initialMessages={initialMessages}
          initialPendingActions={initialPendingActions}
        />
      </div>
    )
  }

  const conversations = await getUserConversations(agentId, workspaceId)
  const initialConversationId = conversations[0]?.id ?? null
  const initialMessages = initialConversationId
    ? await getConversationMessages(initialConversationId)
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
        <p className="text-muted-foreground">{agent.description || "Assistente disponível para seu time."}</p>
      </div>

      <AgentChat
        agentId={agentId}
        agentName={agent.name}
        workspaceId={workspaceId}
        initialConversations={conversations}
        initialMessages={initialMessages}
        initialConversationId={initialConversationId}
      />
    </div>
  )
}
