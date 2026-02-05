'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, Users, Link as LinkIcon, User, Tag, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarToolbar } from "@/components/shared"
import { CalendarEvent } from "@/components/calendar-event"

const locales = {
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Event {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  plan_id: string
  target_profiles: string[]
  category?: string | null
  instructor_name?: string | null
  location_url?: string | null
  recurrence_frequency?: 'none' | 'daily' | 'weekly' | 'monthly' | null
  recurrence_until?: string | null
  plans?: {
    name: string
    color: string
  }
}

interface CalendarViewProps {
  events: Event[]
}

export function WorkspaceCalendarView({ events }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const expandOccurrences = (event: Event) => {
    const occurrences: any[] = []
    const frequency = event.recurrence_frequency || 'none'
    const until = event.recurrence_until ? new Date(event.recurrence_until) : null

    let currentStart = new Date(event.start_time)
    let currentEnd = new Date(event.end_time)
    let iterations = 0

    const pushOccurrence = () => {
      occurrences.push({
        ...event,
        start: new Date(currentStart),
        end: new Date(currentEnd),
        resource: event
      })
    }

    pushOccurrence()

    while (frequency !== 'none') {
      iterations += 1
      if (iterations > 50) break // safety

      switch (frequency) {
        case 'daily':
          currentStart = addDays(currentStart, 1)
          currentEnd = addDays(currentEnd, 1)
          break
        case 'weekly':
          currentStart = addDays(currentStart, 7)
          currentEnd = addDays(currentEnd, 7)
          break
        case 'monthly':
          currentStart = addMonths(currentStart, 1)
          currentEnd = addMonths(currentEnd, 1)
          break
      }

      if (until && currentStart > until) break
      occurrences.push({
        ...event,
        start: new Date(currentStart),
        end: new Date(currentEnd),
        resource: event
      })
    }

    return occurrences
  }

  const formattedEvents = useMemo(() => {
    return events.flatMap(expandOccurrences)
  }, [events])

  const eventStyleGetter = (event: any) => {
    const color = event.resource.plans?.[0]?.color || '#3b82f6'
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'block',
        boxShadow: `0 5px 15px ${color}30`
      }
    }
  }

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource)
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
      <style jsx global>{`
        .rbc-calendar {
          background: var(--card);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .rbc-toolbar {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .rbc-toolbar button {
          border-radius: 10px;
          color: var(--foreground);
          border-color: var(--border);
        }
        .rbc-toolbar button:hover {
          background-color: var(--accent);
        }
        .rbc-toolbar button.rbc-active {
          background-color: var(--primary);
          color: var(--primary-foreground);
        }
        /* Month view header */
        .rbc-header {
          padding: 10px 0;
          font-weight: 650;
          color: var(--foreground);
          border-bottom: 1px solid var(--border) !important;
          background: rgba(128, 128, 128, 0.1);
          text-transform: lowercase;
        }
        .rbc-header span:first-letter {
          text-transform: capitalize;
        }
        .rbc-header + .rbc-header {
          border-left: 1px solid var(--border) !important;
        }
        /* Month view */
        .rbc-month-view {
          background: transparent;
          border: 1px solid var(--border) !important;
          border-radius: 0.5rem;
        }
        .rbc-month-row {
          border-top: 1px solid var(--border) !important;
        }
        .rbc-month-row:first-child {
          border-top: none !important;
        }
        .rbc-day-bg {
          border-left: 1px solid var(--border) !important;
        }
        .rbc-day-bg:first-child {
          border-left: none !important;
        }
        .rbc-row-segment {
          padding: 2px 4px;
        }
        .rbc-off-range-bg {
          background: rgba(128, 128, 128, 0.1) !important;
        }
        .rbc-today {
          background: rgba(160, 141, 90, 0.15) !important;
        }
        .rbc-date-cell {
          padding: 6px 8px;
          text-align: left;
          color: var(--foreground);
        }
        .rbc-off-range .rbc-button-link {
          color: var(--muted-foreground);
        }
        /* Time view (Week/Day) */
        .rbc-time-view {
          background: transparent;
          border: 1px solid var(--border) !important;
          border-radius: 0.5rem;
        }
        .rbc-time-header {
          border-bottom: 1px solid var(--border) !important;
        }
        .rbc-time-header-content {
          border-left: 1px solid var(--border) !important;
        }
        .rbc-time-header-gutter {
          border-right: 1px solid var(--border) !important;
        }
        .rbc-allday-cell {
          border-bottom: 1px solid var(--border) !important;
        }
        .rbc-time-content {
          border-top: 1px solid var(--border) !important;
        }
        .rbc-time-gutter {
          color: var(--muted-foreground);
          font-size: 0.75rem;
        }
        .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: 1px solid rgba(128, 128, 128, 0.3) !important;
        }
        .rbc-time-column {
          border-left: 1px solid var(--border) !important;
        }
        .rbc-time-column:first-child {
          border-left: none !important;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid rgba(128, 128, 128, 0.3) !important;
          min-height: 40px;
        }
        .rbc-time-slot {
          border-top: 1px solid rgba(128, 128, 128, 0.15) !important;
        }
        .rbc-time-slot:first-child {
          border-top: none !important;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid rgba(128, 128, 128, 0.15) !important;
        }
        .rbc-current-time-indicator {
          background-color: var(--primary);
          height: 2px;
        }
        /* Events */
        .rbc-event {
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 4px 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .rbc-day-slot .rbc-event {
          margin: 2px 4px;
        }
        .rbc-show-more {
          color: var(--primary);
        }
        .rbc-agenda-view table.rbc-agenda-table {
          border-color: var(--border);
        }
        .rbc-label {
          color: var(--muted-foreground);
        }
        .rbc-selected-cell,
        .rbc-slot-selection {
          background: rgba(160, 141, 90, 0.2) !important;
          border: 1px dashed rgba(160, 141, 90, 0.6) !important;
        }
      `}</style>
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2 shadow-sm hover:bg-primary/5 hover:text-primary transition-colors" disabled>
          <CalendarIcon className="h-4 w-4" />
          Sincronizar com Google Agenda
          <Badge variant="secondary" className="ml-1 text-[10px] h-5">Em breve</Badge>
        </Button>
      </div>

      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <Calendar
          localizer={localizer}
          events={formattedEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CalendarToolbar,
            event: CalendarEvent
          }}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Sem eventos neste período."
          }}
          culture='pt-BR'
          className="p-4"
        />
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Detalhes do evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {selectedEvent && format(new Date(selectedEvent.start_time), "dd/MM/yyyy HH:mm")} - 
                {selectedEvent && format(new Date(selectedEvent.end_time), "HH:mm")}
              </span>
            </div>
            
            {selectedEvent?.target_profiles && selectedEvent.target_profiles.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <div className="flex gap-1">
                  {selectedEvent.target_profiles.map(profile => (
                    <Badge key={profile} variant="secondary" className="text-xs">
                      {profile}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent?.category && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>{selectedEvent.category}</span>
              </div>
            )}

            {selectedEvent?.instructor_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{selectedEvent.instructor_name}</span>
              </div>
            )}

            {selectedEvent?.location_url && (
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={selectedEvent.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Abrir link
                </a>
              </div>
            )}

            {selectedEvent?.recurrence_frequency && selectedEvent.recurrence_frequency !== 'none' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Repeat className="h-4 w-4" />
                <span>
                  Recorrência: {selectedEvent.recurrence_frequency === 'daily' ? 'Diária' :
                    selectedEvent.recurrence_frequency === 'weekly' ? 'Semanal' :
                    selectedEvent.recurrence_frequency === 'monthly' ? 'Mensal' : 'Recorrente'}
                  {selectedEvent.recurrence_until ? ` até ${format(new Date(selectedEvent.recurrence_until), "dd/MM/yyyy")}` : ""}
                </span>
              </div>
            )}

            <div className="bg-muted p-4 rounded-md text-sm">
              {selectedEvent?.description || "Sem descrição."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
