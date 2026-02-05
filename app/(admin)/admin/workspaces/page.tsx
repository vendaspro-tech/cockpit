import { getPlans } from "@/app/actions/admin/plans"
import { getSubscriptionStats } from "@/app/actions/admin/subscriptions"
import { WorkspacesBillingDashboard } from "@/components/admin/workspaces-billing-dashboard"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminWorkspacesPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const [{ stats, items }, plans] = await Promise.all([
    getSubscriptionStats(),
    getPlans()
  ])

  // Extract plan names/slugs. Assuming plans have 'name' or we use a fixed list if plans are dynamic.
  // Actually, the `workspaces` table `plan` column currently has a check constraint: 'starter', 'pro', 'enterprise'.
  // But our new `plans` table allows dynamic plans.
  // We should probably update the constraint on `workspaces` table eventually to allow any plan from `plans` table.
  // For now, I'll pass the names of the dynamic plans, but also include the hardcoded ones if they are not in the DB.
  // Or better, I'll just pass the names of the plans from the DB.
  
  // Normaliza lista de planos usando apenas o que existe de fato (tabela + itens retornados), deduplicando case-insensitive mas preservando o rótulo original
  const planMap = new Map<string, string>()
  const addPlan = (name?: string | null) => {
    if (!name) return
    const key = name.toLowerCase()
    if (!planMap.has(key)) planMap.set(key, name)
  }
  plans.forEach((p) => addPlan(p.name))
  items.forEach((i) => addPlan(i.plan_name))
  const availablePlans = Array.from(planMap.values())

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspaces & Assinaturas</h1>
        <p className="text-muted-foreground">
          Gestão unificada de workspaces, planos e status de cobrança.
        </p>
      </div>

      <WorkspacesBillingDashboard
        stats={stats}
        items={items}
        availablePlans={availablePlans}
      />
    </div>
  )
}
