"use client"

import { forwardRef } from "react"
import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export const ChatContainerRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-background to-muted/20",
        className
      )}
      {...props}
    />
  )
)
ChatContainerRoot.displayName = "ChatContainerRoot"

export const ChatContainerContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto p-4 md:p-5", className)} {...props} />
  )
)
ChatContainerContent.displayName = "ChatContainerContent"

export function ChatContainerAnchor({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full", className)} {...props} />
}
