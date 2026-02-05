import { redirect } from "next/navigation"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { getProActionPlans, getProConsultancies, getProWorkspaceUsers, getProWorkspaces } from "@/app/actions/admin/comercial-pro"
import { ComercialProConsultoriasPanel } from "@/components/admin/comercial-pro-consultorias-panel"

export default async function AdminComercialProConsultoriasPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) redirect("/")

  const workspaces = await getProWorkspaces()
  const firstWorkspaceId = workspaces[0]?.id
  const [consultancies, users, plans] = firstWorkspaceId
    ? await Promise.all([
        getProConsultancies(firstWorkspaceId),
        getProWorkspaceUsers(firstWorkspaceId),
        getProActionPlans(firstWorkspaceId)
      ])
    : [[], [], []]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Consultorias PRO</h1>
        <p className="text-muted-foreground max-w-2xl">
          Cadastre consultorias por workspace, vincule mentor, gravação e plano de ação.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <p className="text-muted-foreground">Nenhum workspace encontrado.</p>
      ) : (
        <ComercialProConsultoriasPanel
          workspaces={workspaces as any}
          initialWorkspaceId={firstWorkspaceId}
          initialConsultancies={consultancies as any}
          initialUsers={users as any}
          initialPlans={(plans as any).map((p: any) => ({ id: p.id, name: p.name }))}
        />
      )}
    </div>
  )
}
