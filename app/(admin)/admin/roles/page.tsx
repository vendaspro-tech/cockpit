import { getRoles } from "@/app/actions/admin/roles"
import { RolesList } from "@/components/admin/roles-list"
import { RoleDialog } from "@/components/admin/role-dialog"
import { PermissionsMatrix } from "@/components/admin/permissions-matrix"
import { AccessLevelsDocs } from "@/components/admin/access-levels-docs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminRolesPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const roles = await getRoles()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Níveis de Acesso do Sistema</h1>
          <p className="text-muted-foreground">
            Documentação dos níveis de permissão (owner, admin, member). Para gerenciar cargos, acesse Job Titles.
          </p>
        </div>
      </div>

      <Tabs defaultValue="docs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
          <TabsTrigger value="permissions">Matriz de Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-4">
          <AccessLevelsDocs />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="rounded-md border p-4 bg-muted/10 mb-4">
            <p className="text-sm text-muted-foreground">
              A matriz de permissões mostra o que cada nível de acesso pode fazer no sistema.
              Estes níveis são fixos: Owner, Admin e Member.
            </p>
          </div>
          <PermissionsMatrix roles={roles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
