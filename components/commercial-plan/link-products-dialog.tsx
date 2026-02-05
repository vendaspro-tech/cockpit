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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  getAvailableProducts,
  linkProductsToSquad,
  type AvailableProduct
} from '@/app/actions/commercial-plans-squads'
import { AlertCircle, Package } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LinkProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  squadId: string
  squadName: string
  onSuccess: () => void
}

export function LinkProductsDialog({
  open,
  onOpenChange,
  planId,
  squadId,
  squadName,
  onSuccess
}: LinkProductsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<AvailableProduct[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const result = await getAvailableProducts(planId)
    
    if (result.data) {
      setProducts(result.data)
      
      // Pre-select products currently linked to this squad
      const currentlyLinked = result.data
        .filter(p => p.current_squad_id === squadId)
        .map(p => p.id)
      
      setSelectedIds(new Set(currentlyLinked))
    } else if (result.error) {
      toast({
        title: 'Erro ao carregar produtos',
        description: result.error,
        variant: 'destructive'
      })
    }
    
    setLoading(false)
  }, [planId, squadId, toast])

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open, loadProducts])

  const handleToggle = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    
    const result = await linkProductsToSquad(
      planId,
      squadId,
      Array.from(selectedIds)
    )

    setSaving(false)

    if (result.success) {
      toast({
        title: 'Produtos vinculados',
        description: 'Produtos foram vinculados ao squad com sucesso'
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: 'Erro ao vincular produtos',
        description: result.error || 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  // Calculate total share if selected
  const totalSelectedShare = products
    .filter(p => selectedIds.has(p.id))
    .reduce((sum, p) => sum + p.share_target, 0)

  // Warn about products in other squads
  const selectedFromOtherSquads = products.filter(p => 
    selectedIds.has(p.id) && 
    p.current_squad_id && 
    p.current_squad_id !== squadId
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Produtos ao Squad</DialogTitle>
          <DialogDescription>
            Selecione os produtos que pertencem ao <strong>{squadName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Carregando produtos...
          </div>
        ) : (
          <>
            {/* Warning about other squads */}
            {selectedFromOtherSquads.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedFromOtherSquads.length} {selectedFromOtherSquads.length === 1 ? 'produto está' : 'produtos estão'} em outro squad e {selectedFromOtherSquads.length === 1 ? 'será transferido' : 'serão transferidos'}.
                </AlertDescription>
              </Alert>
            )}

            {/* Products List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {products.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto no plano ainda</p>
                </div>
              ) : (
                <div className="divide-y">
                  {products.map((product) => {
                    const isSelected = selectedIds.has(product.id)
                    const isCurrentSquad = product.current_squad_id === squadId
                    const isOtherSquad = product.current_squad_id && product.current_squad_id !== squadId

                    return (
                      <div
                        key={product.id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={product.id}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleToggle(product.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <label
                            htmlFor={product.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium">{product.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">
                                    {(product.share_target * 100).toFixed(0)}% do plano
                                  </Badge>
                                  {isCurrentSquad && (
                                    <Badge variant="default" className="text-xs">
                                      Vinculado
                                    </Badge>
                                  )}
                                  {isOtherSquad && (
                                    <Badge variant="secondary" className="text-xs">
                                      {product.current_squad_name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Produtos selecionados:
                </span>
                <Badge variant="outline" className="font-semibold">
                  {selectedIds.size}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Share total do squad:
                </span>
                <Badge 
                  variant={totalSelectedShare > 0 ? "default" : "secondary"}
                  className="font-semibold"
                >
                  {(totalSelectedShare * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? 'Salvando...' : 'Salvar Vinculações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
