import { createAdminClient } from '@/lib/supabase/admin'
import { ProductGeneralForm } from '@/components/products/product-general-form'
import { ProductBenefitsList } from '@/components/products/product-benefits-list'
import { ProductOffersList } from '@/components/products/product-offers-list'
import { ProductObjectionsList } from '@/components/products/product-objections-list'
import { ProductRefusalReasonsList } from '@/components/products/product-refusal-reasons-list'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Package, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import { ProductSalesScript } from '@/components/products/product-sales-script'

type UserSummary = { full_name: string | null; email: string }
type CreatedByItem = {
  created_by?: string | null
  created_by_user?: UserSummary | null
} & Record<string, unknown>
type ProductWithRelations = {
  product_benefits?: CreatedByItem[]
  product_offers?: CreatedByItem[]
  product_objections?: CreatedByItem[]
  product_refusal_reasons?: CreatedByItem[]
} & Record<string, unknown>

interface PageProps {
  params: Promise<{
    workspaceId: string
    productId: string
  }>
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { workspaceId, productId } = await params
  const supabase = createAdminClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const { data: icps } = await supabase
    .from('icps')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true })

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_benefits(*),
      product_offers(*),
      product_objections(*),
      product_refusal_reasons(*)
    `)
    .eq('id', productId)
    .single()

  if (error || !product) {
    console.error('Error fetching product:', JSON.stringify(error, null, 2))
    notFound()
  }

  // Resolve created_by users
  const productRow = product as ProductWithRelations
  const createdByIds = new Set<string>()
  const relationKeys: Array<keyof ProductWithRelations> = [
    'product_benefits',
    'product_offers',
    'product_objections',
    'product_refusal_reasons',
  ]

  relationKeys.forEach((key) => {
    const arr = productRow[key] as CreatedByItem[] | undefined
    arr?.forEach((item) => {
      if (item.created_by) createdByIds.add(item.created_by)
    })
  })

  const usersMap: Record<string, UserSummary> = {}
  if (createdByIds.size > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', Array.from(createdByIds))

    usersData?.forEach((u) => {
      usersMap[u.id] = { full_name: u.full_name, email: u.email }
    })
  }

  const withAuthors = <T extends CreatedByItem>(items?: T[]) =>
    items?.map((item) => ({
      ...item,
      created_by_user: item.created_by_user || (item.created_by ? usersMap[item.created_by] : null),
    })) || []

  const productWithAuthors = {
    ...productRow,
    product_benefits: withAuthors(productRow.product_benefits),
    product_offers: withAuthors(productRow.product_offers),
    product_objections: withAuthors(productRow.product_objections),
    product_refusal_reasons: withAuthors(productRow.product_refusal_reasons),
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${workspaceId}/products`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-foreground" />
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Criado em {format(new Date(product.created_at), 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs para organizar as seções */}
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="script">Script de Venda</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
          <TabsTrigger value="objecoes">Objeções</TabsTrigger>
          <TabsTrigger value="perdas">Perdas</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
            <ProductGeneralForm product={productWithAuthors} workspaceId={workspaceId} />
          </div>
        </TabsContent>

        <TabsContent value="script" className="mt-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Script de Venda</h2>
            <ProductSalesScript 
              productId={productId} 
              workspaceId={workspaceId}
              currentUserId={user?.id || ''}
              icps={icps || []}
            />
          </div>
        </TabsContent>

        <TabsContent value="beneficios" className="mt-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Benefícios do Produto</h2>
            <ProductBenefitsList 
              productId={productId}
              initialData={productWithAuthors.product_benefits || []}
              workspaceId={workspaceId}
            />
          </div>
        </TabsContent>

        <TabsContent value="ofertas" className="mt-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Ofertas e Planos</h2>
            <ProductOffersList 
              productId={productId}
              initialData={productWithAuthors.product_offers || []}
              workspaceId={workspaceId}
            />
          </div>
        </TabsContent>

        <TabsContent value="objecoes" className="mt-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Objeções Comuns</h2>
            <ProductObjectionsList 
              productId={productId}
              initialData={productWithAuthors.product_objections || []}
              workspaceId={workspaceId}
            />
          </div>
        </TabsContent>

        <TabsContent value="perdas" className="mt-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Motivos de Perda</h2>
            <ProductRefusalReasonsList 
              productId={productId}
              initialData={productWithAuthors.product_refusal_reasons || []}
              workspaceId={workspaceId}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
