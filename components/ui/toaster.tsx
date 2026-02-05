"use client"

import { useToast } from "@/hooks/use-toast"
import { X, CheckCircle, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-right-full
            ${
              toast.type === "error"
                ? "bg-destructive text-destructive-foreground border-destructive/20"
                : "bg-background text-foreground border-border"
            }
          `}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
          )}
          
          <div className="flex-1 gap-1">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            {toast.description && (
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            )}
          </div>

          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
