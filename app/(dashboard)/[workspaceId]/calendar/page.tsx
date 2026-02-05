import { WorkspaceCalendarView } from "@/components/workspace/calendar-view"
import { getWorkspaceEvents } from "@/app/actions/workspace/events"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspaceCalendarPage({ params }: PageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const events = await getWorkspaceEvents(workspaceId)

  // Transform events to match the interface expected by CalendarView
  const formattedEvents = events.map((event: any) => ({
    ...event,
    start_time: event.start_time,
    end_time: event.end_time,
    plans: event.plans
  }))

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">
          Visualize seus eventos e treinamentos agendados.
        </p>
      </div>

      <WorkspaceCalendarView events={formattedEvents} />
    </div>
  )
}
