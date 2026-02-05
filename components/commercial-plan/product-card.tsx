'use client'

import { useState } from 'react'
import { CommercialPlan, PlanProduct, updatePlanProduct, removePlanProduct } from '@/app/actions/commercial-plans'
import { ProductAnnualKPIs } from '@/app/actions/commercial-plans-calculations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, Settings, Trash2, Edit, Loader2 } from 'lucide-react'
import { TMRConfig } from './tmr-config'
import { MonthStrategiesTable } from './month-strategies-table'
import { ProductKPIsCard } from './product-kpis-card'
import { useToast } from '@/hooks/use-toast'
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

interface ProductCardProps {
  product: PlanProduct
  plan: CommercialPlan
  calculatedKPIs: ProductAnnualKPIs | null
  loading?: boolean
  onUpdate: () => void
}

export function ProductCard({ product, plan, calculatedKPIs, loading, onUpdate }: ProductCardProps) {
  const { toast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareTarget, setShareTarget] = useState((product.share_target * 100).toString())

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleEditShare = async () => {
    setSaving(true)

    const shareValue = parseFloat(shareTarget) / 100

    if (shareValue <= 0 || shareValue > 1) {
      toast({
        title: 'Erro',
        description: 'Share deve estar entre 0.1% e 100%',
        variant: 'destructive'
      })
      setSaving(false)
      return
    }

    const { error } = await updatePlanProduct(product.id, {
      share_target: shareValue
    })

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Share atualizado!',
        description: `Share do produto: ${shareTarget}%`
      })
      setShowEditDialog(false)
      onUpdate()
    }

    setSaving(false)
  }

  const handleRemove = async () => {
    setSaving(true)

    const { error } = await removePlanProduct(product.id)

    if (error) {
      toast({
        title: 'Erro ao remover',
        description: error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Produto removido!',
        description: 'Produto removido do plano com sucesso.'
      })
      setShowRemoveDialog(false)
      onUpdate()
    }

    setSaving(false)
  }

  const productInfo = product.product as any

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>
                {productInfo?.name || 'Produto'}
              </CardTitle>
              <CardDescription>
                {productInfo?.description || 'Sem descrição'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Share</div>
                <div className="text-lg font-semibold">
                  {(product.share_target * 100).toFixed(1)}% da meta
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(plan.global_target * product.share_target)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">TMR Calculado</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(product.tmr_calculated)}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRemoveDialog(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* KPIs */}
          <ProductKPIsCard 
            planProduct={product} 
            currency={plan.currency} 
            calculatedKPIs={calculatedKPIs}
            loading={loading}
          />

          {/* Configuration Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tmr" className="border-b">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuração do TMR
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TMRConfig
                  planProduct={product}
                  onUpdate={onUpdate}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="strategies" className="border-b-0">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4" />
                  Distribuição Mensal e Estratégias
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <MonthStrategiesTable
                  planProduct={product}
                  plan={plan}
                  onUpdate={onUpdate}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Edit Share Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Share do Produto</DialogTitle>
            <DialogDescription>
              Defina qual percentual da meta global este produto representa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share">Share da Meta Global (%)</Label>
              <Input
                id="share"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={shareTarget}
                onChange={(e) => setShareTarget(e.target.value)}
                placeholder="Ex: 40"
              />
              <p className="text-sm text-muted-foreground">
                Meta global: {formatCurrency(plan.global_target)} × {shareTarget}% = {' '}
                {formatCurrency((plan.global_target * parseFloat(shareTarget || '0')) / 100)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditShare} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto do plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá <strong>{productInfo?.name}</strong> do plano comercial, 
              incluindo todas as configurações de TMR e estratégias mensais. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover Produto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
