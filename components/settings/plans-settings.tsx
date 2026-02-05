import { getPlans } from "@/app/actions/admin/plans"
import { PlanCard } from "@/components/settings/plan-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

interface PlansSettingsProps {
  workspaceId: string
}

export async function PlansSettings({ workspaceId }: PlansSettingsProps) {
  const plans = await getPlans()
  const supabase = await createClient()
  
  // Get current workspace plan
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan_id')
    .eq('id', workspaceId)
    .single()

  const currentPlanId = workspace?.plan_id

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Planos Disponíveis</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o plano ideal para o seu workspace.
        </p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum plano disponível</CardTitle>
            <CardDescription>
              Entre em contato com o administrador do sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans
            .filter(plan => plan.active)
            .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlanId={currentPlanId}
                workspaceId={workspaceId}
              />
            ))}
        </div>
      )}
    </div>
  )
}
