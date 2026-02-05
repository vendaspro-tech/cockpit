import { getAllKPIs } from '../actions'
import { requireSystemOwner } from '@/lib/auth-utils'
import { KPIAdminTable } from '@/components/kpis/kpi-admin-table'
import { KPIFormDialog } from '@/components/kpis/kpi-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth-server'

export default async function KPIsAdminPage({ 
  params 
}: { 
  params: Promise<{ workspaceId: string }> 
}) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) return null
  
  // Protect route - only system owner
  await requireSystemOwner(user.id, workspaceId)
  
  const kpis = await getAllKPIs()
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${workspaceId}/kpis`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao Catálogo
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Gerenciar KPIs</h1>
          <p className="text-muted-foreground">
            Adicione, edite ou remova KPIs do catálogo
          </p>
        </div>
        
        <KPIFormDialog mode="create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo KPI
          </Button>
        </KPIFormDialog>
      </div>
      
      {/* Admin Table */}
      <KPIAdminTable kpis={kpis} workspaceId={workspaceId} />
    </div>
  )
}
