'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { createBenefit, deleteBenefit, updateBenefit } from '@/app/actions/product-details'
import { toast } from 'sonner'

interface ProductBenefitsListProps {
  productId: string
  initialData: any[]
  workspaceId: string
}

const getCreatorName = (user?: { full_name?: string | null; email?: string | null }) => {
  if (!user) return 'Não identificado'
  return user.full_name || user.email || 'Não identificado'
}

export function ProductBenefitsList({ productId, initialData, workspaceId }: ProductBenefitsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rowState, setRowState] = useState<Record<string, { title: string; description: string }>>({})
  const [isPending, startTransition] = useTransition()

  const startEdit = (id: string, data?: { title: string; description?: string | null }) => {
    setEditingId(id)
    setRowState((prev) => ({
      ...prev,
      [id]: {
        title: data?.title || '',
        description: data?.description || '',
      },
    }))
  }

  const handleFieldChange = (id: string, field: 'title' | 'description', value: string) => {
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
        await deleteBenefit(id, productId, workspaceId)
        toast.success('Benefício excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir benefício:', error)
        toast.error('Erro ao excluir benefício')
      }
    })
  }

  const handleSaveNew = () => {
    const data = rowState['new'] || { title: '', description: '' }
    if (!data.title.trim()) {
      toast.error('Informe o título do benefício.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('title', data.title.trim())
        formData.append('description', data.description.trim())
        formData.append('workspaceId', workspaceId)
        await createBenefit(productId, formData)
        toast.success('Benefício adicionado!')
        setEditingId(null)
        setRowState((prev) => ({ ...prev, new: { title: '', description: '' } }))
      } catch (error) {
        console.error('Erro ao criar benefício:', error)
        toast.error('Erro ao adicionar benefício')
      }
    })
  }

  const handleSaveExisting = (id: string) => {
    const data = rowState[id] || { title: '', description: '' }
    if (!data.title.trim()) {
      toast.error('Informe o título do benefício.')
      return
    }

    startTransition(async () => {
      try {
        await updateBenefit(productId, workspaceId, id, {
          title: data.title.trim(),
          description: data.description.trim() ? data.description.trim() : null,
        })
        toast.success('Benefício atualizado!')
        setEditingId(null)
      } catch (error) {
        console.error('Erro ao atualizar benefício:', error)
        toast.error('Erro ao atualizar benefício')
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
        <h4 className="text-sm font-medium text-foreground">Benefícios</h4>
        {editingId !== 'new' && (
          <Button size="sm" onClick={() => startEdit('new', { title: '', description: '' })}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead>Título</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[180px]">Criado por</TableHead>
              <TableHead className="w-[200px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingId === 'new' && (
              <TableRow className="bg-card/40">
                <TableCell>
                  <Label className="sr-only">Título</Label>
                  <Input
                    value={rowState['new']?.title || ''}
                    onChange={(e) => handleFieldChange('new', 'title', e.target.value)}
                    placeholder="Ex: Aumento de produtividade"
                  />
                </TableCell>
                <TableCell>
                  <Label className="sr-only">Descrição</Label>
                  <Textarea
                    value={rowState['new']?.description || ''}
                    onChange={(e) => handleFieldChange('new', 'description', e.target.value)}
                    placeholder="Detalhes do benefício..."
                    rows={2}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">Você</TableCell>
                <TableCell className="text-right">{renderActionButtons('new', true)}</TableCell>
              </TableRow>
            )}

            {initialData.map((benefit) => {
              const isEditing = editingId === benefit.id
              const state = rowState[benefit.id] || {
                title: benefit.title,
                description: benefit.description || '',
              }

              return (
                <TableRow key={benefit.id} className={isEditing ? 'bg-card/40' : undefined}>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Input
                        value={state.title}
                        onChange={(e) => handleFieldChange(benefit.id, 'title', e.target.value)}
                        placeholder="Título"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{benefit.title}</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Textarea
                        value={state.description}
                        onChange={(e) => handleFieldChange(benefit.id, 'description', e.target.value)}
                        placeholder="Descrição"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {benefit.description || '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {getCreatorName(benefit.created_by_user)}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {isEditing ? (
                      renderActionButtons(benefit.id)
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(benefit.id, benefit)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          onClick={() => handleDelete(benefit.id)}
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
                  Nenhum benefício cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
