"use client"

import type { HTMLAttributes, ReactNode } from "react"
import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"

type MarkdownProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Markdown({ children, className, ...props }: MarkdownProps) {
  const content = typeof children === "string" ? children : String(children ?? "")

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words text-foreground",
        "dark:prose-invert",
        "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
        "prose-li:text-foreground prose-ol:text-foreground prose-ul:text-foreground",
        "prose-blockquote:text-foreground prose-blockquote:border-border/70",
        "prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
        "prose-pre:rounded-md prose-pre:border prose-pre:border-border/70 prose-pre:bg-muted/40 prose-pre:px-3 prose-pre:py-2",
        "prose-code:rounded prose-code:bg-muted/40 prose-code:px-1 prose-code:py-0.5",
        "prose-a:text-foreground prose-a:underline prose-a:underline-offset-4",
        "prose-headings:text-inherit",
        className
      )}
      {...props}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
