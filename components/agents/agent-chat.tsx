"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
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
import {
  AudioRecorderControl,
  ChatAudioPlayer,
  getChatAudioMetadata,
  type RecordedAudioDraft,
} from "@/components/shared/chat-audio"

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
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{
      id: string
      file: File
      filename: string
      mimeType: string
      sizeBytes: number
      status: "queued" | "uploading" | "error"
      error?: string
    }>
  >([])
  const [uploading, setUploading] = useState(false)
  const [pendingRecordedAudio, setPendingRecordedAudio] = useState<RecordedAudioDraft | null>(null)
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
    setPendingRecordedAudio(null)
    const data = await getConversationMessages(conversationId)
    setMessages(data)
    const files = await getConversationAttachments(conversationId)
    setAttachments(files)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setMessages([])
    setAttachments([])
    setPendingRecordedAudio(null)
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
    const hasPendingAudio = Boolean(pendingRecordedAudio)
    const hasPending = pendingAttachments.length > 0
    const transcriptText = pendingRecordedAudio?.transcript?.trim() || ""
    if (!input.trim() && !hasPending && !hasPendingAudio) return
    const apiMessageText = input.trim() || transcriptText
    const messageText =
      apiMessageText ||
      (hasPendingAudio ? "Áudio enviado" : hasPending ? "Enviei um arquivo para análise." : "")
    const messageMetadata = hasPendingAudio
      ? {
          audio: {
            dataUrl: pendingRecordedAudio!.dataUrl,
            mimeType: pendingRecordedAudio!.mimeType,
            durationMs: pendingRecordedAudio!.durationMs,
            transcript: transcriptText || undefined,
          },
        }
      : undefined
    const optimisticUser: ConversationMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      content: messageText,
      created_at: new Date().toISOString(),
      metadata: messageMetadata ?? {},
    }
    const optimisticUserId = optimisticUser.id

    setInput("")
    if (messageText || hasPendingAudio) {
      setMessages((prev) => [...prev, optimisticUser])
    }
    setLoading(true)
    try {
      let resolvedConversationId = selectedId

      if (hasPending) {
        setUploading(true)
        const supabase = createClient()
        const queued = [...pendingAttachments]
        for (const pending of queued) {
          setPendingAttachments((prev) =>
            prev.map((att) =>
              att.id === pending.id ? { ...att, status: "uploading", error: undefined } : att
            )
          )
          const prepareResponse = await fetch("/api/ai/agents/attachments/prepare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId,
              workspaceId,
              conversationId: resolvedConversationId ?? undefined,
              filename: pending.filename,
              mimeType: pending.mimeType,
              sizeBytes: pending.sizeBytes,
            }),
          })
          const prepareResult = await prepareResponse.json()
          if (!prepareResponse.ok) {
            const errorMessage = prepareResult.error || "Falha ao preparar upload"
            setPendingAttachments((prev) =>
              prev.map((att) =>
                att.id === pending.id ? { ...att, status: "error", error: errorMessage } : att
              )
            )
            throw new Error(errorMessage)
          }

          resolvedConversationId = prepareResult.conversationId
          if (!selectedId) setSelectedId(prepareResult.conversationId)

          const uploadResult = await supabase.storage
            .from(prepareResult.bucket)
            .upload(prepareResult.storagePath, pending.file, {
              contentType: pending.mimeType,
              upsert: false,
            })

          if (uploadResult.error) {
            const errorMessage = uploadResult.error.message || "Falha ao enviar arquivo"
            setPendingAttachments((prev) =>
              prev.map((att) =>
                att.id === pending.id ? { ...att, status: "error", error: errorMessage } : att
              )
            )
            throw new Error(errorMessage)
          }

          const commitResponse = await fetch("/api/ai/agents/attachments/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: resolvedConversationId,
              storagePath: prepareResult.storagePath,
              filename: pending.filename,
              mimeType: pending.mimeType,
              sizeBytes: pending.sizeBytes,
            }),
          })
          const commitResult = await commitResponse.json()
          if (!commitResponse.ok) {
            const errorMessage = commitResult.error || "Falha ao salvar anexo"
            setPendingAttachments((prev) =>
              prev.map((att) =>
                att.id === pending.id ? { ...att, status: "error", error: errorMessage } : att
              )
            )
            throw new Error(errorMessage)
          }

          setAttachments((prev) => [commitResult.attachment, ...prev])
          setPendingAttachments((prev) => prev.filter((att) => att.id !== pending.id))
        }
        setUploading(false)
      }

      const response = await fetch("/api/ai/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          workspaceId,
          conversationId: resolvedConversationId ?? undefined,
          message: apiMessageText,
          messageMetadata,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        toast({ title: "Erro", description: result.error || "Falha ao enviar mensagem", variant: "destructive" })
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

      const assistantMessage: ConversationMessage = {
        id: `${Date.now()}-assistant`,
        sender: "assistant",
        content: result.message,
        created_at: new Date().toISOString(),
        metadata: {},
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!resolvedConversationId) {
        setSelectedId(result.conversationId)
        const files = await getConversationAttachments(result.conversationId)
        setAttachments(files)
      }

      setPendingRecordedAudio(null)
      await refreshConversations()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar sua mensagem.", variant: "destructive" })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }


  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const allowedTypes = new Set(["text/plain", "text/csv", "application/pdf"])
    const maxSizeBytes = 25 * 1024 * 1024

    if (!allowedTypes.has(file.type)) {
      toast({ title: "Arquivo inválido", description: "Tipo de arquivo não suportado.", variant: "destructive" })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > maxSizeBytes) {
      toast({ title: "Arquivo muito grande", description: "Limite de 25MB.", variant: "destructive" })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setPendingAttachments((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${file.name}`,
        file,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        status: "queued",
      },
    ])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRemovePending = (id: string) => {
    setPendingAttachments((prev) => prev.filter((att) => att.id !== id))
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
                  {(() => {
                    const audio = getChatAudioMetadata(msg.metadata)
                    if (!audio) return null
                    return <ChatAudioPlayer audio={audio} className="mt-2" />
                  })()}
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
            {(pendingAttachments.length > 0 || attachments.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((att) => (
                  <span
                    key={att.id}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      att.status === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {att.filename} • {att.mimeType}
                    <button
                      type="button"
                      className="text-xs hover:text-foreground"
                      onClick={() => handleRemovePending(att.id)}
                    >
                      x
                    </button>
                  </span>
                ))}
                {attachments.map((att) => (
                  <span
                    key={att.id}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {att.filename} • {att.mime_type}
                  </span>
                ))}
              </div>
            )}
            <AudioRecorderControl
              disabled={loading || uploading}
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
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Áudio pronto para envio</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingRecordedAudio(null)}
                      disabled={loading || uploading}
                    >
                      Cancelar e apagar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSend}
                      disabled={loading || uploading}
                    >
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
              <Button variant="outline" onClick={handleAttachmentClick} disabled={uploading || loading}>
                {uploading ? "Processando..." : "Anexar arquivo"}
              </Button>
              <Button
                onClick={handleSend}
                disabled={
                  loading ||
                  uploading ||
                  (!input.trim() && pendingAttachments.length === 0 && !pendingRecordedAudio)
                }
              >
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
