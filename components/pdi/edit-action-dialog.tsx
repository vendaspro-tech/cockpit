'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePDIAction } from "@/app/actions/pdi-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface EditActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: {
    id: string
    action_description: string
    deadline_days: number | null
  } | null
}

export function EditActionDialog({ open, onOpenChange, action }: EditActionDialogProps) {
  const [description, setDescription] = useState('')
  const [deadlineDays, setDeadlineDays] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (action) {
      setDescription(action.action_description || '')
      setDeadlineDays(action.deadline_days?.toString() || '')
    }
  }, [action])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!action || !description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição da ação é obrigatória",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    const result = await updatePDIAction(
      action.id,
      description.trim(),
      deadlineDays ? parseInt(deadlineDays) : undefined
    )

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Ação atualizada!",
        description: "As alterações foram salvas."
      })
      onOpenChange(false)
      router.refresh()
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Ação</DialogTitle>
            <DialogDescription>
              Atualize a descrição ou prazo desta ação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição da Ação *</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Prazo (dias)</Label>
              <Input
                id="edit-deadline"
                type="number"
                min="1"
                max="365"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
