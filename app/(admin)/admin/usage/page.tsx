import { redirect } from 'next/navigation'

import { getAuthUser } from '@/lib/auth-server'
import { isSystemOwner } from '@/lib/auth-utils'
import { getUsageFilterOptions, getUsageSummary, type UsageFilters } from '@/app/actions/admin/usage'
import { UsageDashboard } from '@/components/admin/usage-dashboard'

function getDefaultFilters(): UsageFilters {
  const now = new Date()
  const start = new Date(now)
  start.setUTCDate(start.getUTCDate() - 30)

  return {
    dateFrom: start.toISOString(),
    dateTo: now.toISOString(),
  }
}

export default async function AdminUsagePage() {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const owner = await isSystemOwner(user.id)
  if (!owner) {
    redirect('/')
  }

  const filters = getDefaultFilters()
  const [{ workspaces, plans }, summary] = await Promise.all([
    getUsageFilterOptions(),
    getUsageSummary(filters),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Uso da Plataforma</h1>
        <p className="text-muted-foreground">
          Acompanhe adoção por workspace com foco em ações core: Avaliações, Agentes e PDI.
        </p>
      </div>

      <UsageDashboard
        initialSummary={summary}
        workspaces={workspaces}
        plans={plans}
        initialFilters={filters}
      />
    </div>
  )
}
