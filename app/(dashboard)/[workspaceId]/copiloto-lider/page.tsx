import { notFound } from "next/navigation"

import { getAuthUser } from "@/lib/auth-server"
import { canAccessLeaderCopilot } from "@/lib/leader-scope"
import {
  getLeaderCopilotConversations,
  getLeaderCopilotMessages,
  getPendingActionsForConversation,
} from "@/app/actions/leader-copilot"
import { LeaderCopilotChat } from "@/components/agents/leader-copilot-chat"
import { DashboardHeaderConfig } from "@/components/dashboard/dashboard-header-context"

interface LeaderCopilotPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function LeaderCopilotPage({ params }: LeaderCopilotPageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()

  if (!user) {
    notFound()
  }

  const allowed = await canAccessLeaderCopilot(workspaceId, user.id)
  if (!allowed) {
    notFound()
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
      <DashboardHeaderConfig title="Copiloto do Líder" hideBreadcrumb />

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
