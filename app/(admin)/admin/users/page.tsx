import { getUsers } from "@/app/actions/admin/users"
import { UsersList } from "@/components/admin/users-list"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminUsersPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const users = await getUsers()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários do sistema.
        </p>
      </div>

      <UsersList users={users} />
    </div>
  )
}
