import { redirect } from 'next/navigation'

import { getAdminPlatformFeedbackList } from '@/app/actions/platform-feedback'
import { PlatformFeedbackList } from '@/components/admin/platform-feedback-list'
import { getAuthUser } from '@/lib/auth-server'
import { isSystemOwner } from '@/lib/auth-utils'

interface AdminFeedbackPageProps {
  searchParams: Promise<{
    from?: string
    to?: string
    minScore?: string
    maxScore?: string
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

function toScore(value?: string) {
  if (!value) return undefined

  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return undefined

  return parsed
}

export default async function AdminFeedbackPage({ searchParams }: AdminFeedbackPageProps) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const owner = await isSystemOwner(user.id)
  if (!owner) {
    redirect('/')
  }

  const { from, to, minScore, maxScore, page } = await searchParams
  const currentPage = Number.isInteger(Number(page)) ? Math.max(Number(page), 1) : 1

  const feedback = await getAdminPlatformFeedbackList({
    from: toIsoDateStart(from),
    to: toIsoDateEnd(to),
    minScore: toScore(minScore),
    maxScore: toScore(maxScore),
    page: currentPage,
    pageSize: 20,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback da Plataforma</h1>
        <p className="text-muted-foreground">
          Acompanhe a percepção dos usuários sobre experiência e recomendação.
        </p>
      </div>

      <PlatformFeedbackList
        data={feedback}
        filters={{
          from,
          to,
          minScore,
          maxScore,
        }}
      />
    </div>
  )
}
