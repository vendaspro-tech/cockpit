"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  deleteConversation,
  getConversationAttachments,
  getConversationMessages,
  getUserConversations,
  type ConversationMessage,
  type ConversationSummary,
  type ConversationAttachment,
} from "@/app/actions/ai-agents"
import { Plus, Trash } from "lucide-react"

type AgentChatProps = {
  agentId: string
  agentName: string
  workspaceId: string
  initialConversations: ConversationSummary[]
  initialMessages: ConversationMessage[]
  initialConversationId: string | null
}

export function AgentChat({
  agentId,
  agentName,
  workspaceId,
  initialConversations,
  initialMessages,
  initialConversationId,
}: AgentChatProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId)
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<ConversationAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const refreshConversations = async () => {
    const updated = await getUserConversations(agentId, workspaceId)
    setConversations(updated)
  }

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedId(conversationId)
    const data = await getConversationMessages(conversationId)
    setMessages(data)
    const files = await getConversationAttachments(conversationId)
    setAttachments(files)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setMessages([])
    setAttachments([])
  }

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmed = window.confirm("Excluir esta conversa? Essa ação é irreversível.")
    if (!confirmed) return
    const result = await deleteConversation({ conversationId })
    if (result?.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Conversa excluída", description: "Conversa removida com sucesso." })
    const remaining = conversations.filter((c) => c.id !== conversationId)
    setConversations(remaining)
    if (selectedId === conversationId) {
      setSelectedId(null)
      setMessages([])
      setAttachments([])
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const messageText = input.trim()
    const optimisticUser: ConversationMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      content: messageText,
      created_at: new Date().toISOString(),
      metadata: {},
    }

    setInput("")
    setMessages((prev) => [...prev, optimisticUser])
    setLoading(true)
    try {
      const response = await fetch("/api/ai/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          workspaceId,
          conversationId: selectedId ?? undefined,
          message: messageText,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        toast({ title: "Erro", description: result.error || "Falha ao enviar mensagem", variant: "destructive" })
        return
      }

      const assistantMessage: ConversationMessage = {
        id: `${Date.now()}-assistant`,
        sender: "assistant",
        content: result.message,
        created_at: new Date().toISOString(),
        metadata: {},
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!selectedId) {
        setSelectedId(result.conversationId)
        const files = await getConversationAttachments(result.conversationId)
        setAttachments(files)
      }

      await refreshConversations()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar sua mensagem.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }


  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("agentId", agentId)
      formData.append("workspaceId", workspaceId)
      if (selectedId) formData.append("conversationId", selectedId)

      const response = await fetch("/api/ai/agents/attachments/upload", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        toast({ title: "Erro", description: result.error || "Falha ao enviar arquivo", variant: "destructive" })
        return
      }

      if (!selectedId && result.conversationId) {
        setSelectedId(result.conversationId)
      }

      setAttachments((prev) => [result.attachment, ...prev])
      toast({ title: "Arquivo anexado", description: "Anexo disponível para esta conversa." })
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao enviar arquivo.", variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Conversas</CardTitle>
          <Button size="icon" variant="ghost" onClick={handleNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
            )}
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`rounded-lg border p-3 text-sm ${
                  selectedId === conversation.id ? "border-primary/60 bg-muted/30" : "border-border"
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <p className="font-medium">{conversation.title || "Sem título"}</p>
                  <p className="text-xs text-muted-foreground">
                    {conversation.last_message_at
                      ? new Date(conversation.last_message_at).toLocaleString()
                      : "Sem mensagens"}
                  </p>
                </button>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteConversation(conversation.id)}
                  >
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
                  <p className="text-xs text-muted-foreground mb-1">
                    {msg.sender === "user" ? "Você" : "Agente"}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Agente</p>
                  <p>Gerando resposta...</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <Separator />

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.pdf,.csv"
              onChange={handleAttachmentUpload}
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <span
                    key={att.id}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {att.filename}
                  </span>
                ))}
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" onClick={handleAttachmentClick} disabled={uploading}>
                {uploading ? "Enviando..." : "Anexar arquivo"}
              </Button>
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
