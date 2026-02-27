"use client"

import { ArrowUp, Square } from "lucide-react"
import type { ReactNode } from "react"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"

type PromptKitComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
  submitLabel?: string
  leftTools?: ReactNode
}

export function PromptKitComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  submitLabel,
  leftTools,
}: PromptKitComposerProps) {
  const isLoading = disabled

  return (
    <PromptInput value={value} onValueChange={onChange} isLoading={isLoading} onSubmit={onSubmit}>
      <PromptInputTextarea placeholder={placeholder} />

      <PromptInputActions>
        <div className="flex items-center gap-2">
          {leftTools}
          {submitLabel ? <span className="text-xs text-muted-foreground">{submitLabel}</span> : null}
        </div>

        <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
          <Button type="submit" variant="default" size="icon" className="h-8 w-8 rounded-full" disabled={isLoading || !value.trim()}>
            {isLoading ? <Square className="size-4 fill-current" /> : <ArrowUp className="size-4" />}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  )
}
