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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { createKpi, updateKpi } from "@/app/actions/admin/kpis"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Kpi {
  id: string
  name: string
  description: string
  category: string
  benchmark: string
  formula: string
  display_order: number
  is_active: boolean
}

interface KpiDialogProps {
  kpi?: Kpi
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CATEGORIES = [
  "Funil Venda Direta",
  "Funil Sessão Estratégica",
  "Marketing",
  "Financeiro",
  "Outros"
]

export function KpiDialog({ kpi, trigger, open, onOpenChange }: KpiDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

  const [formData, setFormData] = useState({
    name: kpi?.name || "",
    description: kpi?.description || "",
    category: kpi?.category || "",
    benchmark: kpi?.benchmark || "",
    formula: kpi?.formula || "",
    display_order: kpi?.display_order?.toString() || "0"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        benchmark: formData.benchmark,
        formula: formData.formula,
        display_order: parseInt(formData.display_order) || 0,
        is_active: kpi?.is_active ?? true
      }

      const result = kpi 
        ? await updateKpi(kpi.id, payload)
        : await createKpi(payload)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error
        })
      } else {
        toast({
          title: "Sucesso",
          description: kpi ? "KPI atualizado com sucesso" : "KPI criado com sucesso"
        })
        setIsOpen(false)
        if (!kpi) {
          setFormData({
            name: "",
            description: "",
            category: "",
            benchmark: "",
            formula: "",
            display_order: "0"
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{kpi ? "Editar KPI" : "Novo KPI"}</DialogTitle>
            <DialogDescription>
              Configure os detalhes do indicador de performance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="benchmark">Benchmark</Label>
                <Input
                  id="benchmark"
                  value={formData.benchmark}
                  onChange={(e) => setFormData({ ...formData, benchmark: e.target.value })}
                  placeholder="Ex: 20%"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="formula">Fórmula de Cálculo</Label>
              <Input
                id="formula"
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                placeholder="Ex: (Vendas / Leads) * 100"
                required
              />
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
