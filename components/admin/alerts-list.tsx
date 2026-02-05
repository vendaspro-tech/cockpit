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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MoreHorizontal, Pencil, Power, Trash, Info, AlertTriangle, AlertCircle, CheckCircle, Search } from "lucide-react"
import { useState } from "react"
import { deleteSystemAlert, toggleAlertStatus } from "@/app/actions/admin/alerts"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog } from "./alert-dialog"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SystemAlert {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  target_role: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface AlertsListProps {
  alerts: SystemAlert[]
}

const TYPE_ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle
}

const TYPE_COLORS = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  success: "text-green-500"
}

export function AlertsList({ alerts }: AlertsListProps) {
  const { toast } = useToast()
  const [editingAlert, setEditingAlert] = useState<SystemAlert | null>(null)
  const [search, setSearch] = useState("")
  const [audienceFilter, setAudienceFilter] = useState("all_roles")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este alerta?")) return

    const result = await deleteSystemAlert(id)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Alerta excluído com sucesso"
      })
    }
  }

  const handleToggleStatus = async (alert: SystemAlert) => {
    const result = await toggleAlertStatus(alert.id, !alert.is_active)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: `Alerta ${alert.is_active ? 'desativado' : 'ativado'} com sucesso`
      })
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(search.toLowerCase()) ||
      alert.message.toLowerCase().includes(search.toLowerCase())

    const matchesAudience = 
      audienceFilter === "all_roles" ||
      alert.target_role === audienceFilter

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && alert.is_active) ||
      (statusFilter === "inactive" && !alert.is_active)

    let matchesDate = true
    if (startDate || endDate) {
      const alertStart = parseISO(alert.start_date)
      const alertEnd = parseISO(alert.end_date)
      const filterStart = startDate ? startOfDay(parseISO(startDate)) : new Date(0)
      const filterEnd = endDate ? endOfDay(parseISO(endDate)) : new Date(8640000000000000) // Max date
      
      // Check if alert period overlaps with filter period
      matchesDate = (alertStart <= filterEnd) && (alertEnd >= filterStart)
    }

    return matchesSearch && matchesAudience && matchesStatus && matchesDate
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={audienceFilter} onValueChange={setAudienceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Público" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_roles">Todos os Públicos</SelectItem>
            <SelectItem value="all">Todos (Geral)</SelectItem>
            <SelectItem value="owner">Donos</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="member">Membros</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[140px]"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Público</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum alerta encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => {
                const Icon = TYPE_ICONS[alert.type]
                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Icon className={`h-4 w-4 ${TYPE_COLORS[alert.type]}`} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{alert.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {alert.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {alert.target_role === 'all' ? 'Todos' : alert.target_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(alert.start_date), "dd/MM", { locale: ptBR })} até {format(new Date(alert.end_date), "dd/MM", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={alert.is_active ? "default" : "secondary"}>
                        {alert.is_active ? "Ativo" : "Inativo"}
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
                          <DropdownMenuItem onClick={() => setEditingAlert(alert)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(alert)}>
                            <Power className="mr-2 h-4 w-4" />
                            {alert.is_active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(alert.id)}
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

      <AlertDialog
        alert={editingAlert || undefined}
        open={!!editingAlert}
        onOpenChange={(open) => !open && setEditingAlert(null)}
      />
    </div>
  )
}
