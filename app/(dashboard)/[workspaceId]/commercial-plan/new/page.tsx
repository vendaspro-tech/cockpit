import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NewPlanForm } from '@/components/commercial-plan/new-plan-form'

interface NewPlanPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function NewPlanPage({ params }: NewPlanPageProps) {
  const user = await getAuthUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Next.js 16: params is now a Promise
  const { workspaceId } = await params

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${workspaceId}/commercial-plan`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Novo Plano Comercial</h2>
        <p className="text-muted-foreground">
          Configure as informações iniciais do seu plano comercial
        </p>
      </div>

      <NewPlanForm workspaceId={workspaceId} />
    </div>
  )
}
