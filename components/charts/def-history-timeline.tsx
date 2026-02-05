"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, Target, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DEFMeeting {
  id: string
  date: string
  leadName: string
  product: string
  score: number
  status: 'won' | 'lost' | 'ongoing'
}

interface DEFHistoryTimelineProps {
  meetings: DEFMeeting[]
}

export function DEFHistoryTimeline({ meetings }: DEFHistoryTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'lost': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Histórico de Reuniões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {meetings.map((meeting, index) => (
              <div key={meeting.id} className="relative pl-6 pb-4 border-l border-border last:border-0 last:pb-0">
                {/* Timeline Dot */}
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                
                <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{meeting.leadName}</span>
                      {getStatusIcon(meeting.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(meeting.date), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {meeting.product}
                    </span>
                    <Badge variant="outline" className={getScoreColor(meeting.score)}>
                      {meeting.score}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
