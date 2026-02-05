import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getCommercialPlan } from '@/app/actions/commercial-plans'
import { Loader2 } from 'lucide-react'
import { PlanEditor } from '@/components/commercial-plan/plan-editor'

interface PlanPageProps {
  params: Promise<{
    workspaceId: string
    planId: string
  }>
}

async function PlanContent({ planId }: { planId: string }) {
  const { data: plan, error } = await getCommercialPlan(planId)

  if (error) {
    if (error.includes('Access denied')) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para visualizar este plano
            </p>
          </div>
        </div>
      )
    }
    notFound()
  }

  if (!plan) {
    notFound()
  }

  return <PlanEditor plan={plan} />
}

export default async function PlanPage({ params }: PlanPageProps) {
  const user = await getAuthUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Next.js 16: params is now a Promise
  const { planId } = await params

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PlanContent planId={planId} />
    </Suspense>
  )
}
