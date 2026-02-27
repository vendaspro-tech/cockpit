"use client"

import { useMemo, useState } from "react"
import { Plus, Trash } from "lucide-react"

import {
  deleteAdminTrainingConversation,
  getAdminTrainingMessages,
  getAgentTrainingConversationsAdmin,
  type AdminTrainingConversation,
} from "@/app/actions/admin/ai-agents"
import { PromptKitChatShell } from "@/components/chat/promptkit-chat-shell"
import { PromptKitComposer } from "@/components/chat/promptkit-composer"
import { PromptKitMessageList } from "@/components/chat/promptkit-message-list"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useChatSession } from "@/hooks/use-chat-session"
import { mapAdminTrainingMessagesToVM } from "@/lib/chat/adapters/admin-training"

type AgentTrainingChatProps = {
  agentId: string
  agentName: string
  initialConversations: AdminTrainingConversation[]
  initialConversationId: string | null
  initialMessages: Awaited<ReturnType<typeof getAdminTrainingMessages>>
}

export function AgentTrainingChat({
  agentId,
  agentName,
  initialConversations,
  initialConversationId,
  initialMessages,
}: AgentTrainingChatProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId)
  const [input, setInput] = useState("")

  const session = useChatSession({
    endpoint: "/api/admin/ai/agents/chat",
    initialConversationId,
    initialMessages: mapAdminTrainingMessagesToVM(initialMessages),
    buildPayload: ({ conversationId, message }) => ({
      agentId,
      conversationId: conversationId ?? undefined,
      message,
    }),
  })

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  )

  const refreshConversations = async () => {
    const updated = await getAgentTrainingConversationsAdmin(agentId)
    setConversations(updated)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setInput("")
    session.reset()
  }

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedId(conversationId)
    const messages = await getAdminTrainingMessages(conversationId)
    session.reload({
      conversationId,
      messages: mapAdminTrainingMessagesToVM(messages),
    })
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm("Excluir esta conversa de treino? Essa ação é irreversível.")) return

    const result = await deleteAdminTrainingConversation(conversationId)
    if ("error" in result) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
      return
    }

    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId))

    if (selectedId === conversationId) {
      handleNewConversation()
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const messageText = input.trim()
    setInput("")

    const response = await session.send(messageText, { conversationIdOverride: selectedId })
    if (!response.ok) {
      toast({ title: "Erro", description: response.error, variant: "destructive" })
      return
    }

    if (response.conversationId && !selectedId) {
      setSelectedId(response.conversationId)
    }

    await refreshConversations()
  }

  return (
    <PromptKitChatShell
      sidebarTitle="Treino"
      sidebarAction={
        <Button size="icon" variant="ghost" onClick={handleNewConversation}>
          <Plus className="h-4 w-4" />
        </Button>
      }
      sidebarContent={
        <div className="space-y-2">
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma conversa de treino ainda.</p>
          )}

          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`rounded-xl border p-3 text-sm transition-colors ${
                selectedId === conversation.id
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border/70 bg-background/80 hover:bg-muted/40"
              }`}
            >
              <button className="w-full text-left" onClick={() => handleSelectConversation(conversation.id)}>
                <p className="font-medium">{conversation.title || "Sem título"}</p>
                <p className="text-xs text-muted-foreground">
                  {conversation.last_message_at
                    ? new Date(conversation.last_message_at).toLocaleString()
                    : "Sem mensagens"}
                </p>
              </button>
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => handleDeleteConversation(conversation.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      }
      chatTitle={`${agentName}${selectedConversation?.title ? ` • ${selectedConversation.title}` : ""}`}
      chatDescription={<p className="text-sm text-muted-foreground">Converse com o agente em tempo real para validar o treino.</p>}
      chatContent={
        <>
          <PromptKitMessageList
            messages={session.messages}
            isLoading={session.status === "sending"}
            loadingLabel="Gerando resposta..."
            assistantLabel="Agente"
          />

          <PromptKitComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            placeholder="Digite uma pergunta para treinar o agente..."
            disabled={session.status === "sending" || session.status === "streaming"}
            submitLabel={session.error ? `Erro: ${session.error}` : undefined}
          />
        </>
      }
    />
  )
}
