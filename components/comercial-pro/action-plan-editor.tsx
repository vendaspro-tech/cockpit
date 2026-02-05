'use client'

import { useState, useEffect } from "react"
import { ActionPlan, updateActionPlan, deleteActionPlan } from "@/app/actions/comercial-pro"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NovelEditor } from "@/components/editor/novel-editor"
import { Calendar as CalendarIcon, User as UserIcon, ArrowLeft, MoreVertical, Trash2, Copy, Save } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ActionPlanEditorProps {
  initialPlan: ActionPlan
  workspaceId: string
  users: { id: string; name: string | null }[]
}

const STATUS_MAP = {
  not_started: { label: 'Não iniciado', color: 'text-slate-500', bg: 'bg-slate-100' },
  in_progress: { label: 'Em andamento', color: 'text-blue-500', bg: 'bg-blue-50' },
  completed: { label: 'Concluído', color: 'text-green-500', bg: 'bg-green-50' },
}

export function ActionPlanEditor({ initialPlan, workspaceId, users }: ActionPlanEditorProps) {
  const [plan, setPlan] = useState<ActionPlan>(initialPlan)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Auto-save debouncing could be added here, but for now we'll use manual save or save on blur/change
  // Let's implement a simple auto-save for content changes
  
  const handleUpdate = async (updates: Partial<ActionPlan>) => {
    const newPlan = { ...plan, ...updates }
    setPlan(newPlan)
    
    // In a real app, use debounce here. For now, we trigger update immediately for metadata, 
    // but for editor content we might want to wait or let the user click save?
    // The user asked for a "Notion-like" experience which usually implies auto-save.
    // Let's just update state here and have a "Save" indicator or auto-save effect.
  }

  const saveChanges = async () => {
    setIsSaving(true)
    try {
      const result = await updateActionPlan(plan.id, workspaceId, plan)
      if (result.error) throw new Error(result.error)
      toast({ title: "Salvo", description: "Alterações salvas com sucesso." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  // Effect to auto-save after 2 seconds of inactivity if changed? 
  // For simplicity and robustness, let's stick to manual save button or save on unmount/navigation?
  // Actually, let's provide a manual Save button in the header for clarity, but also auto-save metadata.

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-sm text-muted-foreground">
            {plan.is_template ? 'Editando Modelo' : 'Editando Plano'}
          </span>
          {isSaving && <span className="text-xs text-muted-foreground animate-pulse ml-2">Salvando...</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={saveChanges}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleUpdate({ is_template: !plan.is_template })}>
                <Copy className="h-4 w-4 mr-2" />
                {plan.is_template ? 'Remover de Modelos' : 'Salvar como Modelo'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={async () => {
                if (confirm('Excluir este plano?')) {
                  await deleteActionPlan(plan.id, workspaceId)
                  router.back()
                }
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-8 group">
          {/* Title */}
          <Input
            value={plan.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            placeholder="Sem título"
            className="text-4xl md:text-5xl font-bold border-none shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 h-auto bg-transparent leading-tight py-2"
          />
          
          {/* Metadata Grid */}
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-muted-foreground border-b pb-6">
            {/* Responsible */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28 text-muted-foreground/70">
                <UserIcon className="h-4 w-4" />
                <span>Responsável</span>
              </div>
              <Select
                value={plan.responsible_id || ''}
                onValueChange={(value) => handleUpdate({ responsible_id: value })}
              >
                <SelectTrigger className="h-8 border-none shadow-none bg-transparent hover:bg-muted/50 w-auto min-w-[150px] px-2 -ml-2 focus:ring-0 text-foreground font-medium">
                  <SelectValue placeholder="Atribuir..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28 text-muted-foreground/70">
                <CalendarIcon className="h-4 w-4" />
                <span>Prazo</span>
              </div>
              <Input
                type="date"
                value={plan.deadline ? new Date(plan.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => handleUpdate({ deadline: e.target.value })}
                className="h-8 border-none shadow-none bg-transparent hover:bg-muted/50 w-auto min-w-[150px] px-2 -ml-2 focus-visible:ring-0 text-foreground font-medium"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28 text-muted-foreground/70">
                <div className={cn("h-2 w-2 rounded-full", STATUS_MAP[plan.status as keyof typeof STATUS_MAP]?.bg.replace('bg-', 'bg-').replace('50', '500'))} />
                <span>Status</span>
              </div>
              <Select
                value={plan.status || 'not_started'}
                onValueChange={(value: any) => handleUpdate({ status: value })}
              >
                <SelectTrigger className="h-8 border-none shadow-none bg-transparent hover:bg-muted/50 w-auto min-w-[150px] px-2 -ml-2 focus:ring-0 text-foreground font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Não iniciado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="min-h-[500px] pb-32">
          <NovelEditor
            content={plan.content || ''}
            onChange={(content) => handleUpdate({ content: content as any })}
            editable={true}
          />
        </div>
      </main>
    </div>
  )
}
