'use client'

import { useState, useEffect } from "react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { updatePDIPlanDates } from "@/app/actions/pdi"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PDIPlanDatesProps {
  pdiId: string
  startDate: string | null
  targetCompletionDate: string | null
  createdAt: string
  approvedAt: string | null
}

export function PDIPlanDates({ 
  pdiId, 
  startDate, 
  targetCompletionDate, 
  createdAt, 
  approvedAt 
}: PDIPlanDatesProps) {
  const router = useRouter()
  const [start, setStart] = useState(startDate?.split('T')[0] || '')
  const [end, setEnd] = useState(targetCompletionDate?.split('T')[0] || '')
  const [duration, setDuration] = useState<number | null>(null)

  // Calculate duration whenever dates change
  useEffect(() => {
    if (start && end) {
      const diff = differenceInDays(new Date(end), new Date(start))
      setDuration(diff > 0 ? diff : 0)
    } else {
      setDuration(null)
    }
  }, [start, end])

  async function handleDateChange(type: 'start' | 'end', value: string) {
    if (type === 'start') setStart(value)
    else setEnd(value)

    const newStart = type === 'start' ? value : start
    const newEnd = type === 'end' ? value : end

    // Only update if we have a valid change (or clearing)
    // For UX, maybe we wait for blur? But date inputs usually commit on selection.
    // Let's update immediately for responsiveness, but maybe debounce if it was a text input.
    // Since it's type='date', value is usually complete.
    
    const result = await updatePDIPlanDates(
      pdiId, 
      newStart || null, 
      newEnd || null
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {/* Created At */}
      <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-transparent hover:border-border transition-colors">
        <Calendar className="w-4 h-4 text-primary/70" />
        <span className="whitespace-nowrap">Criado em {format(new Date(createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
      </div>

      <div className="h-4 w-px bg-border/50 hidden sm:block" />
      
      {/* Start Date Input */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Início:</span>
        <Input 
          type="date" 
          value={start}
          onChange={(e) => handleDateChange('start', e.target.value)}
          className="h-8 w-[130px] text-xs bg-muted/50 border-transparent hover:border-border focus:bg-background transition-all"
        />
      </div>

      {/* End Date Input */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Vencimento:</span>
        <Input 
          type="date" 
          value={end}
          onChange={(e) => handleDateChange('end', e.target.value)}
          className="h-8 w-[130px] text-xs bg-muted/50 border-transparent hover:border-border focus:bg-background transition-all"
        />
      </div>

      {/* Duration Display */}
      {duration !== null && (
        <>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/20 text-blue-600 animate-in fade-in duration-300">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">{duration} dias</span>
          </div>
        </>
      )}
    </div>
  )
}
