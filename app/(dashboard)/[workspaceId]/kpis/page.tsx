import { getKPIs } from './actions'
import { KPIsClientPage } from '@/components/kpis/kpis-client-page'
import { getUserRole } from '@/lib/auth-utils'
import { getAuthUser } from '@/lib/auth-server'

export default async function KPIsPage({ 
  params 
}: { 
  params: Promise<{ workspaceId: string }> 
}) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  const kpis = await getKPIs()
  
  const role = user ? await getUserRole(user.id, workspaceId) : null
  
  return (
    <KPIsClientPage 
      initialKpis={kpis} 
      workspaceId={workspaceId} 
      userRole={role}
    />
  )
}
