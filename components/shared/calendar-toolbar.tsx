'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ToolbarProps, View } from "react-big-calendar"
import { cn } from "@/lib/utils"

export function CalendarToolbar(props: ToolbarProps) {
  const { onNavigate, onView, view, label } = props

  const goToBack = () => {
    onNavigate('PREV')
  }

  const goToNext = () => {
    onNavigate('NEXT')
  }

  const goToCurrent = () => {
    onNavigate('TODAY')
  }

  const handleViewChange = (newView: View) => {
    onView(newView)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 p-2 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToCurrent}>
          Hoje
        </Button>
        <div className="flex items-center rounded-md border bg-background shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md border-r" onClick={goToBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-md" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold capitalize text-foreground">
        {label}
      </h2>

      <div className="flex items-center rounded-md border bg-background shadow-sm p-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-7 px-3 text-xs", view === 'month' && "bg-accent font-medium text-accent-foreground")}
          onClick={() => handleViewChange('month')}
        >
          Mês
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-7 px-3 text-xs", view === 'week' && "bg-accent font-medium text-accent-foreground")}
          onClick={() => handleViewChange('week')}
        >
          Semana
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-7 px-3 text-xs", view === 'day' && "bg-accent font-medium text-accent-foreground")}
          onClick={() => handleViewChange('day')}
        >
          Dia
        </Button>
      </div>
    </div>
  )
}
