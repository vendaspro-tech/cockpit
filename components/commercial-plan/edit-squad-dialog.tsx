'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  updatePlanSquad,
  type PlanSquadSimple 
} from '@/app/actions/commercial-plans-squads'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EditSquadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  squad: PlanSquadSimple
  onSuccess: () => void
}

export function EditSquadDialog({
  open,
  onOpenChange,
  squad,
  onSuccess
}: EditSquadDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: squad.squad_name,
    description: squad.description || '',
    color: squad.color
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do squad',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    const result = await updatePlanSquad(squad.squad_id, {
      name: formData.name !== squad.squad_name ? formData.name : undefined,
      description: formData.description !== squad.description ? formData.description : undefined,
      color: formData.color !== squad.color ? formData.color : undefined
    })

    setLoading(false)

    if (result.data) {
      toast({
        title: 'Squad atualizado',
        description: 'Squad foi atualizado com sucesso'
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: 'Erro ao atualizar squad',
        description: result.error || 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Squad</DialogTitle>
          <DialogDescription>
            Atualize as informações do squad
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Squad Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Criado em:</span>
              <span>{format(new Date(squad.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Membros:</span>{' '}
              <Badge variant="outline">{squad.member_count}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Share (calculado):</span>{' '}
              <Badge variant="outline">{(squad.share_calculated * 100).toFixed(0)}%</Badge>
            </div>
            {squad.products && squad.products.length > 0 && (
              <div>
                <span className="text-muted-foreground">Produtos vinculados:</span>{' '}
                <Badge variant="outline">{squad.products.length}</Badge>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="name">Nome do Squad *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="color">Cor</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
