import { useEffect, useState } from "react"

type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

// Simple event emitter for toasts
const listeners: Set<(toasts: Toast[]) => void> = new Set()
let toasts: Toast[] = []

function emit() {
  listeners.forEach((listener) => listener([...toasts]))
}

export function toast({
  title,
  description,
  variant = "default",
  duration = 3000,
}: {
  title: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}) {
  const id = Math.random().toString(36).substring(2, 9)
  const type = variant === "destructive" ? "error" : "success"
  
  const newToast: Toast = { id, title, description, type, duration }
  toasts = [...toasts, newToast]
  emit()

  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      emit()
    }, duration)
  }
}

export function useToast() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>(toasts)

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setActiveToasts(newToasts)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    toast,
    toasts: activeToasts,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id)
      emit()
    },
  }
}
