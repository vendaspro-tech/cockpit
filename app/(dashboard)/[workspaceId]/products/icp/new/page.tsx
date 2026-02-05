import { createAdminClient } from '@/lib/supabase/admin'
import { ICPForm } from '@/components/icp/icp-form'

interface PageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function NewICPPage({ params }: PageProps) {
  const { workspaceId } = await params
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .order('name')

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Novo ICP</h1>
          <p className="text-sm text-muted-foreground">
            Crie um novo perfil de cliente ideal.
          </p>
        </div>
      </div>

      <div className="w-full">
        <ICPForm 
          workspaceId={workspaceId} 
          products={products || []} 
        />
      </div>
    </div>
  )
}
