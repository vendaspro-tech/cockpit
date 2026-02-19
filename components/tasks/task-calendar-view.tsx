'use client'

import { UnifiedTask } from "@/lib/types/task"
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState } from "react"
import { cn } from "@/lib/utils"

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

interface TaskCalendarViewProps {
  tasks: UnifiedTask[]
}

import { CalendarToolbar } from "@/components/shared"

// ... imports

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const [view, setView] = useState<any>(Views.MONTH)
  const [date, setDate] = useState(new Date())

  const events = tasks
    .filter(task => task.due_date)
    .map(task => ({
      id: task.id,
      title: task.type === 'pdi_action' ? `PDI: ${task.title}` : task.title,
      start: new Date(task.due_date!),
      end: new Date(task.due_date!),
      allDay: true,
      resource: task
    }))

  const eventStyleGetter = (event: any) => {
    const task = event.resource as UnifiedTask
    let backgroundColor = '#3b82f6' // blue-500
    
    if (task.status === 'done') {
      backgroundColor = '#22c55e' // green-500
    } else if (task.priority === 'P1') {
      backgroundColor = '#ef4444' // red-500
    } else if (task.priority === 'P2') {
      backgroundColor = '#eab308' // yellow-500
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-card p-4 rounded-lg border shadow-sm calendar-wrapper">
      <style jsx global>{`
        .calendar-wrapper .rbc-calendar {
          background: transparent;
        }
        /* Month view header */
        .calendar-wrapper .rbc-header {
          padding: 8px 0;
          font-weight: 600;
          color: var(--muted-foreground);
          font-size: 0.875rem;
          border-bottom: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-header + .rbc-header {
          border-left: 1px solid var(--border) !important;
        }
        /* Month view */
        .calendar-wrapper .rbc-month-view {
          border-radius: 0.5rem;
          border: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-month-row {
          border-top: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-month-row:first-child {
          border-top: none !important;
        }
        .calendar-wrapper .rbc-day-bg {
          border-left: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-day-bg:first-child {
          border-left: none !important;
        }
        .calendar-wrapper .rbc-off-range-bg {
          background-color: rgba(128, 128, 128, 0.1) !important;
        }
        .calendar-wrapper .rbc-today {
          background-color: rgba(160, 141, 90, 0.15) !important;
        }
        .calendar-wrapper .rbc-date-cell {
          color: var(--foreground);
        }
        .calendar-wrapper .rbc-off-range .rbc-button-link {
          color: var(--muted-foreground);
        }
        .calendar-wrapper .rbc-toolbar button {
          color: var(--foreground);
          border-color: var(--border);
        }
        .calendar-wrapper .rbc-toolbar button:hover {
          background-color: var(--accent);
        }
        .calendar-wrapper .rbc-toolbar button.rbc-active {
          background-color: var(--primary);
          color: var(--primary-foreground);
        }
        /* Time view (Week/Day) */
        .calendar-wrapper .rbc-time-view {
          border: 1px solid var(--border) !important;
          border-radius: 0.5rem;
        }
        .calendar-wrapper .rbc-time-header {
          border-bottom: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-time-header-content {
          border-left: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-time-header-gutter {
          border-right: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-allday-cell {
          border-bottom: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-time-content {
          border-top: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-time-gutter {
          color: var(--muted-foreground);
          font-size: 0.75rem;
        }
        .calendar-wrapper .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: 1px solid rgba(128, 128, 128, 0.3) !important;
        }
        .calendar-wrapper .rbc-time-column {
          border-left: 1px solid var(--border) !important;
        }
        .calendar-wrapper .rbc-time-column:first-child {
          border-left: none !important;
        }
        .calendar-wrapper .rbc-timeslot-group {
          border-bottom: 1px solid rgba(128, 128, 128, 0.3) !important;
          min-height: 40px;
        }
        .calendar-wrapper .rbc-time-slot {
          border-top: 1px solid rgba(128, 128, 128, 0.15) !important;
        }
        .calendar-wrapper .rbc-time-slot:first-child {
          border-top: none !important;
        }
        .calendar-wrapper .rbc-current-time-indicator {
          background-color: var(--primary);
          height: 2px;
        }
        .calendar-wrapper .rbc-label {
          color: var(--muted-foreground);
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture="pt-BR"
        views={['month', 'week', 'day']}
        view={view} // Controlled view
        onView={setView}
        date={date} // Controlled date
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CalendarToolbar,
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
          noEventsInRange: "Não há tarefas neste período."
        }}
      />
    </div>
  )
}
