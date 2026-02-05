import { redirect } from "next/navigation"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { getProActionPlans, getProWorkspaceUsers, getProWorkspaces } from "@/app/actions/admin/comercial-pro"
import { ComercialProPlanosPanel } from "@/components/admin/comercial-pro-planos-panel"

export default async function AdminComercialProPlanosPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) redirect("/")

  const workspaces = await getProWorkspaces()
  const firstWorkspaceId = workspaces[0]?.id
  const [plans, users] = firstWorkspaceId
    ? await Promise.all([
        getProActionPlans(firstWorkspaceId),
        getProWorkspaceUsers(firstWorkspaceId)
      ])
    : [[], []]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Planos de Ação PRO</h1>
        <p className="text-muted-foreground max-w-2xl">
          Gerencie planos por workspace, atribua responsáveis e deadlines.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <p className="text-muted-foreground">Nenhum workspace encontrado.</p>
      ) : (
        <ComercialProPlanosPanel
          workspaces={workspaces as any}
          initialWorkspaceId={firstWorkspaceId}
          initialPlans={plans as any}
          initialUsers={users as any}
        />
      )}
    </div>
  )
}
