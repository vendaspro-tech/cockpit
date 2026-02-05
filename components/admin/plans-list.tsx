'use client'

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Copy, Pencil, Power, Check, X } from "lucide-react"
import { useState } from "react"
import { duplicatePlan, togglePlanStatus } from "@/app/actions/admin/plans"
import { useToast } from "@/hooks/use-toast"
import { PlanDialog } from "./plan-dialog"
import { useRouter } from "next/navigation"

interface Plan {
  id: string
  name: string
  max_users: number | null
  price_monthly: number
  color: string
  features: Record<string, boolean>
  active: boolean
}

interface PlansListProps {
  plans: Plan[]
}

export function PlansList({ plans }: PlansListProps) {
  const { toast } = useToast()
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const router = useRouter()

  const handleDuplicate = async (planId: string) => {
    const result = await duplicatePlan(planId)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Plano duplicado com sucesso"
      })
      router.refresh()
    }
  }

  const handleToggleStatus = async (plan: Plan) => {
    const result = await togglePlanStatus(plan.id, !plan.active)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: `Plano ${plan.active ? 'desativado' : 'ativado'} com sucesso`
      })
      router.refresh()
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum plano encontrado.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(plan.price_monthly)}
                  </TableCell>
                  <TableCell>
                    {plan.max_users === null ? 'Ilimitado' : plan.max_users}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.active ? "default" : "secondary"}>
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingPlan(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(plan.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                          <Power className="mr-2 h-4 w-4" />
                          {plan.active ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PlanDialog
        plan={editingPlan || undefined}
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
      />
    </>
  )
}
