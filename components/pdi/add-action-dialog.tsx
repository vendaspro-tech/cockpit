'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPDIAction } from "@/app/actions/pdi"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AddActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdiItemId: string
}

export function AddActionDialog({ open, onOpenChange, pdiItemId }: AddActionDialogProps) {
  const [description, setDescription] = useState('')
  const [deadlineDays, setDeadlineDays] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição da ação é obrigatória",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    const result = await createPDIAction(
      pdiItemId, 
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
        title: "Ação criada!",
        description: "A nova ação foi adicionada ao PDI."
      })
      setDescription('')
      setDeadlineDays('30')
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
            <DialogTitle>Adicionar Ação de Desenvolvimento</DialogTitle>
            <DialogDescription>
              Crie uma ação personalizada para este item do PDI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Ação *</Label>
              <Textarea
                id="description"
                placeholder="Ex: Participar de workshop sobre técnicas de vendas consultivas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Descreva claramente o que precisa ser feito para desenvolver esta competência.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo (dias)</Label>
              <Input
                id="deadline"
                type="number"
                min="1"
                max="365"
                placeholder="30"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias até a conclusão prevista? (opcional)
              </p>
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
              {isSubmitting ? 'Criando...' : 'Criar Ação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
