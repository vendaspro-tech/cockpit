'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addProductToPlan } from '@/app/actions/commercial-plans'
import { getProductsForCommercialPlan } from '@/app/actions/products'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AddProductDialogProps {
  planId: string
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Product {
  id: string
  name: string
  description: string | null
  standard_price: number | null
}

export function AddProductDialog({ planId, workspaceId, open, onOpenChange, onSuccess }: AddProductDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [formData, setFormData] = useState({
    product_id: '',
    share_target: '',
    gross_ticket: ''
  })

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    const products = await getProductsForCommercialPlan(workspaceId)
    setAvailableProducts(products)
    setLoadingProducts(false)
  }, [workspaceId])

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open, loadProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await addProductToPlan(planId, {
      product_id: formData.product_id,
      share_target: parseFloat(formData.share_target) / 100,
      gross_ticket: parseFloat(formData.gross_ticket)
    })

    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Produto adicionado!',
      description: 'Produto adicionado ao plano com sucesso.'
    })

    setFormData({ product_id: '', share_target: '', gross_ticket: '' })
    onSuccess()
    onOpenChange(false)
    setLoading(false)
  }

  const selectedProduct = availableProducts.find(p => p.id === formData.product_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Plano</DialogTitle>
            <DialogDescription>
              Selecione um produto e configure sua participação na meta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produto *</Label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando produtos...
                </div>
              ) : (
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => {
                    const product = availableProducts.find(p => p.id === value)
                    setFormData({
                      ...formData,
                      product_id: value,
                      gross_ticket: product?.standard_price?.toString() || ''
                    })
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="share">Participação na Meta (%) *</Label>
              <Input
                id="share"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Ex: 30"
                value={formData.share_target}
                onChange={(e) => setFormData({ ...formData, share_target: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Percentual da meta global destinado a este produto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket Bruto (R$) *</Label>
              <Input
                id="ticket"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 2500"
                value={formData.gross_ticket}
                onChange={(e) => setFormData({ ...formData, gross_ticket: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Valor bruto do produto antes de descontos e recebimento
              </p>
            </div>

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
