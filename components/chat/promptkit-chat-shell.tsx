"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PromptKitChatShellProps = {
  sidebarTitle: string
  sidebarAction?: ReactNode
  sidebarContent: ReactNode
  chatTitle: string
  chatDescription?: ReactNode
  chatContent: ReactNode
  className?: string
}

export function PromptKitChatShell({
  sidebarTitle,
  sidebarAction,
  sidebarContent,
  chatContent,
  className,
}: PromptKitChatShellProps) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[210px_1fr]", className)}>
      <Card className="h-fit border-primary/20 bg-gradient-to-b from-card to-muted/20 shadow-sm">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">{sidebarTitle}</CardTitle>
          {sidebarAction}
        </CardHeader>
        <CardContent>{sidebarContent}</CardContent>
      </Card>

      <div className="flex h-[78vh] min-h-[560px] max-h-[calc(100vh-8.5rem)] min-h-0 flex-col gap-4 overflow-hidden">
        {chatContent}
      </div>
    </div>
  )
}
