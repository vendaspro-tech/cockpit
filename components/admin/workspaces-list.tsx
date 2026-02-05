'use client'

import React from "react"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash, CreditCard } from "lucide-react"
import { useState } from "react"
import { deleteWorkspace, updateWorkspacePlan, WorkspaceWithDetails } from "@/app/actions/admin/workspaces"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface WorkspacesListProps {
  workspaces: WorkspaceWithDetails[]
  availablePlans: string[]
}

export function WorkspacesList({ workspaces, availablePlans }: WorkspacesListProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [nameFilter, setNameFilter] = useState("")
  const [ownerFilter, setOwnerFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Avoid hydration mismatch from Radix IDs by rendering only after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este workspace? Esta ação é irreversível e apagará todos os dados associados.")) return

    const result = await deleteWorkspace(id)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Workspace excluído com sucesso"
      })
    }
  }

  const handleUpdatePlan = async (id: string, plan: string) => {
    setIsUpdating(true)
    const result = await updateWorkspacePlan(id, plan)
    setIsUpdating(false)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso"
      })
    }
  }

  const filtered = workspaces.filter((ws) => {
    const matchesName =
      !nameFilter ||
      ws.name.toLowerCase().includes(nameFilter.toLowerCase())
    const matchesOwner =
      !ownerFilter ||
      ws.owner_email?.toLowerCase().includes(ownerFilter.toLowerCase()) ||
      ws.owner_name?.toLowerCase().includes(ownerFilter.toLowerCase())
    const matchesPlan = planFilter === "all" || ws.plan === planFilter
    const created = new Date(ws.created_at)
    const matchesFrom = dateFrom ? created >= new Date(dateFrom) : true
    const matchesTo = dateTo ? created <= new Date(dateTo + "T23:59:59") : true

    return matchesName && matchesOwner && matchesPlan && matchesFrom && matchesTo
  })

  const clearFilters = () => {
    setNameFilter("")
    setOwnerFilter("")
    setPlanFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  return (
    !mounted ? null : (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Nome do workspace</label>
          <Input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Buscar por nome"
            className="w-[220px]"
          />
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
              {availablePlans.map((plan) => (
                <SelectItem key={plan} value={plan}>
                  {plan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Data início</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Data fim</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
          Limpar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Dono</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum workspace encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ws) => (
                <TableRow key={ws.id}>
                  <TableCell className="font-medium">{ws.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{ws.owner_name || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">{ws.owner_email || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {ws.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{ws.member_count}</TableCell>
                  <TableCell>
                    {format(new Date(ws.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
                            <CreditCard className="mr-2 h-4 w-4" />
                            Alterar Plano
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup 
                              value={ws.plan} 
                              onValueChange={(value) => handleUpdatePlan(ws.id, value)}
                            >
                              {availablePlans.map(plan => (
                                <DropdownMenuRadioItem key={plan} value={plan} className="capitalize">
                                  {plan}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleDelete(ws.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
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
    </div>
    )
  )
}
