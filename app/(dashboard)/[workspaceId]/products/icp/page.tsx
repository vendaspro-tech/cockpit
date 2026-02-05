import { ICPList } from '@/components/icp/icp-list'
import { getICPs } from '@/app/actions/icp'

interface PageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function ICPPage({ params }: PageProps) {
  const { workspaceId } = await params
  const icps = await getICPs(workspaceId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ICPs</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus perfis de cliente ideal.
          </p>
        </div>
      </div>

      <ICPList icps={icps || []} workspaceId={workspaceId} />
    </div>
  )
}
