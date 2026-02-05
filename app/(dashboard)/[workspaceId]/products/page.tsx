
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductsList } from '@/components/products/products-list'
import { ICPList } from '@/components/icp/icp-list'
import { getICPs } from '@/app/actions/icp'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PageProps {
  params: Promise<{
    workspaceId: string
  }>
  searchParams: Promise<{
    tab?: string
  }>
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { workspaceId } = await params
  const { tab } = await searchParams
  const supabase = createAdminClient()

  const [productsResult, icps] = await Promise.all([
    supabase
      .from('products')
      .select(`
        *,
        product_benefits(count),
        product_offers(count),
        product_objections(count),
        product_refusal_reasons(count),
        product_sales_scripts(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false }),
    getICPs(workspaceId)
  ])

  const products = productsResult.data

  if (productsResult.error) {
    console.error('Error fetching products:', JSON.stringify(productsResult.error, null, 2))
  }

  const defaultTab = tab === 'icp' ? 'icp' : 'products'

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos & ICPs</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu portfólio de produtos e perfis de cliente ideal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${workspaceId}/products/icp/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Novo ICP
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${workspaceId}/products/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="icp">ICPs</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsList 
            data={products || []} 
            workspaceId={workspaceId}
          />
        </TabsContent>
        <TabsContent value="icp" className="mt-6">
          <ICPList icps={icps || []} workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
