"use client"

import { Clock, Users, User, Tag } from "lucide-react"

interface CalendarEventProps {
  event: any
  title: string
  label?: string
}

export function CalendarEvent({ event, title, label }: CalendarEventProps) {
  const color = event.resource?.plans?.[0]?.color || '#3b82f6'
  const isSmall = !label // Month view usually doesn't show label (time range)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex items-center gap-1 text-[11px] font-semibold truncate">
        {!isSmall && <Clock className="h-3 w-3 shrink-0 opacity-70" />}
        <span className="truncate">{title}</span>
      </div>
      
      {!isSmall && (
        <div className="flex flex-col gap-1 mt-1 opacity-90 text-[10px]">
          <div className="flex items-center justify-between">
            <span>{label}</span>
            {event.resource?.target_profiles?.length > 0 && (
              <div className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{event.resource.target_profiles.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {event.resource?.category && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-white/12 px-1.5 py-[2px]">
                <Tag className="h-3 w-3" />
                {event.resource.category}
              </span>
            )}
            {event.resource?.instructor_name && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-white/12 px-1.5 py-[2px]">
                <User className="h-3 w-3" />
                {event.resource.instructor_name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
