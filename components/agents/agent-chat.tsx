"use client"

import { useMemo, useState } from "react"
import { ArrowUp, Paperclip, Plus, Square, Trash, X } from "lucide-react"

import {
  deleteConversation,
  getConversationAttachments,
  getConversationMessages,
  getUserConversations,
  type ConversationAttachment,
  type ConversationSummary,
} from "@/app/actions/ai-agents"
import { PromptKitChatShell } from "@/components/chat/promptkit-chat-shell"
import { PromptKitMessageList } from "@/components/chat/promptkit-message-list"
import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from "@/components/prompt-kit/file-upload"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useChatSession } from "@/hooks/use-chat-session"
import { mapAgentMessagesToVM } from "@/lib/chat/adapters/agent"
import { createClient } from "@/lib/supabase/client"

type AgentChatProps = {
  agentId: string
  agentName: string
  workspaceId: string
  initialConversations: ConversationSummary[]
  initialMessages: Awaited<ReturnType<typeof getConversationMessages>>
  initialConversationId: string | null
}

type PendingUpload = {
  id: string
  file: File
  filename: string
  mimeType: string
  sizeBytes: number
  status: "queued" | "uploading" | "error"
  error?: string
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
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<ConversationAttachment[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<PendingUpload[]>([])
  const [uploading, setUploading] = useState(false)

  const session = useChatSession({
    endpoint: "/api/ai/agents/chat",
    initialConversationId,
    initialMessages: mapAgentMessagesToVM(initialMessages),
    buildPayload: ({ conversationId, message }) => ({
      agentId,
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
    const updated = await getUserConversations(agentId, workspaceId)
    setConversations(updated)
  }

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedId(conversationId)
    const [conversationMessages, files] = await Promise.all([
      getConversationMessages(conversationId),
      getConversationAttachments(conversationId),
    ])

    session.reload({
      conversationId,
      messages: mapAgentMessagesToVM(conversationMessages),
    })
    setAttachments(files)
  }

  const handleNewConversation = () => {
    setSelectedId(null)
    setAttachments([])
    setPendingAttachments([])
    setInput("")
    session.reset()
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm("Excluir esta conversa? Essa ação é irreversível.")) return

    const result = await deleteConversation({ conversationId })
    if (result?.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
      return
    }

    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId))

    if (selectedId === conversationId) {
      handleNewConversation()
    }
  }

  const queueFiles = (newFiles: File[]) => {
    const allowedTypes = new Set(["text/plain", "text/csv", "application/pdf"])
    const allowedExtensions = new Set(["txt", "csv", "pdf"])
    const maxSizeBytes = 25 * 1024 * 1024

    const toQueue: PendingUpload[] = []
    for (const file of newFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase()
      const typeAllowed = allowedTypes.has(file.type) || (!!extension && allowedExtensions.has(extension))
      if (!typeAllowed) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name}: tipo de arquivo não suportado.`,
          variant: "destructive",
        })
        continue
      }

      if (file.size > maxSizeBytes) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name}: limite de 25MB.`,
          variant: "destructive",
        })
        continue
      }

      toQueue.push({
        id: `${Date.now()}-${file.name}`,
        file,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        status: "queued",
      })
    }

    if (toQueue.length) {
      setPendingAttachments((prev) => [...prev, ...toQueue])
    }
  }

  const handleRemovePending = (id: string) => {
    setPendingAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleSend = async () => {
    const hasPending = pendingAttachments.length > 0
    if (!input.trim() && !hasPending) return

    const messageText = input.trim() || (hasPending ? "Enviei um arquivo para análise." : "")
    setInput("")

    let resolvedConversationId = selectedId

    try {
      if (hasPending) {
        setUploading(true)
        const supabase = createClient()
        const queued = [...pendingAttachments]

        for (const pending of queued) {
          setPendingAttachments((prev) =>
            prev.map((item) =>
              item.id === pending.id ? { ...item, status: "uploading", error: undefined } : item
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
            throw new Error(errorMessage)
          }

          resolvedConversationId = prepareResult.conversationId
          setSelectedId(prepareResult.conversationId)
          session.setConversationId(prepareResult.conversationId)

          const uploadResult = await supabase.storage
            .from(prepareResult.bucket)
            .upload(prepareResult.storagePath, pending.file, {
              contentType: pending.mimeType,
              upsert: false,
            })

          if (uploadResult.error) {
            throw new Error(uploadResult.error.message || "Falha ao enviar arquivo")
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
            throw new Error(commitResult.error || "Falha ao salvar anexo")
          }

          setAttachments((prev) => [commitResult.attachment, ...prev])
          setPendingAttachments((prev) => prev.filter((item) => item.id !== pending.id))
        }
      }

      const response = await session.send(messageText, { conversationIdOverride: resolvedConversationId })
      if (!response.ok) {
        toast({ title: "Erro", description: response.error, variant: "destructive" })
        return
      }

      if (response.conversationId && !selectedId) {
        setSelectedId(response.conversationId)
        const files = await getConversationAttachments(response.conversationId)
        setAttachments(files)
      }

      await refreshConversations()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar sua mensagem.", variant: "destructive" })
    } finally {
      setUploading(false)
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
      chatContent={
        <>
          <PromptKitMessageList
            messages={session.messages}
            isLoading={session.status === "sending"}
            loadingLabel="Gerando resposta..."
            assistantLabel="Agente"
          />
          <FileUpload onFilesAdded={queueFiles} accept=".txt,.pdf,.csv">
            <PromptInput
              value={input}
              onValueChange={setInput}
              isLoading={session.status === "sending" || session.status === "streaming" || uploading}
              onSubmit={handleSend}
              className="w-full"
            >
              {(pendingAttachments.length > 0 || attachments.length > 0) && (
                <div className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2">
                  {pendingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                        att.status === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="size-4" />
                        <span className="max-w-[180px] truncate">{att.filename}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePending(att.id)}
                        className="rounded-full p-1 hover:bg-secondary/60"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
                    >
                      <Paperclip className="size-4" />
                      <span className="max-w-[180px] truncate">{att.filename}</span>
                    </div>
                  ))}
                </div>
              )}

              <PromptInputTextarea placeholder="Type a message or drop files..." />

              <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
                <PromptInputAction tooltip="Attach files">
                  <FileUploadTrigger asChild>
                    <div className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl">
                      <Paperclip className="text-primary size-5" />
                    </div>
                  </FileUploadTrigger>
                </PromptInputAction>

                <PromptInputAction tooltip={uploading ? "Stop generation" : "Send message"}>
                  <Button
                    type="submit"
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={(session.status !== "idle" && !uploading) || (!input.trim() && pendingAttachments.length === 0)}
                  >
                    {uploading ? <Square className="size-5 fill-current" /> : <ArrowUp className="size-5" />}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>

            <FileUploadContent>
              <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
                <div className="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
                  <div className="mb-4 flex justify-center">
                    <Paperclip className="text-muted size-8" />
                  </div>
                  <h3 className="mb-2 text-center text-base font-medium">Drop files to upload</h3>
                  <p className="text-muted-foreground text-center text-sm">Release to add files to your message</p>
                </div>
              </div>
            </FileUploadContent>
          </FileUpload>

          {session.error ? <p className="text-xs text-destructive">Erro: {session.error}</p> : null}
        </>
      }
    />
  )
}
