'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { deleteProduct } from '@/app/actions/products'

interface Product {
  id: string
  name: string
  description: string | null
  standard_price: number | null
  created_at: string
  updated_at: string
  product_benefits: Array<{
    id: string
    title: string
    description: string | null
    order_index: number
  }>
  product_offers: Array<{
    id: string
    name: string
    price: number | null
    description: string | null
    order_index: number
  }>
  product_objections: Array<{
    id: string
    objection: string
    response: string | null
    order_index: number
  }>
  product_refusal_reasons: Array<{
    id: string
    reason: string
    order_index: number
  }>
}

interface ProductDetailsProps {
  product: Product
  workspaceId: string
}

export function ProductDetails({ product, workspaceId }: ProductDetailsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteProduct(product.id, workspaceId)
      router.push(`/${workspaceId}/products`)
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Criado em {format(new Date(product.created_at), 'dd MMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${workspaceId}/products/${product.id}`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações Gerais */}
        <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Descrição</dt>
            <dd className="mt-1 text-sm text-foreground font-medium">
              {product.description || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Preço Padrão</dt>
            <dd className="mt-1 text-sm text-foreground font-medium">
              {formatPrice(product.standard_price)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Benefícios */}
      {product.product_benefits.length > 0 && (
          <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Benefícios</h2>
          <div className="grid gap-3">
            {product.product_benefits
              .sort((a, b) => a.order_index - b.order_index)
              .map((benefit) => (
                <div key={benefit.id} className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium text-foreground">{benefit.title}</h3>
                  {benefit.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Ofertas/Planos */}
      {product.product_offers.length > 0 && (
          <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Ofertas/Planos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {product.product_offers
              .sort((a, b) => a.order_index - b.order_index)
              .map((offer) => (
                <div key={offer.id} className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-foreground">{offer.name}</h3>
                    {offer.price && (
                      <span className="text-lg font-semibold text-blue-600">
                        {formatPrice(offer.price)}
                      </span>
                    )}
                  </div>
                  {offer.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Objeções */}
      {product.product_objections.length > 0 && (
          <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Objeções Comuns</h2>
          <div className="space-y-4">
            {product.product_objections
              .sort((a, b) => a.order_index - b.order_index)
              .map((objection) => (
                <div key={objection.id} className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                      ?
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{objection.objection}</h3>
                      {objection.response && (
                        <div className="mt-2 flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold">
                            ✓
                          </div>
                          <p className="text-sm text-muted-foreground">{objection.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Motivos de Recusa */}
      {product.product_refusal_reasons.length > 0 && (
          <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Motivos de Recusa</h2>
          <div className="grid gap-2">
            {product.product_refusal_reasons
              .sort((a, b) => a.order_index - b.order_index)
              .map((reason) => (
                <div key={reason.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{reason.reason}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto
              <strong className="text-foreground"> &quot;{product.name}&quot; </strong>
              e todos os dados associados (benefícios, ofertas, objeções).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
