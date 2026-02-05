"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Package, Tag, User, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AssessmentsTable } from "@/components/assessments/assessments-table"
import { createAssessment, deleteAssessment } from "@/app/actions/assessments"
import { toast } from "sonner"

interface ProductOption {
  id: string
  name: string
}

interface DefAssessmentsClientProps {
  initialData: any[]
  workspaceId: string
  products: ProductOption[]
}

export function DefAssessmentsClient({ initialData, workspaceId, products }: DefAssessmentsClientProps) {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<string>("none")
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending_evaluation" | "completed">("all")
  const [userFilter, setUserFilter] = useState<string>("")
  const [pdiFilter, setPdiFilter] = useState<"all" | "with" | "without">("all")

  const handleCreate = () => {
    startTransition(async () => {
      await createAssessment(
        workspaceId,
        "def_method",
        selectedProduct === "none" ? undefined : selectedProduct
      ).catch((error: any) => {
        // Ignore redirect errors (Next.js uses errors for redirects)
        if (error?.digest) return
        console.error("Erro ao criar avaliação DEF:", error)
        toast.error("Não foi possível criar a avaliação.")
      })
    })
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      try {
        await deleteAssessment(workspaceId, id)
        toast.success("Avaliação excluída.")
        router.refresh()
      } catch (error) {
        console.error("Erro ao excluir avaliação:", error)
        toast.error("Não foi possível excluir.")
      } finally {
        setDeletingId(null)
      }
    })
  }

  const filteredData = useMemo(() => {
    const normalizedUser = userFilter.trim().toLowerCase()

    return (initialData || []).filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      const matchesProduct =
        selectedProduct === "none" || item.product_id === selectedProduct
      const hasPdi = Boolean(item.pdi_id)
      const matchesPdi =
        pdiFilter === "all" || (pdiFilter === "with" ? hasPdi : !hasPdi)

      const name = item.evaluated_user?.full_name || ""
      const email = item.evaluated_user?.email || ""
      const matchesUser =
        !normalizedUser ||
        name.toLowerCase().includes(normalizedUser) ||
        email.toLowerCase().includes(normalizedUser)

      return matchesStatus && matchesPdi && matchesUser && matchesProduct
    })
  }, [initialData, statusFilter, pdiFilter, userFilter, selectedProduct])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Avaliações - Matriz DEF
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize e crie avaliações rotineiras da Matriz DEF.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end justify-end">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="w-3 h-3" /> Produto
              </label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem produto vinculado</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" /> Status
              </label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending_evaluation">Aguardando</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Usuário
              </label>
              <Input
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Buscar por nome ou email"
                className="w-[200px] h-9"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <ListChecks className="w-3 h-3" /> PDI
              </label>
              <Select value={pdiFilter} onValueChange={(v: any) => setPdiFilter(v)}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with">Com PDI</SelectItem>
                  <SelectItem value="without">Sem PDI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={isPending} className="min-w-[160px]">
            <Plus className="w-4 h-4 mr-2" />
            Nova avaliação
          </Button>
        </div>
      </div>

      <AssessmentsTable
        data={filteredData}
        workspaceId={workspaceId}
        onDelete={handleDelete}
        showProductColumn
      />

      {isPending && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Package className="w-4 h-4" />
          Processando...
        </div>
      )}

      {deletingId && (
        <div className="text-sm text-muted-foreground">
          Excluindo avaliação...
        </div>
      )}
    </div>
  )
}
