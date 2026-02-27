"use client"

import { useEffect, useRef } from "react"

import { ChatContainerAnchor, ChatContainerContent, ChatContainerRoot } from "@/components/prompt-kit/chat-container"
import { Loader } from "@/components/prompt-kit/loader"
import { Markdown } from "@/components/prompt-kit/markdown"
import { Message, MessageAvatar, MessageContent } from "@/components/prompt-kit/message"
import { ScrollButton } from "@/components/prompt-kit/scroll-button"
import { cn } from "@/lib/utils"
import type { ChatMessageVM } from "@/lib/chat/types"

type PromptKitMessageListProps = {
  messages: ChatMessageVM[]
  loadingLabel?: string
  isLoading?: boolean
  assistantLabel?: string
  userLabel?: string
  className?: string
}

export function PromptKitMessageList({
  messages,
  loadingLabel = "Gerando resposta...",
  isLoading = false,
  assistantLabel = "Agente",
  userLabel = "Você",
  className,
}: PromptKitMessageListProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = contentRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <ChatContainerRoot className={cn("min-h-0 flex-1", className)}>
      <ChatContainerContent ref={contentRef}>
        <div className="space-y-3">
          {messages.map((message) => {
            if (!message.content.trim() && message.role === "assistant") {
              return null
            }

            const isUser = message.role === "user"
            return (
              <Message key={message.id} className={cn(isUser ? "justify-end" : "justify-start")}>
                {!isUser ? (
                  <MessageAvatar src="/avatars/ai.png" alt={assistantLabel} fallback={assistantLabel.slice(0, 2)} />
                ) : null}
                <div className="max-w-[85%] flex-1 sm:max-w-[75%]">
                  {isUser ? (
                    <MessageContent
                      className={cn(
                        "rounded-br-sm border-primary bg-primary text-primary-foreground",
                        "min-w-[120px]"
                      )}
                    >
                      <p className="mb-1 text-xs text-primary-foreground/80">{userLabel}</p>
                      <Markdown
                        className="prose-invert prose-p:my-1 prose-pre:bg-primary-foreground/10 prose-code:bg-primary-foreground/10"
                      >
                        {message.content}
                      </Markdown>
                    </MessageContent>
                  ) : (
                    <div className="rounded-lg border border-border/70 bg-background/90 p-2 text-foreground">
                      <p className="mb-1 text-xs text-muted-foreground">{assistantLabel}</p>
                      <Markdown>{message.content}</Markdown>
                    </div>
                  )}
                </div>
              </Message>
            )
          })}

          {isLoading && (
            <Message>
              <MessageContent className="bg-muted/40">
                <p className="mb-1 text-xs text-muted-foreground">{assistantLabel}</p>
                <div className="flex items-center gap-2">
                  <Loader variant="typing" size="sm" />
                  <span>{loadingLabel}</span>
                </div>
              </MessageContent>
            </Message>
          )}

          <ChatContainerAnchor />
        </div>
      </ChatContainerContent>

      <ScrollButton containerRef={contentRef} />
    </ChatContainerRoot>
  )
}
