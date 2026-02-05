'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Squad, createSquad, updateSquad, deleteSquad, addSquadMember, removeSquadMember, getSquadMembers } from '@/app/actions/squads'
import { getTeamMembers } from '@/app/actions/teams'
import { createProductsForSquad, getWorkspaceProducts, updateSquadProducts, type WorkspaceProductSummary } from '@/app/actions/products'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SquadDialogProps {
  workspaceId: string
  squad: Squad | null
  squads: Squad[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Azul Escuro', value: '#1e40af' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Verde Escuro', value: '#059669' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cinza', value: '#6b7280' },
]

export function SquadDialog({ workspaceId, squad, squads, open, onOpenChange, onSuccess }: SquadDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [leaderId, setLeaderId] = useState<string>('')
  const [color, setColor] = useState('#3b82f6')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [products, setProducts] = useState<WorkspaceProductSummary[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [pendingProductNames, setPendingProductNames] = useState<string[]>([])
  const [newProductName, setNewProductName] = useState('')
  const [productsInitialized, setProductsInitialized] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (squad) {
      setName(squad.name || '')
      setDescription(squad.description || '')
      setLeaderId(squad.leader_id || '')
      setColor(squad.color || '#3b82f6')
    } else {
      setName('')
      setDescription('')
      setLeaderId('')
      setColor('#3b82f6')
    }
    setProductSearch('')
    setNewProductName('')
    setPendingProductNames([])
    setMemberSearch('')
    const initialMemberIds = (squad?.members || [])
      .map((member) => member.user_id || member.user?.id)
      .filter(Boolean) as string[]
    setSelectedMemberIds(initialMemberIds)
    setProductsInitialized(false)
  }, [squad])

  useEffect(() => {
    if (!open) return
    setProductSearch('')
    setNewProductName('')
    setPendingProductNames([])
    setMemberSearch('')
    setProductsInitialized(false)
    setProductsLoaded(false)
  }, [open])

  useEffect(() => {
    let active = true
    async function loadSquadMembers() {
      if (!open || !squad) {
        setSelectedMemberIds([])
        return
      }
      const initialMemberIds = (squad.members || [])
        .map((member) => member.user_id || member.user?.id)
        .filter(Boolean) as string[]
      if (initialMemberIds.length > 0) {
        setSelectedMemberIds(initialMemberIds)
        return
      }
      const result = await getSquadMembers(squad.id)
      if (!active) return
      const ids = (result.data || [])
        .map((member) => member.user_id || member.user?.id)
        .filter(Boolean) as string[]
      setSelectedMemberIds(ids)
    }
    loadSquadMembers()
    return () => {
      active = false
    }
  }, [open, squad])

  useEffect(() => {
    async function loadMembers() {
      const result = await getTeamMembers(workspaceId)
      setMembers(result)
    }
    if (open) {
      loadMembers()
    }
  }, [workspaceId, open])

  useEffect(() => {
    async function loadProducts() {
      setProductsLoading(true)
      setProductsLoaded(false)
      const result = await getWorkspaceProducts(workspaceId)
      setProducts(result)
      setProductsLoading(false)
      setProductsLoaded(true)
    }
    if (open) {
      loadProducts()
    }
  }, [workspaceId, open])

  useEffect(() => {
    if (!open || !productsLoaded || productsInitialized) return

    if (squad) {
      const assigned = products.filter((product) => product.squad_id === squad.id).map((product) => product.id)
      setSelectedProductIds(assigned)
    } else {
      setSelectedProductIds([])
    }
    setProductsInitialized(true)
  }, [open, productsLoaded, productsLoading, productsInitialized, products, squad])

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => (
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    ))
  }

  const handleAddProduct = () => {
    const trimmedName = newProductName.trim()
    if (!trimmedName) return

    const nameExists = products.some(
      (product) => product.name.toLowerCase() === trimmedName.toLowerCase()
    )
    const pendingExists = pendingProductNames.some(
      (name) => name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (nameExists || pendingExists) {
      toast({
        title: 'Produto já existe',
        description: 'Escolha um nome diferente para o novo produto.',
        variant: 'destructive',
      })
      return
    }

    setPendingProductNames((prev) => [...prev, trimmedName])
    setNewProductName('')
  }

  const handleRemovePendingProduct = (name: string) => {
    setPendingProductNames((prev) => prev.filter((item) => item !== name))
  }

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do squad é obrigatório',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      let squadId = squad?.id

      if (squad) {
        const result = await updateSquad(squad.id, {
          name,
          description,
          leader_id: leaderId || undefined,
          color,
        })

        if (result.error) {
          toast({
            title: 'Erro ao atualizar',
            description: result.error,
            variant: 'destructive',
          })
          return
        }
      } else {
        const result = await createSquad(workspaceId, {
          name,
          description,
          leader_id: leaderId || undefined,
          color,
        })

        if (result.error || !result.data?.id) {
          toast({
            title: 'Erro ao criar',
            description: result.error || 'Não foi possível criar o squad.',
            variant: 'destructive',
          })
          return
        }

        squadId = result.data.id
      }

      if (!squadId) {
        toast({
          title: 'Erro',
          description: 'Squad não identificado.',
          variant: 'destructive',
        })
        return
      }

      let createdProductIds: string[] = []
      if (pendingProductNames.length > 0) {
        const createResult = await createProductsForSquad(workspaceId, squadId, pendingProductNames)
        if (createResult.error) {
          toast({
            title: 'Erro ao criar produtos',
            description: createResult.error,
            variant: 'destructive',
          })
          return
        }
        createdProductIds = (createResult.data || []).map((product) => product.id)
        setProducts((prev) => [...prev, ...(createResult.data || [])])
        setSelectedProductIds((prev) => Array.from(new Set([...prev, ...createdProductIds])))
        setPendingProductNames([])
      }

      const finalProductIds = Array.from(new Set([...selectedProductIds, ...createdProductIds]))
      const updateProductsResult = await updateSquadProducts(workspaceId, squadId, finalProductIds)

      if (updateProductsResult.error) {
        toast({
          title: 'Erro ao atualizar produtos',
          description: updateProductsResult.error,
          variant: 'destructive',
        })
        return
      }

      const currentMemberIds = (squad?.members || [])
        .map((member) => member.user_id || member.user?.id)
        .filter(Boolean) as string[]
      const selectedSet = new Set(selectedMemberIds)
      const memberSquadMap = new Map<string, { id: string; name: string }>()
      squads.forEach((item) => {
        item.members?.forEach((member) => {
          const userId = member.user_id || member.user?.id
          if (userId) {
            memberSquadMap.set(userId, { id: item.id, name: item.name })
          }
        })
      })
      const toAdd = selectedMemberIds.filter((id) => !currentMemberIds.includes(id))
      const toRemove = currentMemberIds.filter((id) => !selectedSet.has(id))

      for (const userId of toAdd) {
        const assigned = memberSquadMap.get(userId)
        if (assigned && assigned.id !== squadId) {
          const removeResult = await removeSquadMember(assigned.id, userId)
          if (removeResult.error) {
            toast({
              title: 'Erro ao mover membro',
              description: removeResult.error,
              variant: 'destructive',
            })
            return
          }
        }
        const addResult = await addSquadMember(squadId, userId)
        if (addResult.error) {
          toast({
            title: 'Erro ao adicionar membro',
            description: addResult.error,
            variant: 'destructive',
          })
          return
        }
      }

      for (const userId of toRemove) {
        const removeResult = await removeSquadMember(squadId, userId)
        if (removeResult.error) {
          toast({
            title: 'Erro ao remover membro',
            description: removeResult.error,
            variant: 'destructive',
          })
          return
        }
      }

      toast({
        title: squad ? 'Squad atualizado' : 'Squad criado',
        description: squad
          ? 'As alterações foram salvas com sucesso.'
          : `${name} foi criado com sucesso.`,
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!squad) return

    setIsLoading(true)
    try {
      const result = await deleteSquad(squad.id)

      if (result.error) {
        toast({
          title: 'Erro ao excluir',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Squad excluído',
          description: `${squad.name} foi removido.`,
        })
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const squadNameById = new Map(squads.map((item) => [item.id, item.name]))
  const memberSquadMap = new Map<string, { id: string; name: string }>()
  squads.forEach((item) => {
    item.members?.forEach((member) => {
      const userId = member.user_id || member.user?.id
      if (userId) {
        memberSquadMap.set(userId, { id: item.id, name: item.name })
      }
    })
  })
  const filteredMembers = members.filter((member) => {
    const name = member.user?.full_name || member.user?.email || ''
    return name.toLowerCase().includes(memberSearch.toLowerCase())
  })
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )
  const selectedCount = selectedProductIds.length + pendingProductNames.length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {squad ? 'Editar Squad' : 'Criar Novo Squad'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nome do Squad *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Vendas SP, Marketing Digital..."
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o propósito e objetivos do squad..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Liderança e Cor */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Liderança e Identidade Visual
              </h3>

              <div className="space-y-2">
                <Label htmlFor="leader">Líder do Squad</Label>
                <Select
                  value={leaderId || 'none'}
                  onValueChange={(value) => setLeaderId(value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="leader" className="text-base">
                    <SelectValue placeholder="Selecione um líder (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem líder definido</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.user.id}>
                        {member.user.full_name || member.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color moved here */}
              <div className="space-y-3">
                <Label>Cor do Squad</Label>
                <div className="flex gap-3 items-center">
                  <div className="flex gap-2 flex-wrap flex-1">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 shadow-sm ${
                          color === c.value ? 'border-foreground ring-2 ring-offset-2 ring-foreground scale-110' : 'border-border hover:border-foreground/50'
                        }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setColor(c.value)}
                        title={c.name}
                        aria-label={`Selecionar cor ${c.name}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="custom-color" className="text-xs text-muted-foreground">Personalizada</Label>
                    <input
                      id="custom-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 h-12 rounded-lg border-2 border-border cursor-pointer"
                      title="Escolher cor personalizada"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                  <span>Cor selecionada: {color}</span>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Membros do Squad
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Selecione os Membros</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedMemberIds.length} selecionado{selectedMemberIds.length === 1 ? '' : 's'}
                  </span>
                </div>
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Buscar membros..."
              />
              <ScrollArea className="h-40 rounded-md border">
                <div className="p-2 space-y-2">
                  {filteredMembers.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Nenhum membro encontrado.
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const userId = member.user?.id || member.user_id
                      if (!userId) return null
                      const assignedSquad = memberSquadMap.get(userId)
                      const isAssignedElsewhere = assignedSquad && assignedSquad.id !== squad?.id
                      return (
                        <label
                          key={userId}
                          className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedMemberIds.includes(userId)}
                            onCheckedChange={() => handleToggleMember(userId)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {member.user?.full_name || member.user?.email}
                            </span>
                            {member.user?.full_name && (
                              <span className="text-xs text-muted-foreground">{member.user.email}</span>
                            )}
                            {isAssignedElsewhere && (
                              <span className="text-xs text-muted-foreground">
                                Atualmente em {assignedSquad?.name}
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  Membros podem ser movidos entre squads automaticamente.
                </p>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Produtos do Squad
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Selecione os Produtos</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedCount} selecionado{selectedCount === 1 ? '' : 's'}
                  </span>
                </div>
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar produtos..."
              />
              <ScrollArea className="h-40 rounded-md border">
                <div className="p-2 space-y-2">
                  {productsLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando produtos...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Nenhum produto encontrado.
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const assignedSquad =
                        product.squad_id && product.squad_id !== squad?.id
                          ? squadNameById.get(product.squad_id) || 'outro squad'
                          : null
                      return (
                        <label
                          key={product.id}
                          className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedProductIds.includes(product.id)}
                            onCheckedChange={() => handleToggleProduct(product.id)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{product.name}</span>
                            {assignedSquad && (
                              <span className="text-xs text-muted-foreground">
                                Atualmente em {assignedSquad}
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
              {pendingProductNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingProductNames.map((productName) => (
                    <Badge key={productName} variant="secondary" className="gap-1">
                      {productName}
                      <button
                        type="button"
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemovePendingProduct(productName)}
                        aria-label={`Remover ${productName}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Novo produto"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddProduct}
                  disabled={!newProductName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
                <p className="text-xs text-muted-foreground">
                  Vincule produtos existentes ou crie novos para este squad.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              {squad && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {squad ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir squad?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o squad <strong>{squad?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
