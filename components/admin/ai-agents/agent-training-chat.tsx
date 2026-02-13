"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  deleteAdminTrainingConversation,
  getAdminTrainingMessages,
  getAgentTrainingConversationsAdmin,
  type AdminTrainingConversation,
  type AdminTrainingMessage,
} from "@/app/actions/admin/ai-agents"
import { Plus, Trash } from "lucide-react"

type AgentTrainingChatProps = {
  agentId: string
  agentName: string
  initialConversations: AdminTrainingConversation[]
  initialConversationId: string | null
  initialMessages: AdminTrainingMessage[]
}

export function AgentTrainingChat({
  agentId,
  agentName,
  initialConversations,
  initialConversationId,
  initialMessages,
}: AgentTrainingChatProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<AdminTrainingConversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId)
  const [messages, setMessages] = useState<AdminTrainingMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  )

  const refreshConversations = async () => {
    const updated = await getAgentTrainingConversationsAdmin(agentId)
    setConversations(updated)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setMessages([])
  }

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedId(conversationId)
    const data = await getAdminTrainingMessages(conversationId)
    setMessages(data)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmed = window.confirm("Excluir esta conversa de treino? Essa ação é irreversível.")
    if (!confirmed) return

    const result = await deleteAdminTrainingConversation(conversationId)
    if ("error" in result) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
      return
    }

    const remaining = conversations.filter((conversation) => conversation.id !== conversationId)
    setConversations(remaining)
    if (selectedId === conversationId) {
      setSelectedId(null)
      setMessages([])
    }
  }

  const handleSend = async () => {
    const messageText = input.trim()
    if (!messageText || loading) return

    const now = new Date().toISOString()
    const optimisticUser: AdminTrainingMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: messageText,
      metadata: {},
      created_at: now,
    }
    const assistantDraftId = `assistant-${Date.now()}`
    const optimisticAssistant: AdminTrainingMessage = {
      id: assistantDraftId,
      sender: "assistant",
      content: "",
      metadata: {},
      created_at: now,
    }

    setInput("")
    setLoading(true)
    setMessages((prev) => [...prev, optimisticUser, optimisticAssistant])
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })

    try {
      const response = await fetch("/api/admin/ai/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          conversationId: selectedId ?? undefined,
          message: messageText,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        toast({ title: "Erro", description: result.error || "Falha ao enviar mensagem", variant: "destructive" })
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantDraftId))
        return
      }

      const resolvedConversationId = response.headers.get("x-conversation-id")
      if (!selectedId && resolvedConversationId) {
        setSelectedId(resolvedConversationId)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Stream indisponível")
      }

      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantDraftId ? { ...msg, content: accumulated } : msg))
        )
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }

      if (!accumulated.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantDraftId
              ? { ...msg, content: "Não consegui gerar uma resposta agora. Tente novamente." }
              : msg
          )
        )
      }

      await refreshConversations()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar sua mensagem.", variant: "destructive" })
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantDraftId
            ? { ...msg, content: "Não foi possível completar a resposta do agente." }
            : msg
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Treino</CardTitle>
          <Button size="icon" variant="ghost" onClick={handleNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma conversa de treino ainda.</p>
            )}
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`rounded-lg border p-3 text-sm ${
                  selectedId === conversation.id ? "border-primary/60 bg-muted/30" : "border-border"
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
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">
            {agentName}
            {selectedConversation?.title ? ` • ${selectedConversation.title}` : ""}
          </CardTitle>
          <CardDescription>Converse com o agente em tempo real para validar o treino.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm ${
                    msg.sender === "user" ? "bg-primary/10" : "bg-muted/40"
                  }`}
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {msg.sender === "user" ? "Você" : "Agente"}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content || (loading ? "Gerando resposta..." : "")}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <Separator />

          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Digite uma pergunta para treinar o agente..."
              rows={3}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? "Gerando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
