import { getPlans } from "@/app/actions/admin/plans"
import { PlansList } from "@/components/admin/plans-list"
import { PlanDialog } from "@/components/admin/plan-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminPlansPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const plans = await getPlans()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura disponíveis no sistema.
          </p>
        </div>
        <PlanDialog 
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          }
        />
      </div>

      <PlansList plans={plans} />
    </div>
  )
}
