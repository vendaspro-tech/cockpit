import { getUserNotifications } from "@/app/actions/notifications"
import { NotificationsClient } from "./notifications-client"
import { Bell } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface NotificationsPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { workspaceId } = await params
  const notifications = await getUserNotifications(workspaceId)
  const newCount = notifications.filter(n => n.status === 'new').length

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Central de Notificações
          </h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe as atualizações e comunicados importantes do Cockpit.
          </p>
        </div>
        {newCount > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {newCount} {newCount === 1 ? 'nova mensagem' : 'novas mensagens'}
          </Badge>
        )}
      </div>

      <Separator className="my-6" />

      <NotificationsClient notifications={notifications} workspaceId={workspaceId} />
    </div>
  )
}
