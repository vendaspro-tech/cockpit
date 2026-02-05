'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { createObjection, deleteObjection, updateObjection } from '@/app/actions/product-details'
import { toast } from 'sonner'

interface ProductObjectionsListProps {
  productId: string
  initialData: any[]
  workspaceId: string
}

const getCreatorName = (user?: { full_name?: string | null; email?: string | null }) => {
  if (!user) return 'Não identificado'
  return user.full_name || user.email || 'Não identificado'
}

export function ProductObjectionsList({ productId, initialData, workspaceId }: ProductObjectionsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rowState, setRowState] = useState<Record<string, { objection: string; response: string }>>({})
  const [isPending, startTransition] = useTransition()

  const startEdit = (id: string, data?: { objection: string; response?: string | null }) => {
    setEditingId(id)
    setRowState((prev) => ({
      ...prev,
      [id]: {
        objection: data?.objection || '',
        response: data?.response || '',
      },
    }))
  }

  const handleFieldChange = (id: string, field: 'objection' | 'response', value: string) => {
    setRowState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteObjection(id, productId, workspaceId)
        toast.success('Objeção excluída com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir objeção:', error)
        toast.error('Erro ao excluir objeção')
      }
    })
  }

  const handleSaveNew = () => {
    const data = rowState['new'] || { objection: '', response: '' }
    if (!data.objection.trim()) {
      toast.error('Informe a objeção.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('objection', data.objection.trim())
        formData.append('response', data.response.trim())
        formData.append('workspaceId', workspaceId)
        await createObjection(productId, formData)
        toast.success('Objeção adicionada!')
        setEditingId(null)
        setRowState((prev) => ({ ...prev, new: { objection: '', response: '' } }))
      } catch (error) {
        console.error('Erro ao criar objeção:', error)
        toast.error('Erro ao adicionar objeção')
      }
    })
  }

  const handleSaveExisting = (id: string) => {
    const data = rowState[id] || { objection: '', response: '' }
    if (!data.objection.trim()) {
      toast.error('Informe a objeção.')
      return
    }

    startTransition(async () => {
      try {
        await updateObjection(productId, workspaceId, id, {
          objection: data.objection.trim(),
          response: data.response.trim() ? data.response.trim() : null,
        })
        toast.success('Objeção atualizada!')
        setEditingId(null)
      } catch (error) {
        console.error('Erro ao atualizar objeção:', error)
        toast.error('Erro ao atualizar objeção')
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
        <h4 className="text-sm font-medium text-foreground">Objeções</h4>
        {editingId !== 'new' && (
          <Button size="sm" onClick={() => startEdit('new', { objection: '', response: '' })}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead>Objeção</TableHead>
              <TableHead>Resposta sugerida</TableHead>
              <TableHead className="w-[180px]">Criado por</TableHead>
              <TableHead className="w-[220px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingId === 'new' && (
              <TableRow className="bg-card/40">
                <TableCell>
                  <Label className="sr-only">Objeção</Label>
                  <Input
                    value={rowState['new']?.objection || ''}
                    onChange={(e) => handleFieldChange('new', 'objection', e.target.value)}
                    placeholder="Ex: O preço está alto"
                  />
                </TableCell>
                <TableCell>
                  <Label className="sr-only">Resposta</Label>
                  <Textarea
                    value={rowState['new']?.response || ''}
                    onChange={(e) => handleFieldChange('new', 'response', e.target.value)}
                    placeholder="Como responder..."
                    rows={2}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">Você</TableCell>
                <TableCell className="text-right">{renderActionButtons('new', true)}</TableCell>
              </TableRow>
            )}

            {initialData.map((objection) => {
              const isEditing = editingId === objection.id
              const state = rowState[objection.id] || {
                objection: objection.objection,
                response: objection.response || '',
              }

              return (
                <TableRow key={objection.id} className={isEditing ? 'bg-card/40' : undefined}>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Input
                        value={state.objection}
                        onChange={(e) => handleFieldChange(objection.id, 'objection', e.target.value)}
                        placeholder="Objeção"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{objection.objection}</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Textarea
                        value={state.response}
                        onChange={(e) => handleFieldChange(objection.id, 'response', e.target.value)}
                        placeholder="Resposta sugerida"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {objection.response || '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {getCreatorName(objection.created_by_user)}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {isEditing ? (
                      renderActionButtons(objection.id)
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(objection.id, objection)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          onClick={() => handleDelete(objection.id)}
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
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhuma objeção cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
