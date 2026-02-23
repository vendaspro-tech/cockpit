import { redirect } from 'next/navigation'

import { listAdminBugReports } from '@/app/actions/bug-reports'
import { BugReportsList } from '@/components/admin/bug-reports-list'
import { getAuthUser } from '@/lib/auth-server'
import { isSystemOwner } from '@/lib/auth-utils'

interface AdminBugsPageProps {
  searchParams: Promise<{
    status?: string
    workspaceId?: string
    email?: string
    from?: string
    to?: string
    page?: string
  }>
}

function toIsoDateStart(dateValue?: string) {
  if (!dateValue) return undefined

  const parsed = new Date(`${dateValue}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return undefined

  return parsed.toISOString()
}

function toIsoDateEnd(dateValue?: string) {
  if (!dateValue) return undefined

  const parsed = new Date(`${dateValue}T23:59:59.999Z`)
  if (Number.isNaN(parsed.getTime())) return undefined

  return parsed.toISOString()
}

export default async function AdminBugsPage({ searchParams }: AdminBugsPageProps) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const owner = await isSystemOwner(user.id)
  if (!owner) {
    redirect('/')
  }

  const { status, workspaceId, email, from, to, page } = await searchParams
  const currentPage = Number.isInteger(Number(page)) ? Math.max(Number(page), 1) : 1

  const bugReports = await listAdminBugReports({
    status: status as 'enviado' | 'em_avaliacao' | 'corrigido' | undefined,
    workspaceId,
    email,
    from: toIsoDateStart(from),
    to: toIsoDateEnd(to),
    page: currentPage,
    pageSize: 20,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bugs Reportados</h1>
        <p className="text-muted-foreground">
          Gerencie os relatos enviados por usuários e atualize o status do atendimento.
        </p>
      </div>

      <BugReportsList
        data={bugReports}
        filters={{
          status,
          workspaceId,
          email,
          from,
          to,
        }}
      />
    </div>
  )
}
