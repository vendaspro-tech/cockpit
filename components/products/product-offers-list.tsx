'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { createOffer, deleteOffer, updateOffer } from '@/app/actions/product-details'
import { toast } from 'sonner'

interface ProductOffersListProps {
  productId: string
  initialData: any[]
  workspaceId: string
}

const getCreatorName = (user?: { full_name?: string | null; email?: string | null }) => {
  if (!user) return 'Não identificado'
  return user.full_name || user.email || 'Não identificado'
}

const formatPrice = (price: number | null) => {
  if (price === null || Number.isNaN(price)) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

export function ProductOffersList({ productId, initialData, workspaceId }: ProductOffersListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rowState, setRowState] = useState<Record<string, { name: string; price: string; description: string }>>({})
  const [isPending, startTransition] = useTransition()

  const startEdit = (id: string, data?: { name: string; price?: number | null; description?: string | null }) => {
    setEditingId(id)
    setRowState((prev) => ({
      ...prev,
      [id]: {
        name: data?.name || '',
        price: data?.price !== null && data?.price !== undefined ? String(data.price) : '',
        description: data?.description || '',
      },
    }))
  }

  const handleFieldChange = (id: string, field: 'name' | 'price' | 'description', value: string) => {
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
        await deleteOffer(id, productId, workspaceId)
        toast.success('Oferta excluída com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir oferta:', error)
        toast.error('Erro ao excluir oferta')
      }
    })
  }

  const handleSaveNew = () => {
    const data = rowState['new'] || { name: '', price: '', description: '' }
    if (!data.name.trim()) {
      toast.error('Informe o nome da oferta.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('name', data.name.trim())
        formData.append('price', data.price ? data.price : '')
        formData.append('description', data.description.trim())
        formData.append('workspaceId', workspaceId)
        await createOffer(productId, formData)
        toast.success('Oferta adicionada!')
        setEditingId(null)
        setRowState((prev) => ({ ...prev, new: { name: '', price: '', description: '' } }))
      } catch (error) {
        console.error('Erro ao criar oferta:', error)
        toast.error('Erro ao adicionar oferta')
      }
    })
  }

  const handleSaveExisting = (id: string) => {
    const data = rowState[id] || { name: '', price: '', description: '' }
    if (!data.name.trim()) {
      toast.error('Informe o nome da oferta.')
      return
    }

    const priceNumber = data.price ? parseFloat(data.price) : null

    startTransition(async () => {
      try {
        await updateOffer(productId, workspaceId, id, {
          name: data.name.trim(),
          price: Number.isFinite(priceNumber) ? priceNumber : null,
          description: data.description.trim() ? data.description.trim() : null,
        })
        toast.success('Oferta atualizada!')
        setEditingId(null)
      } catch (error) {
        console.error('Erro ao atualizar oferta:', error)
        toast.error('Erro ao atualizar oferta')
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
        <h4 className="text-sm font-medium text-foreground">Ofertas e Planos</h4>
        {editingId !== 'new' && (
          <Button size="sm" onClick={() => startEdit('new', { name: '', price: null, description: '' })}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead className="w-[140px]">Preço (R$)</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[180px]">Criado por</TableHead>
              <TableHead className="w-[220px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingId === 'new' && (
              <TableRow className="bg-card/40">
                <TableCell>
                  <Label className="sr-only">Nome</Label>
                  <Input
                    value={rowState['new']?.name || ''}
                    onChange={(e) => handleFieldChange('new', 'name', e.target.value)}
                    placeholder="Ex: Pacote Anual"
                  />
                </TableCell>
                <TableCell>
                  <Label className="sr-only">Preço</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rowState['new']?.price || ''}
                    onChange={(e) => handleFieldChange('new', 'price', e.target.value)}
                    placeholder="0,00"
                  />
                </TableCell>
                <TableCell>
                  <Label className="sr-only">Descrição</Label>
                  <Textarea
                    value={rowState['new']?.description || ''}
                    onChange={(e) => handleFieldChange('new', 'description', e.target.value)}
                    placeholder="Detalhes da oferta..."
                    rows={2}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">Você</TableCell>
                <TableCell className="text-right">{renderActionButtons('new', true)}</TableCell>
              </TableRow>
            )}

            {initialData.map((offer) => {
              const isEditing = editingId === offer.id
              const state = rowState[offer.id] || {
                name: offer.name,
                price: offer.price !== null && offer.price !== undefined ? String(offer.price) : '',
                description: offer.description || '',
              }

              return (
                <TableRow key={offer.id} className={isEditing ? 'bg-card/40' : undefined}>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Input
                        value={state.name}
                        onChange={(e) => handleFieldChange(offer.id, 'name', e.target.value)}
                        placeholder="Nome"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{offer.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={state.price}
                        onChange={(e) => handleFieldChange(offer.id, 'price', e.target.value)}
                        placeholder="0,00"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{formatPrice(offer.price)}</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {isEditing ? (
                      <Textarea
                        value={state.description}
                        onChange={(e) => handleFieldChange(offer.id, 'description', e.target.value)}
                        placeholder="Descrição"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {offer.description || '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {getCreatorName(offer.created_by_user)}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    {isEditing ? (
                      renderActionButtons(offer.id)
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(offer.id, offer)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          onClick={() => handleDelete(offer.id)}
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
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhuma oferta cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
