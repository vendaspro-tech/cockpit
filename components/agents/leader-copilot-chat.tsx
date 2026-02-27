"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Plus } from "lucide-react"

import {
  getLeaderCopilotConversations,
  getLeaderCopilotMessages,
  getPendingActionsForConversation,
  type LeaderConversationSummary,
} from "@/app/actions/leader-copilot"
import { PromptKitChatShell } from "@/components/chat/promptkit-chat-shell"
import { PromptKitComposer } from "@/components/chat/promptkit-composer"
import { PromptKitMessageList } from "@/components/chat/promptkit-message-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useChatSession } from "@/hooks/use-chat-session"
import { mapLeaderCopilotMessagesToVM } from "@/lib/chat/adapters/leader-copilot"
import type { PendingAction } from "@/lib/types/leader-copilot"

type LeaderCopilotChatProps = {
  workspaceId: string
  initialConversations: LeaderConversationSummary[]
  initialConversationId: string | null
  initialMessages: Awaited<ReturnType<typeof getLeaderCopilotMessages>>
  initialPendingActions: PendingAction[]
}

export function LeaderCopilotChat({
  workspaceId,
  initialConversations,
  initialConversationId,
  initialMessages,
  initialPendingActions,
}: LeaderCopilotChatProps) {
  const { toast } = useToast()

  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId)
  const [pendingActions, setPendingActions] = useState(initialPendingActions)
  const [input, setInput] = useState("")
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null)

  const session = useChatSession({
    endpoint: "/api/ai/leader-copilot/chat",
    initialConversationId,
    initialMessages: mapLeaderCopilotMessagesToVM(initialMessages),
    buildPayload: ({ conversationId, message }) => ({
      workspaceId,
      conversationId: conversationId ?? undefined,
      message,
    }),
  })

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  )

  const refreshConversations = async () => {
    const updated = await getLeaderCopilotConversations(workspaceId)
    setConversations(updated)
  }

  const loadConversation = async (conversationId: string) => {
    setSelectedId(conversationId)
    const [messages, actions] = await Promise.all([
      getLeaderCopilotMessages(conversationId),
      getPendingActionsForConversation(conversationId),
    ])

    session.reload({ conversationId, messages: mapLeaderCopilotMessagesToVM(messages) })
    setPendingActions(actions)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setInput("")
    setPendingActions([])
    session.reset()
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const messageText = input.trim()
    setInput("")

    const response = await session.send(messageText, { conversationIdOverride: selectedId })
    if (!response.ok) {
      toast({
        title: "Erro",
        description: response.error,
        variant: "destructive",
      })
      return
    }

    const resolvedConversationId = response.conversationId ?? selectedId
    if (resolvedConversationId && !selectedId) {
      setSelectedId(resolvedConversationId)
    }

    if (resolvedConversationId) {
      const actions = await getPendingActionsForConversation(resolvedConversationId)
      setPendingActions(actions)
    }

    await refreshConversations()
  }

  const handleConfirmAction = async (pendingActionId: string) => {
    if (!selectedId) return

    setConfirmingActionId(pendingActionId)

    try {
      const response = await fetch("/api/ai/leader-copilot/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          conversationId: selectedId,
          pendingActionId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: "Erro", description: result.error || "Falha ao confirmar ação", variant: "destructive" })
        return
      }

      toast({ title: "Sucesso", description: "Ação confirmada e executada." })

      const [messages, actions] = await Promise.all([
        getLeaderCopilotMessages(selectedId),
        getPendingActionsForConversation(selectedId),
      ])

      session.reload({ conversationId: selectedId, messages: mapLeaderCopilotMessagesToVM(messages) })
      setPendingActions(actions)
      await refreshConversations()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível confirmar a ação.", variant: "destructive" })
    } finally {
      setConfirmingActionId(null)
    }
  }

  return (
    <PromptKitChatShell
      sidebarTitle="Conversas"
      sidebarAction={
        <Button size="icon" variant="ghost" onClick={handleNewConversation}>
          <Plus className="h-4 w-4" />
        </Button>
      }
      sidebarContent={
        <div className="space-y-2">
          {conversations.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                selectedId === conversation.id
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border/70 bg-background/80 hover:bg-muted/40"
              }`}
              onClick={() => loadConversation(conversation.id)}
            >
              <p className="font-medium">{conversation.title || "Sem título"}</p>
              <p className="text-xs text-muted-foreground">
                {conversation.last_message_at
                  ? new Date(conversation.last_message_at).toLocaleString()
                  : "Sem mensagens"}
              </p>
            </button>
          ))}
        </div>
      }
      chatTitle={`Copiloto do Líder${selectedConversation?.title ? ` • ${selectedConversation.title}` : ""}`}
      chatContent={
        <>
          {pendingActions.length > 0 && (
            <div className="space-y-2">
              {pendingActions.map((action) => {
                const preview = action.payload || {}
                return (
                  <div key={action.id} className="rounded-lg border bg-amber-50/70 p-3 text-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-700" />
                        <span className="font-medium">Ação pendente: {action.action_type}</span>
                      </div>
                      <Badge variant="outline">Confirmação obrigatória</Badge>
                    </div>

                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {JSON.stringify(preview, null, 2)}
                    </pre>

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAction(action.id)}
                        disabled={confirmingActionId === action.id}
                      >
                        {confirmingActionId === action.id ? "Confirmando..." : "Confirmar ação"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <PromptKitMessageList
            messages={session.messages}
            isLoading={session.status === "sending"}
            loadingLabel="Pensando..."
            assistantLabel="Copiloto"
          />

          <PromptKitComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            placeholder="Pergunte sobre o progresso do time ou peça uma ação..."
            disabled={session.status === "sending" || session.status === "streaming"}
            submitLabel={session.error ? `Erro: ${session.error}` : undefined}
          />
        </>
      }
    />
  )
}
