import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { AgentForm } from "@/components/admin/ai-agents/agent-form"
import { AgentDocuments } from "@/components/admin/ai-agents/agent-documents"
import { AgentConversations } from "@/components/admin/ai-agents/agent-conversations"
import { AgentTrainingChat } from "@/components/admin/ai-agents/agent-training-chat"
import {
  getAdminAgentById,
  getAdminTrainingMessages,
  getAgentTrainingConversationsAdmin,
  getAgentDocuments,
  getAgentConversationsAdmin,
} from "@/app/actions/admin/ai-agents"

interface AdminAgentPageProps {
  params: Promise<{ agentId: string }>
}

export default async function AdminAgentPage({ params }: AdminAgentPageProps) {
  const { agentId } = await params
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const owner = await isSystemOwner(user.id)
  if (!owner) redirect("/")

  const [agent, documents, conversations, trainingConversations] = await Promise.all([
    getAdminAgentById(agentId),
    getAgentDocuments(agentId),
    getAgentConversationsAdmin(agentId),
    getAgentTrainingConversationsAdmin(agentId),
  ])

  const initialTrainingConversationId = trainingConversations[0]?.id ?? null
  const initialTrainingMessages = initialTrainingConversationId
    ? await getAdminTrainingMessages(initialTrainingConversationId)
    : []

  if (!agent) {
    redirect("/admin/agents")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Agente</h1>
        <p className="text-muted-foreground">
          Atualize configurações, documentos e acompanhe conversas.
        </p>
      </div>

      <AgentForm mode="edit" agentId={agentId} initial={agent} />
      <AgentTrainingChat
        agentId={agentId}
        agentName={agent.name}
        initialConversations={trainingConversations}
        initialConversationId={initialTrainingConversationId}
        initialMessages={initialTrainingMessages}
      />
      <AgentDocuments agentId={agentId} documents={documents} />
      <AgentConversations conversations={conversations} />
    </div>
  )
}
