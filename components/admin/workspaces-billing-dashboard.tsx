'use client'

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, CreditCard, Users, Activity, Search, Filter } from "lucide-react"

import { SubscriptionItem, SubscriptionStats } from "@/app/actions/admin/subscriptions"
import {
  deleteWorkspace,
  updateWorkspaceLeaderCopilot,
  updateWorkspacePlan,
  updateWorkspaceStatus,
} from "@/app/actions/admin/workspaces"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash, CreditCard as CreditCardIcon } from "lucide-react"

interface WorkspacesBillingDashboardProps {
  stats: SubscriptionStats
  items: SubscriptionItem[]
  availablePlans: string[]
}

export function WorkspacesBillingDashboard({
  stats,
  items,
  availablePlans,
}: WorkspacesBillingDashboardProps) {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [ownerFilter, setOwnerFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [copilotUpdating, setCopilotUpdating] = useState<string | null>(null)
  const normalizedPlans = useMemo(
    () =>
      availablePlans.map((label) => ({
        label,
        value: label.toLowerCase(),
      })),
    [availablePlans]
  )

  // Avoid Radix hydration issues by mounting on client
  useEffect(() => setMounted(true), [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.workspace_name.toLowerCase().includes(search.toLowerCase())

      const matchesOwner =
        !ownerFilter ||
        item.owner_email?.toLowerCase().includes(ownerFilter.toLowerCase()) ||
        item.owner_name?.toLowerCase().includes(ownerFilter.toLowerCase())

      const matchesPlan =
        planFilter === "all" || item.plan_name?.toLowerCase() === planFilter

      const matchesStatus =
        statusFilter === "all" || (item.status || "active") === statusFilter

      const created = new Date(item.created_at)
      const matchesFrom = dateFrom ? created >= new Date(dateFrom) : true
      const matchesTo = dateTo ? created <= new Date(dateTo + "T23:59:59") : true

      return (
        matchesSearch &&
        matchesOwner &&
        matchesPlan &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      )
    })
  }, [items, search, ownerFilter, planFilter, statusFilter, dateFrom, dateTo])

  const handleUpdatePlan = async (id: string, planValue: string) => {
    const planLabel =
      normalizedPlans.find((p) => p.value === planValue)?.label || planValue
    setIsUpdating(id)
    const result = await updateWorkspacePlan(id, planLabel)
    setIsUpdating(null)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar plano",
        description: result.error,
      })
    } else {
      toast({
        title: "Plano atualizado",
        description: "Plano do workspace atualizado com sucesso.",
      })
    }
  }

  const handleUpdateStatus = async (
    id: string,
    status: "active" | "suspended" | "cancelled"
  ) => {
    setStatusUpdating(id)
    const result = await updateWorkspaceStatus(id, status)
    setStatusUpdating(null)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: result.error,
      })
    } else {
      toast({
        title: "Status atualizado",
        description: "Status do workspace atualizado com sucesso.",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este workspace? Esta ação é irreversível e apagará todos os dados associados."
      )
    )
      return

    const result = await deleteWorkspace(id)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: result.error,
      })
    } else {
      toast({
        title: "Workspace excluído",
        description: "Workspace removido com sucesso.",
      })
    }
  }

  const handleToggleLeaderCopilot = async (workspaceId: string, enabled: boolean) => {
    setCopilotUpdating(workspaceId)
    const result = await updateWorkspaceLeaderCopilot(workspaceId, enabled)
    setCopilotUpdating(null)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar Copiloto",
        description: result.error,
      })
    } else {
      toast({
        title: "Permissão atualizada",
        description: enabled
          ? "Copiloto do Líder ativado para o workspace."
          : "Copiloto do Líder desativado para o workspace.",
      })
    }
  }

  const resetFilters = () => {
    setSearch("")
    setOwnerFilter("")
    setPlanFilter("all")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const statusBadge = (status: string) => {
    if (status === "active") return "bg-green-600 hover:bg-green-700 text-white"
    if (status === "cancelled") return "bg-rose-600 hover:bg-rose-700 text-white"
    if (status === "suspended") return "bg-amber-500 hover:bg-amber-600 text-white"
    return "bg-muted text-foreground"
  }

  if (!mounted) return null

  return (
    <div className="space-y-8">
      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.total_mrr)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita mensal recorrente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">Workspaces pagantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.churn_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Taxa de cancelamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_active_users}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuários na plataforma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtrar resultados
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Workspace</label>
            <div className="relative w-[240px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome"
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Email/Nome do dono</label>
            <Input
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              placeholder="Buscar por dono"
              className="w-[240px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Plano</label>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {normalizedPlans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Status cobrança</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Criado a partir de</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Criado até</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
            Limpar
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Dono</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Copiloto Líder</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Cancelamento</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Nenhum workspace encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const planValue = item.plan_name ? item.plan_name.toLowerCase() : ""
                const planLabel =
                  normalizedPlans.find((p) => p.value === planValue)?.label ||
                  item.plan_name ||
                  "-"
                const statusValue = item.status || "active"
                return (
                  <TableRow key={item.workspace_id}>
                    <TableCell className="font-medium">{item.workspace_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{item.owner_name || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.owner_email || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {planLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge(item.status || "active")}>
                        {(item.status || "active") === "active"
                          ? "Ativo"
                          : (item.status || "active") === "cancelled"
                          ? "Cancelado"
                          : (item.status || "active") === "suspended"
                          ? "Suspenso"
                          : item.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={Boolean(item.leader_copilot_enabled)}
                          onCheckedChange={(checked) =>
                            handleToggleLeaderCopilot(item.workspace_id, checked)
                          }
                          disabled={copilotUpdating === item.workspace_id}
                          aria-label="Ativar Copiloto do Líder"
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.leader_copilot_enabled ? "Ativado" : "Desativado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.active_users}</span>
                        <span className="text-muted-foreground">
                          {item.plan_limit ? `/ ${item.plan_limit}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {item.cancelled_at
                        ? format(new Date(item.cancelled_at), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
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
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <CreditCardIcon className="mr-2 h-4 w-4" />
                              Alterar Plano
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={planValue}
                              onValueChange={(value) =>
                                handleUpdatePlan(item.workspace_id, value)
                              }
                            >
                                {normalizedPlans.map((plan) => (
                                  <DropdownMenuRadioItem
                                    key={plan.value}
                                    value={plan.value}
                                    className="capitalize"
                                  >
                                    {plan.label}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Activity className="mr-2 h-4 w-4" />
                              Alterar Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={statusValue}
                                onValueChange={(value) =>
                                  handleUpdateStatus(
                                    item.workspace_id,
                                    value as "active" | "suspended" | "cancelled"
                                  )
                                }
                              >
                                <DropdownMenuRadioItem
                                  value="active"
                                  disabled={statusUpdating === item.workspace_id}
                                >
                                  Ativo
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                  value="suspended"
                                  disabled={statusUpdating === item.workspace_id}
                                >
                                  Suspenso
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                  value="cancelled"
                                  disabled={statusUpdating === item.workspace_id}
                                >
                                  Cancelado
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.workspace_id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
