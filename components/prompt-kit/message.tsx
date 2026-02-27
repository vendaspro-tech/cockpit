"use client"

import type { ComponentProps, HTMLAttributes } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function Message({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex w-full items-end gap-2", className)} {...props} />
}

type MessageAvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  className?: string
}

export function MessageAvatar({ src, alt = "Avatar", fallback = "AI", className }: MessageAvatarProps) {
  return (
    <Avatar className={cn("h-7 w-7 border border-border/70", className)}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}

export function MessageContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap",
        "border-border bg-muted text-foreground",
        className
      )}
      {...props}
    />
  )
}
