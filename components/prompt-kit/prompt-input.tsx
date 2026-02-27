"use client"

import { createContext, useContext } from "react"
import type { FormHTMLAttributes, HTMLAttributes, TextareaHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type PromptInputContextValue = {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null)

function usePromptInputContext() {
  const context = useContext(PromptInputContext)
  if (!context) {
    throw new Error("PromptInput components must be used within PromptInput")
  }
  return context
}

type PromptInputProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  onSubmit: () => void
}

export function PromptInput({
  className,
  value,
  onValueChange,
  isLoading = false,
  onSubmit,
  children,
  ...props
}: PromptInputProps) {
  return (
    <PromptInputContext.Provider
      value={{
        value,
        onValueChange,
        isLoading,
        onSubmit,
      }}
    >
      <form
        className={cn(
          "rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm",
          className
        )}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  )
}

export function PromptInputTextarea({
  className,
  onChange,
  onKeyDown,
  value,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const context = usePromptInputContext()
  const resolvedValue = value ?? context.value

  return (
    <textarea
      className={cn(
        "min-h-[88px] w-full resize-none border-0 bg-transparent px-1 py-0 text-sm",
        "outline-none ring-0 transition placeholder:text-muted-foreground/80 focus-visible:ring-0",
        className
      )}
      value={resolvedValue}
      onChange={(event) => {
        context.onValueChange(event.target.value)
        onChange?.(event)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault()
          context.onSubmit()
        }
        onKeyDown?.(event)
      }}
      disabled={context.isLoading || props.disabled}
      {...props}
    />
  )
}

export function PromptInputActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between gap-2 pt-3", className)} {...props} />
}

type PromptInputActionProps = HTMLAttributes<HTMLDivElement> & {
  tooltip?: string
}

export function PromptInputAction({ className, tooltip, ...props }: PromptInputActionProps) {
  return <div className={cn("flex items-center", className)} title={tooltip} {...props} />
}
