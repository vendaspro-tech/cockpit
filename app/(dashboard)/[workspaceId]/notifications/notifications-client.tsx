'use client'

import { Notification, markNotificationAsRead, archiveNotification } from "@/app/actions/notifications"
import { Card } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, CheckCircle, Info, Calendar, Clock, Archive, Check, Inbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState, useTransition } from "react"
import { toast } from "@/hooks/use-toast"

interface NotificationsClientProps {
  notifications: Notification[]
  workspaceId: string
}

function NotificationsEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/30 rounded-xl border border-dashed">
      <div className="rounded-full bg-background p-4 shadow-sm mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100",
    label: "Informativo"
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-100",
    label: "Atenção"
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-100",
    label: "Urgente"
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100",
    label: "Sucesso"
  }
}

export function NotificationsClient({ notifications, workspaceId }: NotificationsClientProps) {
  const [isPending, startTransition] = useTransition()
  
  // Optimistic state could be complex, relying on router refresh for simplicity first.
  // But to make it snappy, we can filter locally while waiting.
  // Let's just use router.refresh() via server action revalidatePath.
  
  const handleMarkAsRead = async (id: string, source: Notification["source"]) => {
    startTransition(async () => {
      await markNotificationAsRead(id, source, workspaceId)
      toast({ title: "Sucesso", description: "Notificação marcada como lida." })
    })
  }

  const handleArchive = async (id: string, source: Notification["source"]) => {
    startTransition(async () => {
      await archiveNotification(id, source, workspaceId)
      toast({ title: "Sucesso", description: "Notificação arquivada." })
    })
  }

  const newNotifications = notifications.filter(n => n.status === 'new')
  const readNotifications = notifications.filter(n => n.status === 'read')
  const archivedNotifications = notifications.filter(n => n.status === 'archived')

  const NotificationCard = ({ notification, showActions = true }: { notification: Notification, showActions?: boolean }) => {
    const config = TYPE_CONFIG[notification.type]
    const Icon = config.icon

    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 ${config.border} ${notification.type === 'info' ? 'border-l-blue-500' : notification.type === 'warning' ? 'border-l-amber-500' : notification.type === 'error' ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
        <div className={`p-2 flex gap-3 items-start ${config.bg}`}>
          {/* Icon Column */}
          <div className={`mt-0.5 shrink-0`}>
            <div className={`p-1 rounded-full bg-white dark:bg-background shadow-sm ${config.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Content Column */}
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="outline" className={`${config.badge} border-0 font-medium px-1.5 py-0 text-[10px] h-4`}>
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(notification.start_date), "d 'de' MMM", { locale: ptBR })}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-tight text-foreground truncate pr-2">
              {notification.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Actions Column */}
          {showActions && (
            <div className="flex items-center gap-0.5 shrink-0 self-center">
              {notification.status === 'new' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                        onClick={() => handleMarkAsRead(notification.id, notification.source)}
                        disabled={isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="sr-only">Marcar como lida</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Marcar como lida</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {notification.status !== 'archived' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => handleArchive(notification.id, notification.source)}
                        disabled={isPending}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span className="sr-only">Arquivar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Arquivar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="new" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-[400px] mb-6">
        <TabsTrigger value="new" className="relative">
          Novas
          {newNotifications.length > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {newNotifications.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="read">Lidas</TabsTrigger>
        <TabsTrigger value="archived">Arquivadas</TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="space-y-4">
        {newNotifications.length === 0 ? (
          <NotificationsEmptyState message="Você não tem novas notificações." />
        ) : (
          newNotifications.map(n => <NotificationCard key={n.id} notification={n} />)
        )}
      </TabsContent>

      <TabsContent value="read" className="space-y-4">
        {readNotifications.length === 0 ? (
          <NotificationsEmptyState message="Nenhuma notificação lida recentemente." />
        ) : (
          readNotifications.map(n => <NotificationCard key={n.id} notification={n} />)
        )}
      </TabsContent>

      <TabsContent value="archived" className="space-y-4">
        {archivedNotifications.length === 0 ? (
          <NotificationsEmptyState message="Arquivo vazio." />
        ) : (
          archivedNotifications.map(n => <NotificationCard key={n.id} notification={n} showActions={false} />)
        )}
      </TabsContent>
    </Tabs>
  )
}
