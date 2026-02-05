'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { createRefusalReason, deleteRefusalReason, updateRefusalReason } from '@/app/actions/product-details'
import { toast } from 'sonner'

interface ProductRefusalReasonsListProps {
  productId: string
  initialData: any[]
  workspaceId: string
}

const getCreatorName = (user?: { full_name?: string | null; email?: string | null }) => {
  if (!user) return 'Não identificado'
  return user.full_name || user.email || 'Não identificado'
}

export function ProductRefusalReasonsList({ productId, initialData, workspaceId }: ProductRefusalReasonsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rowState, setRowState] = useState<Record<string, { reason: string }>>({})
  const [isPending, startTransition] = useTransition()

  const startEdit = (id: string, data?: { reason: string }) => {
    setEditingId(id)
    setRowState((prev) => ({
      ...prev,
      [id]: {
        reason: data?.reason || '',
      },
    }))
  }

  const handleFieldChange = (id: string, value: string) => {
    setRowState((prev) => ({
      ...prev,
      [id]: {
        reason: value,
      },
    }))
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteRefusalReason(id, productId, workspaceId)
        toast.success('Motivo excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir motivo:', error)
        toast.error('Erro ao excluir motivo')
      }
    })
  }

  const handleSaveNew = () => {
    const data = rowState['new'] || { reason: '' }
    if (!data.reason.trim()) {
      toast.error('Informe o motivo da perda.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('reason', data.reason.trim())
        formData.append('workspaceId', workspaceId)
        await createRefusalReason(productId, formData)
        toast.success('Motivo adicionado!')
        setEditingId(null)
        setRowState((prev) => ({ ...prev, new: { reason: '' } }))
      } catch (error) {
        console.error('Erro ao criar motivo:', error)
        toast.error('Erro ao adicionar motivo')
      }
    })
  }

  const handleSaveExisting = (id: string) => {
    const data = rowState[id] || { reason: '' }
    if (!data.reason.trim()) {
      toast.error('Informe o motivo da perda.')
      return
    }

    startTransition(async () => {
      try {
        await updateRefusalReason(productId, workspaceId, id, {
          reason: data.reason.trim(),
        })
        toast.success('Motivo atualizado!')
        setEditingId(null)
      } catch (error) {
        console.error('Erro ao atualizar motivo:', error)
        toast.error('Erro ao atualizar motivo')
      }
    })
  }

  const renderActionButtons = (id: string, isNew = false) => {
    const onSave = isNew ? handleSaveNew : () => handleSaveExisting(id)
    return (
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} disabled={isPending}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={onSave} disabled={isPending}>
          <Check className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Motivos de Perda</h4>
        {editingId !== 'new' && (
          <Button size="sm" onClick={() => startEdit('new', { reason: '' })}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead>Motivo</TableHead>
              <TableHead className="w-[180px]">Criado por</TableHead>
              <TableHead className="w-[200px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingId === 'new' && (
              <TableRow className="bg-card/40">
                <TableCell>
                  <Label className="sr-only">Motivo</Label>
                  <Input
                    value={rowState['new']?.reason || ''}
                    onChange={(e) => handleFieldChange('new', e.target.value)}
                    placeholder="Ex: Perdemos para concorrente"
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">Você</TableCell>
                <TableCell className="text-right">{renderActionButtons('new', true)}</TableCell>
              </TableRow>
            )}

            {initialData.map((reason) => {
              const isEditing = editingId === reason.id
              const state = rowState[reason.id] || { reason: reason.reason }

              return (
                <TableRow key={reason.id} className={isEditing ? 'bg-card/40' : undefined}>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Input
                        value={state.reason}
                        onChange={(e) => handleFieldChange(reason.id, e.target.value)}
                        placeholder="Motivo"
                      />
                    ) : (
                      <span className="text-sm text-foreground">{reason.reason}</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {getCreatorName(reason.created_by_user)}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {isEditing ? (
                      renderActionButtons(reason.id)
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(reason.id, reason)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          onClick={() => handleDelete(reason.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}

            {initialData.length === 0 && editingId !== 'new' && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  Nenhum motivo de perda cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
