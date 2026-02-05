import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { AgentForm } from "@/components/admin/ai-agents/agent-form"

export default async function AdminAgentCreatePage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const owner = await isSystemOwner(user.id)
  if (!owner) redirect("/")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Criar Agente</h1>
        <p className="text-muted-foreground">
          Defina o comportamento do agente e publique para os usuários.
        </p>
      </div>
      <AgentForm mode="create" />
    </div>
  )
}
