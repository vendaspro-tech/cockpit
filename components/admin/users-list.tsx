'use client'

import { useEffect, useState } from "react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MoreHorizontal, Trash, Shield, ShieldAlert, Search, User, Activity, Briefcase } from "lucide-react"
import { deleteUser, toggleUserSuperAdmin, updateUserStatus, UserWithDetails } from "@/app/actions/admin/users"
import { useToast } from "@/hooks/use-toast"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { UserJobTitlesDialog } from "@/components/admin/user-job-titles-dialog"

interface UsersListProps {
  users: UserWithDetails[]
}

export function UsersList({ users }: UsersListProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [accessLevelFilter, setAccessLevelFilter] = useState("all")
  const [profileFilter, setProfileFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [userToDelete, setUserToDelete] = useState<UserWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [userForJobTitles, setUserForJobTitles] = useState<UserWithDetails | null>(null)
  const [mounted, setMounted] = useState(false)

  // Evita mismatch de hidratação com componentes Radix (Select/Popover)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    const result = await deleteUser(userToDelete.id)
    setIsDeleting(false)
    setUserToDelete(null)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso"
      })
    }
  }

  const handleToggleSuperAdmin = async (user: UserWithDetails) => {
    const newStatus = !user.is_super_admin
    const action = newStatus ? "promover a" : "remover de"
    
    if (!confirm(`Tem certeza que deseja ${action} Super Admin?`)) return

    const result = await toggleUserSuperAdmin(user.id, newStatus)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: `Usuário ${newStatus ? 'promovido a' : 'removido de'} Super Admin`
      })
    }
  }

  const handleUpdateStatus = async (user: UserWithDetails, status: 'active' | 'inactive') => {
    if (user.status === status) return

    const actionLabel = status === 'active' ? 'reativar' : 'inativar'
    if (!confirm(`Tem certeza que deseja ${actionLabel} ${user.full_name || user.email}?`)) return

    setStatusUpdatingId(user.id)
    const result = await updateUserStatus(user.id, status)
    setStatusUpdatingId(null)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Status atualizado",
        description: `Usuário ${status === 'active' ? 'reativado' : 'inativado'} com sucesso`
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())

    const matchesAccessLevel = 
      accessLevelFilter === "all" ||
      (accessLevelFilter === "super_admin" && user.is_super_admin) ||
      (accessLevelFilter === "owner" && user.access_levels.includes('owner')) ||
      (accessLevelFilter === "admin" && user.access_levels.includes('admin')) ||
      (accessLevelFilter === "member" && user.access_levels.includes('member'))

    const matchesProfile = 
      profileFilter === "all" ||
      user.profiles.includes(profileFilter)

    const matchesStatus = 
      statusFilter === "all" ||
      user.status === statusFilter

    let matchesDate = true
    if (dateRange?.from) {
      const userDate = parseISO(user.created_at)
      const start = startOfDay(dateRange.from)
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
      
      matchesDate = isWithinInterval(userDate, { start, end })
    }

    return matchesSearch && matchesAccessLevel && matchesProfile && matchesStatus && matchesDate
  })

  // Helper to get unique profiles for filter
  const allProfiles = Array.from(new Set(users.flatMap(u => u.profiles))).sort()

  if (!mounted) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="relative w-full md:w-[325px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Nível de Acesso" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Níveis</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Membro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={profileFilter} onValueChange={setProfileFilter}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Perfil de Acesso" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Perfis</SelectItem>
            {allProfiles.map(profile => (
              <SelectItem key={profile} value={profile}>{profile}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="banned">Banido</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nível de Acesso</TableHead>
              <TableHead>Perfil de Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Workspaces</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.is_super_admin && (
                        <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                          Super Admin
                        </Badge>
                      )}
                      {user.access_levels.includes('owner') && (
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                          Owner
                        </Badge>
                      )}
                      {user.access_levels.includes('admin') && (
                        <Badge variant="secondary">
                          Admin
                        </Badge>
                      )}
                      {user.access_levels.includes('member') && (
                        <Badge variant="outline">
                          Membro
                        </Badge>
                      )}
                      {!user.is_super_admin && user.access_levels.length === 0 && (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.profiles.length > 0 ? (
                        user.profiles.map(profile => (
                          <Badge key={profile} variant="outline" className="font-normal">
                            {profile}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={
                      user.status === 'active' ? 'bg-green-600 hover:bg-green-700' : ''
                    }>
                      {user.status === 'active' ? 'Ativo' : 
                       user.status === 'inactive' ? 'Inativo' : 
                       user.status === 'banned' ? 'Banido' : user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.workspaces_count}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
                        
                        <DropdownMenuItem onClick={() => setUserForJobTitles(user)}>
                          <Briefcase className="mr-2 h-4 w-4" />
                          Gerenciar Cargos
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleToggleSuperAdmin(user)}>
                          {user.is_super_admin ? (
                            <>
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Remover Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Tornar Admin
                            </>
                          )}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      {user.status === 'active' ? (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(user, 'inactive')}
                          disabled={statusUpdatingId === user.id}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          Inativar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(user, 'active')}
                          disabled={statusUpdatingId === user.id}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          Reativar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => setUserToDelete(user)}
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

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `Esta ação removerá ${userToDelete.full_name || userToDelete.email} do Supabase. A operação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {userForJobTitles && (
        <UserJobTitlesDialog
          user={userForJobTitles}
          onClose={() => setUserForJobTitles(null)}
        />
      )}
    </div>
  )
}
