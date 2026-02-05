import { getAvailablePlans, getWorkspacePlanUsage } from "@/app/actions/plans"
import { PlanCard } from "@/components/settings/plan-card"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package } from "lucide-react"

interface BillingPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { workspaceId } = await params
  const usage = await getWorkspacePlanUsage(workspaceId)
  const plans = await getAvailablePlans()

  const usersPercentage = usage.maxUsers ? (usage.currentUsers / usage.maxUsers) * 100 : 0
  const productsPercentage = usage.maxProducts ? (usage.currentProducts / usage.maxProducts) * 100 : 0

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Planos e Cobrança</h1>
        <p className="text-muted-foreground">Gerencie seu plano e visualize o uso do workspace.</p>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Uso de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {usage.currentUsers} / {usage.maxUsers || '∞'}
            </div>
            <Progress value={usersPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {usage.maxUsers ? `${Math.round(usersPercentage)}% do limite utilizado` : 'Sem limite de usuários'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Uso de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {usage.currentProducts} / {usage.maxProducts || '∞'}
            </div>
            <Progress value={productsPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {usage.maxProducts ? `${Math.round(productsPercentage)}% do limite utilizado` : 'Sem limite de produtos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4">Planos Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              currentPlanId={usage.planId}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
