'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { upgradeWorkspacePlan } from "@/app/actions/plans"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PlanCardProps {
  plan: any
  currentPlanId?: string
  workspaceId: string
}

export function PlanCard({ plan, currentPlanId, workspaceId }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  const isCurrent = plan.id === currentPlanId
  const features = plan.features || {}

  async function handleUpgrade() {
    setIsLoading(true)
    const result = await upgradeWorkspacePlan(workspaceId, plan.id)

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Plano atualizado!",
        description: `O workspace agora está no plano ${plan.name}.`
      })
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Card className={`flex flex-col relative ${isCurrent ? 'border-primary shadow-md' : ''}`}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Plano Atual</Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span className="text-xl font-bold">{plan.name}</span>
          <span className="text-2xl font-bold">
            {plan.price_monthly === 0 ? 'Grátis' : `R$ ${plan.price_monthly}`}
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {plan.max_users ? `Até ${plan.max_users} usuários` : 'Usuários ilimitados'}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>{plan.max_products ? `Até ${plan.max_products} produtos` : 'Produtos ilimitados'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${features.assessments ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features.assessments ? '' : 'text-muted-foreground line-through'}>Avaliações de Desempenho</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${features.pdi ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features.pdi ? '' : 'text-muted-foreground line-through'}>Planos de Desenvolvimento (PDI)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${features.def_matrix ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features.def_matrix ? '' : 'text-muted-foreground line-through'}>Matriz de Análise (DEF)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${features.custom_reports ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={features.custom_reports ? '' : 'text-muted-foreground line-through'}>Relatórios Personalizados</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrent ? "outline" : "default"}
          disabled={isCurrent || isLoading}
          onClick={handleUpgrade}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isCurrent ? 'Plano Atual' : 'Mudar Plano'}
        </Button>
      </CardFooter>
    </Card>
  )
}
