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
  getConversationMessages,
  getUserConversations,
  type ConversationMessage,
  type ConversationSummary,
} from "@/app/actions/ai-agents"
import { Mic, MicOff, Plus, Trash } from "lucide-react"

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
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
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
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setMessages([])
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
      }

      await refreshConversations()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar sua mensagem.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRecordToggle = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const file = new File([blob], "audio.webm", { type: "audio/webm" })
        const formData = new FormData()
        formData.append("file", file)

        try {
          const response = await fetch("/api/ai/agents/transcribe", {
            method: "POST",
            body: formData,
          })
          const result = await response.json()
          if (!response.ok) {
            toast({ title: "Erro", description: result.error || "Falha ao transcrever áudio", variant: "destructive" })
            return
          }
          setInput((prev) => `${prev} ${result.text}`.trim())
        } catch (error) {
          toast({ title: "Erro", description: "Falha ao transcrever áudio.", variant: "destructive" })
        }

        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch (error) {
      toast({ title: "Erro", description: "Permissão de microfone necessária.", variant: "destructive" })
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
              <Button variant="outline" onClick={handleRecordToggle}>
                {recording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {recording ? "Parar gravação" : "Gravar áudio"}
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
