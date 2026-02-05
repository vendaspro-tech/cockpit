import { createAdminClient } from '@/lib/supabase/admin'
import { ICPForm } from '@/components/icp/icp-form'
import { getICP } from '@/app/actions/icp'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    workspaceId: string
    icpId: string
  }>
}

export default async function EditICPPage({ params }: PageProps) {
  const { workspaceId, icpId } = await params
  const supabase = createAdminClient()

  const [icp, { data: products }] = await Promise.all([
    getICP(icpId),
    supabase
      .from('products')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('name')
  ])

  if (!icp) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar ICP</h1>
          <p className="text-sm text-muted-foreground">
            Edite as informações do perfil de cliente ideal.
          </p>
        </div>
      </div>

      <div className="w-full">
        <ICPForm 
          initialData={icp} 
          workspaceId={workspaceId} 
          products={products || []} 
        />
      </div>
    </div>
  )
}
