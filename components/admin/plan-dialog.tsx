'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { createPlan, updatePlan } from "@/app/actions/admin/plans"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus } from "lucide-react"
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

interface PlanDialogProps {
  plan?: Plan
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DEFAULT_FEATURES = {
  assessments: true,
  pdi: true,
  def_matrix: false,
  custom_reports: false,
  api_access: false
}

export function PlanDialog({ plan, trigger, open, onOpenChange }: PlanDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

  const [formData, setFormData] = useState({
    name: plan?.name || "",
    max_users: plan?.max_users?.toString() || "",
    price_monthly: plan?.price_monthly?.toString() || "0",
    color: plan?.color || "#3b82f6",
    features: plan?.features || DEFAULT_FEATURES
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const price = parseFloat(formData.price_monthly)
      if (Number.isNaN(price) || price < 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Informe um preço mensal maior ou igual a zero."
        })
        setIsLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        price_monthly: price,
        color: formData.color,
        features: formData.features as Record<string, boolean>,
        active: plan?.active ?? true
      }

      const result = plan 
        ? await updatePlan(plan.id, payload)
        : await createPlan(payload)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error
        })
      } else {
        toast({
          title: "Sucesso",
          description: plan ? "Plano atualizado com sucesso" : "Plano criado com sucesso"
        })
        setIsOpen(false)
        router.refresh()
        if (!plan) {
          setFormData({
            name: "",
            max_users: "",
            price_monthly: "0",
            color: "#3b82f6",
            features: DEFAULT_FEATURES
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFeature = (key: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !(prev.features as Record<string, boolean>)[key]
      }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{plan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            <DialogDescription>
              Configure os detalhes e limites do plano.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Preço Mensal (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_users">Máx. Usuários</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="0"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Cor do Calendário</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 p-1 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Funcionalidades</Label>
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
                {Object.entries(DEFAULT_FEATURES).map(([key, _]) => (
                  <div key={key} className="flex items-center justify-between space-x-2">
                    <Label htmlFor={`feature-${key}`} className="capitalize">
                      {key.replace('_', ' ')}
                    </Label>
                    <Switch
                      id={`feature-${key}`}
                      checked={(formData.features as Record<string, boolean>)[key] || false}
                      onCheckedChange={() => toggleFeature(key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
