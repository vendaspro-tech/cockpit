
import { CreateProductForm } from '@/components/products/create-product-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function NewProductPage({ params }: PageProps) {
  const { workspaceId } = await params

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${workspaceId}/products`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Novo Produto</h1>
          <p className="text-sm text-muted-foreground">
            Crie um novo produto para começar a gerenciar suas ofertas.
          </p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <CreateProductForm workspaceId={workspaceId} />
      </div>
    </div>
  )
}
