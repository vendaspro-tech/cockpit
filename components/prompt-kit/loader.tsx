"use client"

import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"
type LoaderVariant =
  | "circular"
  | "classic"
  | "pulse"
  | "pulse-dot"
  | "dots"
  | "typing"
  | "wave"
  | "bars"
  | "terminal"
  | "text-blink"
  | "text-shimmer"
  | "loading-dots"

type LoaderProps = HTMLAttributes<HTMLDivElement> & {
  variant?: LoaderVariant
  size?: LoaderSize
}

const sizeClass: Record<LoaderSize, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
}

const textSizeClass: Record<LoaderSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

export function Loader({ className, variant = "dots", size = "md", ...props }: LoaderProps) {
  if (variant === "circular") {
    return (
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-foreground",
          size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5",
          className
        )}
        {...props}
      />
    )
  }

  if (variant === "classic" || variant === "typing" || variant === "dots") {
    return (
      <div className={cn("inline-flex items-center gap-1", className)} {...props}>
        <span className={cn(sizeClass[size], "animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]")} />
        <span className={cn(sizeClass[size], "animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]")} />
        <span className={cn(sizeClass[size], "animate-bounce rounded-full bg-muted-foreground")} />
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("inline-flex items-center", className)} {...props}>
        <span className={cn(size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5", "animate-pulse rounded-full bg-muted-foreground")} />
      </div>
    )
  }

  if (variant === "pulse-dot") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)} {...props}>
        <span className={cn(sizeClass[size], "animate-ping rounded-full bg-muted-foreground")} />
      </div>
    )
  }

  if (variant === "wave") {
    return (
      <div className={cn("inline-flex items-end gap-1", className)} {...props}>
        <span className="h-2 w-1 animate-pulse rounded bg-muted-foreground [animation-delay:-0.2s]" />
        <span className="h-4 w-1 animate-pulse rounded bg-muted-foreground [animation-delay:-0.1s]" />
        <span className="h-3 w-1 animate-pulse rounded bg-muted-foreground" />
      </div>
    )
  }

  if (variant === "bars") {
    return (
      <div className={cn("inline-flex items-end gap-1", className)} {...props}>
        <span className="h-2 w-1 animate-bounce rounded bg-muted-foreground [animation-delay:-0.2s]" />
        <span className="h-4 w-1 animate-bounce rounded bg-muted-foreground [animation-delay:-0.1s]" />
        <span className="h-3 w-1 animate-bounce rounded bg-muted-foreground" />
      </div>
    )
  }

  if (variant === "terminal") {
    return (
      <div className={cn("inline-flex items-center gap-1 font-mono", textSizeClass[size], className)} {...props}>
        <span className="text-muted-foreground">$</span>
        <span className="animate-pulse text-foreground">_</span>
      </div>
    )
  }

  if (variant === "text-blink") {
    return (
      <div className={cn("font-medium animate-pulse", textSizeClass[size], className)} {...props}>
        Loading
      </div>
    )
  }

  if (variant === "text-shimmer") {
    return (
      <div className={cn("font-medium text-transparent bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text animate-pulse", textSizeClass[size], className)} {...props}>
        Loading
      </div>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-1", textSizeClass[size], className)} {...props}>
      <span className="text-muted-foreground">Loading</span>
      <span className="animate-bounce text-muted-foreground [animation-delay:-0.2s]">.</span>
      <span className="animate-bounce text-muted-foreground [animation-delay:-0.1s]">.</span>
      <span className="animate-bounce text-muted-foreground">.</span>
    </div>
  )
}
