import { getAuthUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import ControlePerformanceModule from "@/components/performance/controle-performance-module"

interface PerformancePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function PerformancePage({ params }: PerformancePageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const fallbackUser = user.email?.split("@")[0] || user.id
  const embeddedUser = user.user_metadata?.username || fallbackUser
  const embeddedCompany = user.user_metadata?.company || user.user_metadata?.full_name || "Workspace"

  return (
    <div key={workspaceId} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Performance</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie metas, funil e produtividade por vendedor e por produto.
        </p>
      </div>
      <ControlePerformanceModule
        embeddedUser={embeddedUser}
        embeddedCompany={embeddedCompany}
        workspaceId={workspaceId}
      />
    </div>
  )
}
