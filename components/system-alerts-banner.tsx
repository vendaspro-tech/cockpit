'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertTriangle, AlertCircle, CheckCircle, X } from "lucide-react"
import { useState } from "react"
import { SystemAlert } from "@/app/actions/system-alerts"

interface SystemAlertsBannerProps {
  alerts: SystemAlert[]
}

const TYPE_ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle
}

const TYPE_STYLES = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  error: "bg-red-500/10 text-red-600 border-red-500/20",
  success: "bg-green-500/10 text-green-600 border-green-500/20"
}

export function SystemAlertsBanner({ alerts }: SystemAlertsBannerProps) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts)

  if (visibleAlerts.length === 0) return null

  const handleDismiss = (id: string) => {
    setVisibleAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-2 mb-4">
      {visibleAlerts.map(alert => {
        const Icon = TYPE_ICONS[alert.type]
        return (
          <Alert key={alert.id} className={`${TYPE_STYLES[alert.type]} relative`}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>
              {alert.message}
            </AlertDescription>
            <button 
              onClick={() => handleDismiss(alert.id)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </Alert>
        )
      })}
    </div>
  )
}
