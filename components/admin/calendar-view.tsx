'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Filter, Users, Link as LinkIcon, Repeat } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createEvent, updateEvent, deleteEvent, createEventTemplate } from "@/app/actions/admin/events"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
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

interface Plan {
  id: string
  name: string
  color: string
}

interface Event {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  plan_ids: string[]
  target_profiles: string[]
  category?: string | null
  instructor_name?: string | null
  location_url?: string | null
  recurrence_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
  recurrence_until?: string | null
  plans?: {
    id: string
    name: string
    color: string
  }[]
}

interface EventTemplate {
  id: string
  name: string
  title: string
  description?: string | null
  plan_id?: string | null
  target_profiles?: string[]
  category?: string | null
  instructor_name?: string | null
  location_url?: string | null
  duration_minutes?: number | null
  recurrence_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
}

interface CalendarViewProps {
  events: Event[]
  plans: Plan[]
  templates: EventTemplate[]
  categories: { id: string, name: string, color: string }[]
  instructors: { id: string, name: string, title?: string | null, email?: string | null }[]
}

const PROFILES = [
  "BDR",
  "Closer",
  "Customer Success",
  "Empresário",
  "Líder Comercial",
  "SDR",
  "Social Seller"
]

const RECURRENCE_OPTIONS: { value: 'none' | 'daily' | 'weekly' | 'monthly', label: string }[] = [
  { value: 'none', label: 'Sem recorrência' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
]

export function CalendarView({
  events: initialEvents,
  plans,
  templates,
  categories = [],
  instructors = []
}: CalendarViewProps) {
  const { toast } = useToast()
  const safeCategories = categories || []
  const safeInstructors = instructors || []
  const [events, setEvents] = useState(initialEvents)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  // Filters
  const [selectedPlans, setSelectedPlans] = useState<string[]>(plans.map(p => p.id))
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(PROFILES)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    plan_ids: [] as string[],
    target_profiles: [] as string[],
    category_id: safeCategories[0]?.id || "",
    instructor_id: "none",
    location_url: "",
    recurrence_frequency: "none" as 'none' | 'daily' | 'weekly' | 'monthly',
    recurrence_until: ""
  })

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

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const matchesPlan = event.plan_ids.some(id => selectedPlans.includes(id))
        const matchesProfile = event.target_profiles.length === 0 || 
          event.target_profiles.some(p => selectedProfiles.includes(p))
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category || "Outro")
        return matchesPlan && matchesProfile && matchesCategory
      })
      .flatMap(expandOccurrences)
  }, [events, selectedPlans, selectedProfiles, selectedCategories])

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setSelectedEvent(null)
    setSelectedTemplate(null)
    setFormData({
      title: "",
      description: "",
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
      plan_ids: plans.length ? [plans[0].id] : [],
      target_profiles: [],
      category_id: categories[0]?.id || "",
      instructor_id: "",
      location_url: "",
      recurrence_frequency: "none",
      recurrence_until: ""
    })
    setIsDialogOpen(true)
  }

  const handleSelectEvent = (event: any) => {
    const rawEvent = event.resource
    setSelectedEvent(rawEvent)
    setSelectedTemplate(null)
    setFormData({
      title: rawEvent.title,
      description: rawEvent.description || "",
      start_time: new Date(rawEvent.start_time).toISOString().slice(0, 16),
      end_time: new Date(rawEvent.end_time).toISOString().slice(0, 16),
      plan_ids: rawEvent.plan_ids || [],
      target_profiles: rawEvent.target_profiles || [],
      category_id: safeCategories.find(c => c.name === rawEvent.category)?.id || "",
      instructor_id: (safeInstructors.find(i => i.name === rawEvent.instructor_name)?.id) || "none",
      location_url: rawEvent.location_url || "",
      recurrence_frequency: rawEvent.recurrence_frequency || "none",
      recurrence_until: rawEvent.recurrence_until
        ? new Date(rawEvent.recurrence_until).toISOString().slice(0, 16)
        : ""
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.plan_ids.length) {
      toast({
        variant: "destructive",
        title: "Selecione ao menos um plano",
        description: "Escolha para quais planos o evento será exibido."
      })
      return
    }
    
    const payload = {
      title: formData.title,
      description: formData.description,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      plan_ids: formData.plan_ids,
      target_profiles: formData.target_profiles,
      category_id: formData.category_id || undefined,
      instructor_id: formData.instructor_id === "none" ? undefined : formData.instructor_id,
      location_url: formData.location_url || undefined,
      recurrence_frequency: formData.recurrence_frequency,
      recurrence_until: formData.recurrence_frequency === 'none' || !formData.recurrence_until
        ? null
        : new Date(formData.recurrence_until).toISOString()
    }

    const result = selectedEvent
      ? await updateEvent(selectedEvent.id, payload)
      : await createEvent(payload)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: selectedEvent ? "Evento atualizado" : "Evento criado"
      })
      setIsDialogOpen(false)

      if (result.event) {
        if (selectedEvent) {
          setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? (result.event as unknown as Event) : ev))
        } else {
          setEvents(prev => [...prev, result.event as unknown as Event])
        }
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent || !confirm("Tem certeza que deseja excluir este evento?")) return

    const result = await deleteEvent(selectedEvent.id)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Evento excluído"
      })
      setIsDialogOpen(false)
      setEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id))
    }
  }

  const toggleProfile = (profile: string) => {
    setFormData(prev => {
      const current = prev.target_profiles
      if (current.includes(profile)) {
        return { ...prev, target_profiles: current.filter(p => p !== profile) }
      } else {
        return { ...prev, target_profiles: [...current, profile] }
      }
    })
  }

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

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    const start = formData.start_time ? new Date(formData.start_time) : new Date()
    const end = template.duration_minutes
      ? new Date(start.getTime() + template.duration_minutes * 60 * 1000)
      : (formData.end_time ? new Date(formData.end_time) : start)

    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description || "",
      plan_ids: template.plan_id ? [template.plan_id] : (prev.plan_ids.length ? prev.plan_ids : plans.map(p => p.id)),
      target_profiles: template.target_profiles || [],
      category_id: safeCategories.find(c => c.name === template.category)?.id || prev.category_id,
      instructor_id: safeInstructors.find(i => i.name === template.instructor_name)?.id || "none",
      location_url: template.location_url || "",
      recurrence_frequency: template.recurrence_frequency || "none",
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16)
    }))
  }

  const handleSaveTemplate = async () => {
    const name = prompt("Nome do template:")
    if (!name) return

    const selectedCategory = safeCategories.find(c => c.id === formData.category_id)
    const selectedInstructor = safeInstructors.find(i => i.id === formData.instructor_id)

    const result = await createEventTemplate({
      name,
      title: formData.title || "Evento",
      description: formData.description,
      plan_id: formData.plan_ids[0] || undefined,
      target_profiles: formData.target_profiles,
      category: selectedCategory?.name || undefined,
      instructor_name: selectedInstructor?.name || undefined,
      location_url: formData.location_url || undefined,
      recurrence_frequency: formData.recurrence_frequency,
      duration_minutes: formData.start_time && formData.end_time
        ? Math.max(15, Math.round((new Date(formData.end_time).getTime() - new Date(formData.start_time).getTime()) / 60000))
        : undefined
    })

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar template",
        description: result.error
      })
    } else {
      toast({
        title: "Template salvo",
        description: "Você poderá reutilizá-lo nas próximas criações."
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
      <style jsx global>{`
        /* Theme-aware calendar styles */
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
      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl bg-card shadow-sm">
        <div className="space-y-2 flex-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Planos
          </Label>
          <div className="flex flex-wrap gap-2">
            {plans.map(plan => (
              <Badge
                key={plan.id}
                variant="outline"
                className={`cursor-pointer transition-all hover:opacity-80 ${selectedPlans.includes(plan.id) ? 'ring-2 ring-offset-1' : 'opacity-50 grayscale'}`}
                style={{ 
                  backgroundColor: selectedPlans.includes(plan.id) ? plan.color : 'transparent',
                  borderColor: plan.color,
                  color: selectedPlans.includes(plan.id) ? 'white' : plan.color,
                  boxShadow: selectedPlans.includes(plan.id) ? `0 0 10px ${plan.color}40` : 'none'
                }}
                onClick={() => {
                  setSelectedPlans(prev => 
                    prev.includes(plan.id) ? prev.filter(id => id !== plan.id) : [...prev, plan.id]
                  )
                }}
              >
                {plan.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="w-px bg-border hidden sm:block" />
        <div className="h-px bg-border sm:hidden" />
        <div className="space-y-2 flex-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <Users className="w-3 h-3" />
            Perfis
          </Label>
          <div className="flex flex-wrap gap-2">
            {PROFILES.map(profile => (
              <Badge
                key={profile}
                variant={selectedProfiles.includes(profile) ? "secondary" : "outline"}
                className={`cursor-pointer transition-all ${selectedProfiles.includes(profile) ? 'bg-secondary text-secondary-foreground' : 'opacity-50'}`}
                onClick={() => {
                  setSelectedProfiles(prev => 
                    prev.includes(profile) ? prev.filter(p => p !== profile) : [...prev, profile]
                  )
                }}
              >
                {profile}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2 flex-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <Filter className="w-3 h-3" />
            Categorias
          </Label>
          <div className="flex flex-wrap gap-2">
            {safeCategories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategories.includes(category.name) ? "secondary" : "outline"}
                className={`cursor-pointer transition-all ${selectedCategories.includes(category.name) ? 'bg-secondary text-secondary-foreground' : 'opacity-70'}`}
                onClick={() => {
                  setSelectedCategories(prev => 
                    prev.includes(category.name) ? prev.filter(c => c !== category.name) : [...prev, category.name]
                  )
                }}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={handleSelectSlot}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {templates.length > 0 && (
                <div className="grid gap-2">
                  <Label>Templates</Label>
                  <Select
                    value={selectedTemplate || ""}
                    onValueChange={(value) => applyTemplate(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aplicar template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Planos (Produtos)</Label>
                <div className="flex flex-wrap gap-2">
                  {plans.map(plan => {
                    const active = formData.plan_ids.includes(plan.id)
                    return (
                      <Badge
                        key={plan.id}
                        variant="outline"
                        className={`cursor-pointer transition-all ${active ? 'ring-2 ring-offset-1' : 'opacity-60'}`}
                        style={{
                          backgroundColor: active ? plan.color : 'transparent',
                          borderColor: plan.color,
                          color: active ? 'white' : plan.color,
                          boxShadow: active ? `0 0 10px ${plan.color}40` : 'none'
                        }}
                        onClick={() => {
                          setFormData(prev => {
                            const exists = prev.plan_ids.includes(plan.id)
                            return {
                              ...prev,
                              plan_ids: exists
                                ? prev.plan_ids.filter(id => id !== plan.id)
                                : [...prev.plan_ids, plan.id]
                            }
                          })
                        }}
                      >
                        {plan.name}
                      </Badge>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione um ou mais planos que devem receber este evento.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Início</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">Fim</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                    {safeCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="instructor">Instrutor</Label>
                  <Select
                    value={formData.instructor_id}
                    onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou deixe vazio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem instrutor</SelectItem>
                      {safeInstructors.map(instr => (
                        <SelectItem key={instr.id} value={instr.id}>
                          {instr.name}{instr.title ? ` — ${instr.title}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Link do evento (Meet, Zoom...)
                </Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  value={formData.location_url}
                  onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Público Alvo (Perfis)</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[150px] overflow-y-auto">
                  {PROFILES.map(profile => (
                    <div key={profile} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`profile-${profile}`}
                        checked={formData.target_profiles.includes(profile)}
                        onCheckedChange={() => toggleProfile(profile)}
                      />
                      <Label htmlFor={`profile-${profile}`} className="text-sm font-normal cursor-pointer">
                        {profile}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se nenhum perfil for selecionado, o evento será visível para todos do plano.
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Recorrência
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={formData.recurrence_frequency}
                    onValueChange={(value) => setFormData({ ...formData, recurrence_frequency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Recorrência" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="datetime-local"
                    disabled={formData.recurrence_frequency === 'none'}
                    value={formData.recurrence_until}
                    onChange={(e) => setFormData({ ...formData, recurrence_until: e.target.value })}
                    placeholder="Até quando?"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Defina a data final quando usar recorrência. Deixando vazio, criaremos somente a primeira ocorrência.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-2 flex-wrap justify-end">
              {selectedEvent && (
                <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto">
                  Excluir
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveTemplate}
              >
                Salvar como template
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
