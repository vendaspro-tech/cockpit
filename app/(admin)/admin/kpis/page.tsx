import { getKpis } from "@/app/actions/admin/kpis"
import { KpisList } from "@/components/admin/kpis-list"
import { KpiDialog } from "@/components/admin/kpi-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminKpisPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const kpis = await getKpis()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de KPIs</h1>
          <p className="text-muted-foreground">
            Gerencie os indicadores de performance globais do sistema.
          </p>
        </div>
        <KpiDialog 
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo KPI
            </Button>
          }
        />
      </div>

      <KpisList kpis={kpis} />
    </div>
  )
}
