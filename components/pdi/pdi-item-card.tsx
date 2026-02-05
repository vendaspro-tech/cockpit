'use client'
// Force recompile

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Circle, AlertTriangle, MoreHorizontal, Trash2, Plus, Calendar, Paperclip, Pencil, Upload } from "lucide-react"
import { type PDIItemWithActions } from "@/lib/types/pdi"
import { createPDIAction, deletePDIAction, togglePDIActionComplete, updatePDIAction } from "@/app/actions/pdi"
import { cn } from "@/lib/utils"
import { UploadEvidenceDialog } from "./upload-evidence-dialog"
import { EvidenceList } from "./evidence-list"
import { toast } from 'sonner'
import { useRouter } from "next/navigation"

interface PDIItemCardProps {
  item: PDIItemWithActions
  index?: number
}

export function PDIItemCard({ item, index }: PDIItemCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [togglingActions, setTogglingActions] = useState<Set<string>>(new Set())
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null)
  const router = useRouter()

  const completedActions = item.actions?.filter(a => a.status === 'done').length || 0
  const totalActions = item.actions?.length || 0
  const progressPercentage = totalActions > 0 ? (completedActions / totalActions) * 100 : 0

  const statusColors = {
    not_started: 'bg-muted text-muted-foreground border-border',
    in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-600 border-green-500/20'
  }

  const priorityColors = {
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  }

  async function handleToggleAction(actionId: string, currentStatus: string) {
    setTogglingActions(prev => new Set(prev).add(actionId))
    
    const result = await togglePDIActionComplete(actionId, currentStatus !== 'done')
    
    if (result.error) {
      toast.error(result.error)
    } else {
      // Show appropriate toast based on auto-completion
      if (result.message) {
        toast.success(result.message)
      } else {
        toast.success(currentStatus === 'done' ? "Ação reaberta" : "Ação concluída!")
      }
      router.refresh()
    }

    setTogglingActions(prev => {
      const next = new Set(prev)
      next.delete(actionId)
      return next
    })
  }

  // Helper to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return format(new Date(dateString), "dd/MM/yy", { locale: ptBR })
  }

  // Helper to calculate duration
  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const description = (form.elements.namedItem('description') as HTMLInputElement).value
    const startDate = (form.elements.namedItem('startDate') as HTMLInputElement).value
    const dueDate = (form.elements.namedItem('dueDate') as HTMLInputElement).value
    
    if (!description) return

    const result = await createPDIAction(item.id, description, undefined, startDate || undefined, dueDate || undefined)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Ação adicionada com sucesso')
      setAddDialogOpen(false)
      router.refresh()
    }
  }

  async function handleEditAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAction) return

    const form = e.target as HTMLFormElement
    const description = (form.elements.namedItem('editDescription') as HTMLInputElement).value
    const startDate = (form.elements.namedItem('editStartDate') as HTMLInputElement).value
    const dueDate = (form.elements.namedItem('editDueDate') as HTMLInputElement).value

    const result = await updatePDIAction(selectedAction.id, {
      description,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Ação atualizada com sucesso')
      setEditDialogOpen(false)
      setSelectedAction(null)
      router.refresh()
    }
  }

  async function handleDeleteAction() {
    if (!deletingActionId) return

    const result = await deletePDIAction(deletingActionId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Ação excluída com sucesso')
      router.refresh()
    }

    setDeleteDialogOpen(false)
    setDeletingActionId(null)
  }

  function openEditDialog(action: any) {
    setSelectedAction(action)
    setEditDialogOpen(true)
  }

  function openDeleteDialog(actionId: string) {
    setDeletingActionId(actionId)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow p-0 gap-0">
        <div className="p-2 flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold truncate leading-none flex items-center gap-2">
                  {index && <span className="text-muted-foreground mr-1">{index}.</span>}
                  {item.criterion}
                  {item.evidences && item.evidences.length > 0 && (
                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full" title={`${item.evidences.length} evidência(s)`}>
                      <Paperclip className="w-3 h-3 mr-1" />
                      {item.evidences.length}
                    </div>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0 border-l pl-2 h-3">
                  <span>Auto: <strong>{item.current_score_self || '-'}</strong></span>
                  <span>Gestor: <strong>{item.current_score_manager || '-'}</strong></span>
                  <span>Meta: <strong>{item.target_score || '-'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`${statusColors[item.status]} h-5 text-[10px] px-1.5`}>
              {item.status === 'not_started' ? 'Não iniciado' : 
               item.status === 'in_progress' ? 'Em andamento' : 'Concluído'}
            </Badge>
            
            <div className="flex items-center gap-1 min-w-[60px] justify-end">
              <span className="text-[10px] text-muted-foreground font-medium">{Math.round(progressPercentage)}%</span>
              <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-0 space-y-4 border-t bg-muted/5">
            {/* Actions List */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações de Desenvolvimento</h4>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Nova Ação
                </Button>
              </div>

              {item.actions && item.actions.length > 0 ? (
                <div className="space-y-2">
                  {item.actions.map((action) => {
                    const duration = getDuration(action.start_date, action.due_date)
                    
                    return (
                      <div key={action.id} className="flex items-start gap-3 bg-background p-3 rounded-lg border text-sm group">
                        <Checkbox 
                          checked={action.status === 'done'}
                          onCheckedChange={() => handleToggleAction(action.id, action.status)}
                          disabled={togglingActions.has(action.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "leading-none transition-all",
                            action.status === 'done' && "text-muted-foreground line-through"
                          )}>
                            {action.action_description}
                          </p>
                          
                          {/* Dates & Duration */}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            {(action.start_date || action.due_date) && (
                              <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {formatDate(action.start_date)} - {formatDate(action.due_date)}
                                </span>
                              </div>
                            )}
                            {duration !== null && (
                              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                <Clock className="w-3 h-3" />
                                <span>{duration} dias</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(action)}>
                            <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDeleteDialog(action.id)}>
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm bg-muted/10 rounded-lg border border-dashed">
                  Nenhuma ação definida
                </div>
              )}
            </div>

            {/* Evidence Section */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidências</h4>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="w-3 h-3 mr-1" />
                  Anexar
                </Button>
              </div>
              
              <EvidenceList 
                evidences={item.evidences || []} 
                pdiItemId={item.id}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Add Action Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ação de Desenvolvimento</DialogTitle>
            <DialogDescription>
              Defina uma ação clara e objetiva para desenvolver esta competência.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Ação</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Ex: Ler o livro X, Fazer curso Y..." 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input type="date" id="startDate" name="startDate" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input type="date" id="dueDate" name="dueDate" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Adicionar Ação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Action Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDescription">Descrição da Ação</Label>
              <Textarea 
                id="editDescription" 
                name="editDescription" 
                defaultValue={selectedAction?.action_description}
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Data de Início</Label>
                <Input 
                  type="date" 
                  id="editStartDate" 
                  name="editStartDate" 
                  defaultValue={selectedAction?.start_date?.split('T')[0]} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDueDate">Data de Vencimento</Label>
                <Input 
                  type="date" 
                  id="editDueDate" 
                  name="editDueDate" 
                  defaultValue={selectedAction?.due_date?.split('T')[0]} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <UploadEvidenceDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        pdiItemId={item.id}
      />
    </>
  )
}
