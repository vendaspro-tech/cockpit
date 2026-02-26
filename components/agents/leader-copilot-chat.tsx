"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, CheckCircle2 } from "lucide-react"

import {
  getLeaderCopilotConversations,
  getLeaderCopilotMessages,
  getPendingActionsForConversation,
  type LeaderConversationMessage,
  type LeaderConversationSummary,
} from "@/app/actions/leader-copilot"
import type { PendingAction } from "@/lib/types/leader-copilot"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  AudioRecorderControl,
  ChatAudioPlayer,
  getChatAudioMetadata,
  type RecordedAudioDraft,
} from "@/components/shared/chat-audio"

type LeaderCopilotChatProps = {
  workspaceId: string
  initialConversations: LeaderConversationSummary[]
  initialConversationId: string | null
  initialMessages: LeaderConversationMessage[]
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
  const [messages, setMessages] = useState<LeaderConversationMessage[]>(initialMessages)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(initialPendingActions)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null)
  const [pendingRecordedAudio, setPendingRecordedAudio] = useState<RecordedAudioDraft | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pendingActions, loading])

  const refreshConversations = async () => {
    const updated = await getLeaderCopilotConversations(workspaceId)
    setConversations(updated)
  }

  const loadConversation = async (conversationId: string) => {
    setSelectedId(conversationId)
    setPendingRecordedAudio(null)
    const [conversationMessages, actions] = await Promise.all([
      getLeaderCopilotMessages(conversationId),
      getPendingActionsForConversation(conversationId),
    ])

    setMessages(conversationMessages)
    setPendingActions(actions)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setMessages([])
    setPendingActions([])
    setPendingRecordedAudio(null)
  }

  const handleSend = async () => {
    const transcriptText = pendingRecordedAudio?.transcript?.trim() || ""
    if (!input.trim() && !pendingRecordedAudio) return

    const apiMessageText = input.trim() || transcriptText
    const messageText = apiMessageText || (pendingRecordedAudio ? "Áudio enviado" : "")
    const messageMetadata = pendingRecordedAudio
      ? {
          audio: {
            dataUrl: pendingRecordedAudio.dataUrl,
            mimeType: pendingRecordedAudio.mimeType,
            durationMs: pendingRecordedAudio.durationMs,
            transcript: transcriptText || undefined,
          },
        }
      : undefined
    setInput("")
    setLoading(true)

    const optimisticUser: LeaderConversationMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      content: messageText,
      created_at: new Date().toISOString(),
      metadata: messageMetadata ?? {},
    }
    const optimisticUserId = optimisticUser.id

    setMessages((prev) => [...prev, optimisticUser])

    try {
      const response = await fetch("/api/ai/leader-copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          conversationId: selectedId ?? undefined,
          message: apiMessageText,
          messageMetadata,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "Erro",
          description: result.error || "Falha ao enviar mensagem",
          variant: "destructive",
        })
        return
      }

      if (result.userMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticUserId
              ? {
                  ...msg,
                  content: result.userMessage,
                  metadata:
                    result.userMessageMetadata && typeof result.userMessageMetadata === "object"
                      ? result.userMessageMetadata
                      : msg.metadata,
                }
              : msg
          )
        )
      }

      const assistantMessage: LeaderConversationMessage = {
        id: `${Date.now()}-assistant`,
        sender: "assistant",
        content: result.message,
        created_at: new Date().toISOString(),
        metadata: {
          type: result.type,
          pendingActionId: result.pendingAction?.id ?? null,
        },
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!selectedId && result.conversationId) {
        setSelectedId(result.conversationId)
      }

      if (result.type === "pending_action" && result.pendingAction) {
        const actions = await getPendingActionsForConversation(result.conversationId)
        setPendingActions(actions)
      }

      setPendingRecordedAudio(null)
      await refreshConversations()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua mensagem.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
        toast({
          title: "Erro",
          description: result.error || "Falha ao confirmar ação",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Ação confirmada e executada.",
      })

      const [conversationMessages, actions] = await Promise.all([
        getLeaderCopilotMessages(selectedId),
        getPendingActionsForConversation(selectedId),
      ])

      setMessages(conversationMessages)
      setPendingActions(actions)
      await refreshConversations()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a ação.",
        variant: "destructive",
      })
    } finally {
      setConfirmingActionId(null)
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
              <button
                key={conversation.id}
                className={`w-full rounded-lg border p-3 text-left text-sm ${
                  selectedId === conversation.id ? "border-primary/60 bg-muted/30" : "border-border"
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
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">
            Copiloto do Líder
            {selectedConversation?.title ? ` • ${selectedConversation.title}` : ""}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
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

          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm ${msg.sender === "user" ? "bg-primary/10" : "bg-muted/40"}`}
                >
                  <p className="mb-1 text-xs text-muted-foreground">{msg.sender === "user" ? "Você" : "Copiloto"}</p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {(() => {
                    const audio = getChatAudioMetadata(msg.metadata)
                    if (!audio) return null
                    return <ChatAudioPlayer audio={audio} className="mt-2" />
                  })()}
                </div>
              ))}
              {loading && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">Pensando...</div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <AudioRecorderControl
              disabled={loading}
              onRecorded={(draft) => {
                setPendingRecordedAudio(draft)
                if (!input.trim() && draft.transcript) {
                  setInput(draft.transcript)
                }
              }}
              onError={(description) =>
                toast({ title: "Áudio", description, variant: "destructive" })
              }
            />
            {pendingRecordedAudio && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Áudio pronto para envio</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingRecordedAudio(null)}
                      disabled={loading}
                    >
                      Cancelar e apagar
                    </Button>
                    <Button type="button" size="sm" onClick={handleSend} disabled={loading}>
                      Enviar áudio
                    </Button>
                  </div>
                </div>
                <ChatAudioPlayer audio={pendingRecordedAudio} />
                {!pendingRecordedAudio.transcript && (
                  <p className="text-xs text-muted-foreground">
                    Você pode enviar só o áudio. A transcrição será feita no backend antes de chamar a IA.
                  </p>
                )}
              </div>
            )}
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pergunte sobre o progresso do time ou peça uma ação..."
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={loading || (!input.trim() && !pendingRecordedAudio)}>
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
