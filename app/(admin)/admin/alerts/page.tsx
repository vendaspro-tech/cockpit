import { getSystemAlerts } from "@/app/actions/admin/alerts"
import { AlertsList } from "@/components/admin/alerts-list"
import { AlertDialog } from "@/components/admin/alert-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminAlertsPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const alerts = await getSystemAlerts()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertas do Sistema</h1>
          <p className="text-muted-foreground">
            Crie e gerencie alertas que serão exibidos para os usuários.
          </p>
        </div>
        <AlertDialog 
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Alerta
            </Button>
          }
        />
      </div>

      <AlertsList alerts={alerts} />
    </div>
  )
}
