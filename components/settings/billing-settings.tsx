import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getPlans } from "@/app/actions/admin/plans"
import { CreditCard, Calendar } from "lucide-react"
import Link from "next/link"

interface BillingSettingsProps {
  workspaceId: string
}

export async function BillingSettings({ workspaceId }: BillingSettingsProps) {
  const supabase = await createClient()
  const plans = await getPlans()
  
  // Get current workspace with plan info
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan_id, created_at')
    .eq('id', workspaceId)
    .single()

  const currentPlan = plans.find(p => p.id === workspace?.plan_id)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Faturamento e Assinatura</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie sua assinatura e informações de pagamento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Plano Atual
              </CardTitle>
              <CardDescription>
                Seu plano ativo e detalhes de cobrança
              </CardDescription>
            </div>
            <Badge variant={currentPlan ? "default" : "secondary"} className="text-base px-4 py-1">
              {currentPlan?.name || 'Nenhum plano'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPlan ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold">
                    {currentPlan.price_monthly === 0 
                      ? 'Grátis' 
                      : new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(currentPlan.price_monthly)
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Limite de Usuários</p>
                  <p className="text-2xl font-bold">
                    {currentPlan.max_users === null ? 'Ilimitado' : currentPlan.max_users}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Workspace criado em {new Date(workspace?.created_at || '').toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="pt-4 border-t">
                <Link href={`/${workspaceId}/settings?tab=plans`}>
                  <Button variant="outline" className="w-full">
                    Ver Todos os Planos
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum plano ativo. Escolha um plano para começar.
              </p>
              <Link href={`/${workspaceId}/settings?tab=plans`}>
                <Button>
                  Escolher Plano
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {currentPlan && currentPlan.price_monthly > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Método de Pagamento</CardTitle>
            <CardDescription>
              Configure seu método de pagamento preferido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A integração com gateway de pagamento será implementada em breve.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
