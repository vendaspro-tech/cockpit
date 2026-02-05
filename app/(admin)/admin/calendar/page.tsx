import { CalendarView } from "@/components/admin/calendar-view"
import { getEvents, getEventTemplates, getEventCategories, getEventInstructors } from "@/app/actions/admin/events"
import { getPlans } from "@/app/actions/admin/plans"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryManager, InstructorManager, TemplatesPanel } from "@/components/admin/event-taxonomy-panels"

export default async function AdminCalendarPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const [events, plans, templates, categories, instructors] = await Promise.all([
    getEvents(),
    getPlans(),
    getEventTemplates(),
    getEventCategories(),
    getEventInstructors()
  ])

  // Transform events to match the interface expected by CalendarView
  // The query returns plans as an object, but we need to ensure it's properly typed
  const formattedEvents = events.map((event: any) => ({
    ...event,
    start_time: event.start_time,
    end_time: event.end_time,
    plans: event.plans // This comes from the join query
  }))

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendário de Eventos</h1>
        <p className="text-muted-foreground">
          Gerencie eventos, categorias, templates e instrutores.
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="instructors">Instrutores</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView
            events={formattedEvents}
            plans={plans}
            templates={templates}
            categories={categories}
            instructors={instructors}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager categories={categories} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesPanel templates={templates} />
        </TabsContent>

        <TabsContent value="instructors">
          <InstructorManager instructors={instructors} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
