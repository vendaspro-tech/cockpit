"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import type { ChatMessageVM, ChatSessionStatus } from "@/lib/chat/types"

type SendPayload = {
  conversationId: string | null
  message: string
}

type UseChatSessionConfig = {
  endpoint: string
  initialConversationId: string | null
  initialMessages: ChatMessageVM[]
  buildPayload: (payload: SendPayload) => Record<string, unknown>
}

export function useChatSession(config: UseChatSessionConfig) {
  const [conversationId, setConversationId] = useState<string | null>(config.initialConversationId)
  const [messages, setMessages] = useState<ChatMessageVM[]>(config.initialMessages)
  const [status, setStatus] = useState<ChatSessionStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus("idle")
  }, [])

  const reset = useCallback(() => {
    stop()
    setConversationId(null)
    setMessages([])
    setError(null)
    setStatus("idle")
  }, [stop])

  const reload = useCallback((payload: { conversationId: string | null; messages: ChatMessageVM[] }) => {
    stop()
    setConversationId(payload.conversationId)
    setMessages(payload.messages)
    setError(null)
    setStatus("idle")
  }, [stop])

  const send = useCallback(
    async (message: string, options?: { conversationIdOverride?: string | null }) => {
      const messageText = message.trim()
      if (!messageText) return { ok: false as const, error: "Mensagem vazia" }

      if (controllerRef.current) {
        controllerRef.current.abort()
      }

      const nowIso = new Date().toISOString()
      const userMessage: ChatMessageVM = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
        createdAt: nowIso,
      }

      const assistantId = `assistant-${Date.now()}`
      const assistantPlaceholder: ChatMessageVM = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: nowIso,
      }

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder])
      setError(null)
      setStatus("sending")

      const abortController = new AbortController()
      controllerRef.current = abortController

      try {
        const response = await fetch(config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            config.buildPayload({
              conversationId: options?.conversationIdOverride ?? conversationId,
              message: messageText,
            })
          ),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          const responseError = body?.error || "Falha ao enviar mensagem"
          setMessages((prev) => prev.filter((item) => item.id !== assistantId))
          setError(responseError)
          setStatus("error")
          return { ok: false as const, error: responseError }
        }

        const responseConversationId = response.headers.get("x-conversation-id")
        if (responseConversationId) {
          setConversationId(responseConversationId)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("Stream indisponível")
        }

        const decoder = new TextDecoder()
        let accumulated = ""
        setStatus("streaming")

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setMessages((prev) =>
            prev.map((item) => (item.id === assistantId ? { ...item, content: accumulated } : item))
          )
        }

        const finalText = accumulated.trim() || "Não consegui gerar uma resposta agora. Tente novamente."

        setMessages((prev) =>
          prev.map((item) => (item.id === assistantId ? { ...item, content: finalText } : item))
        )

        setStatus("idle")
        return {
          ok: true as const,
          conversationId: responseConversationId,
          assistantText: finalText,
        }
      } catch (caughtError) {
        const aborted = abortController.signal.aborted
        const fallbackMessage = aborted ? "Requisição cancelada" : "Não foi possível enviar sua mensagem."

        setMessages((prev) =>
          prev.map((item) => (item.id === assistantId ? { ...item, content: fallbackMessage } : item))
        )

        setError(fallbackMessage)
        setStatus(aborted ? "idle" : "error")
        return { ok: false as const, error: fallbackMessage }
      } finally {
        if (controllerRef.current === abortController) {
          controllerRef.current = null
        }
      }
    },
    [config, conversationId]
  )

  return useMemo(
    () => ({
      messages,
      status,
      error,
      send,
      stop,
      reset,
      reload,
      conversationId,
      setConversationId,
      setMessages,
    }),
    [messages, status, error, send, stop, reset, reload, conversationId]
  )
}
