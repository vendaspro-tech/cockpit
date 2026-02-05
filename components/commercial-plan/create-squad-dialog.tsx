'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  createPlanSquad, 
  getWorkspaceMembersForSquadLeader,
  type CreateSquadSimpleData 
} from '@/app/actions/commercial-plans-squads'

interface CreateSquadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
}

export function CreateSquadDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess
}: CreateSquadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string }>>([])
  const { toast } = useToast()

  const loadUsers = useCallback(async () => {
    const result = await getWorkspaceMembersForSquadLeader(workspaceId)
    if (result.data) {
      setUsers(result.data)
    }
  }, [workspaceId])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    leader_id: ''
  })

  useEffect(() => {
    if (open) {
      loadUsers()
      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        leader_id: ''
      })
    }
  }, [open, loadUsers])

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
    
    const result = await createPlanSquad(workspaceId, {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
      leader_id: formData.leader_id || undefined
    })

    setLoading(false)

    if (result.data) {
      toast({
        title: 'Squad criado',
        description: 'Squad foi criado com sucesso'
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: 'Erro ao criar squad',
        description: result.error || 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Squad</DialogTitle>
          <DialogDescription>
            Crie um squad para organizar sua equipe. Produtos serão vinculados ao squad na tab Produtos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Squad *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Squad Vendas"
              required
            />
          </div>

          <div>
            <Label htmlFor="leader">Líder (opcional)</Label>
            <Select value={formData.leader_id} onValueChange={(value) => setFormData({ ...formData, leader_id: value })}>
              <SelectTrigger id="leader">
                <SelectValue placeholder="Selecione um líder" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do squad"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Squad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
