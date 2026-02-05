'use client'

import { useEffect, useState, useCallback } from 'react'
import { CommercialPlan, PlanProduct, getPlanProducts } from '@/app/actions/commercial-plans'
import { ProductAnnualKPIs, getProductAnnualKPIs } from '@/app/actions/commercial-plans-calculations'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCcw } from 'lucide-react'
import { ProductCard } from './product-card'
import { AddProductDialog } from './add-product-dialog'

interface ProductsTabProps {
  plan: CommercialPlan
}

export function ProductsTab({ plan }: ProductsTabProps) {
  const [products, setProducts] = useState<PlanProduct[]>([])
  const [productKPIs, setProductKPIs] = useState<Map<string, ProductAnnualKPIs>>(new Map())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const loadProducts = useCallback(async () => {
    const { data, error } = await getPlanProducts(plan.id)
    if (!error && data) {
      setProducts(data)
    }
  }, [plan.id])

  const loadKPIs = useCallback(async (productsList: PlanProduct[]) => {
    setRefreshing(true)
    const kpisMap = new Map<string, ProductAnnualKPIs>()
    
    for (const product of productsList) {
      const kpis = await getProductAnnualKPIs(product.id)
      if (kpis) {
        kpisMap.set(product.id, kpis)
      }
    }
    
    setProductKPIs(kpisMap)
    setRefreshing(false)
  }, [])

  const handleUpdate = useCallback(async () => {
    await loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      await loadProducts()
      setLoading(false)
    }
    initialize()
  }, [loadProducts])

  useEffect(() => {
    if (products.length > 0) {
      loadKPIs(products)
    } else {
      setRefreshing(false)
    }
  }, [products, loadKPIs])

  const handleRefreshKPIs = async () => {
    await loadKPIs(products)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Produtos</h2>
        </div>
        <div className="text-muted-foreground">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Configure os produtos do plano comercial com TMR e estratégias mensais
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshKPIs}
            disabled={refreshing || products.length === 0}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Recalcular KPIs
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Nenhum produto adicionado ainda</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Produto
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              plan={plan}
              calculatedKPIs={productKPIs.get(product.id) || null}
              loading={refreshing}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      <AddProductDialog
        planId={plan.id}
        workspaceId={plan.workspace_id}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleUpdate}
      />
    </div>
  )
}
