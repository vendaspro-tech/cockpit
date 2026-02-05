'use client'

import { useState } from "react"
import { UserDashboard } from "./user-dashboard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreHorizontal } from "lucide-react"
import { updateMemberJobTitle, updateMemberRole } from "@/app/actions/teams"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Filter, Shield } from "lucide-react"

interface Member {
  id: string
  role: string
  user: {
    id: string
    full_name: string | null
    email: string
    supabase_user_id?: string
  } | null
  job_title: {
    id: string
    name: string
  } | null
}

interface JobTitle {
  id: string
  name: string
}

interface Role {
  slug: string
  name: string
  description: string
}

interface MembersListProps {
  workspaceId: string
  members: Member[]
  jobTitles: JobTitle[]
  roles: Role[]
}

export function MembersList({ workspaceId, members, jobTitles, roles }: MembersListProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const { toast } = useToast()

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter

    return matchesSearch && matchesRole
  })

  const selectedMember = members.find(m => m.id === selectedMemberId)

  const handleJobTitleChange = async (memberId: string, jobTitleId: string) => {
    const result = await updateMemberJobTitle(workspaceId, memberId, jobTitleId)
    if (result.error) {
      toast({
        title: "Erro ao atualizar cargo",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Cargo atualizado",
        description: "O cargo foi atualizado com sucesso.",
      })
    }
  }

  const handleRoleChange = async (memberId: string, role: string) => {
    const result = await updateMemberRole(workspaceId, memberId, role)
    if (result.error) {
      toast({
        title: "Erro ao atualizar função",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Função atualizada",
        description: "A função foi atualizada com sucesso.",
      })
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "default",
      admin: "secondary",
      leader: "outline",
      closer: "outline",
      sdr: "outline"
    }
    return colors[role] || "outline"
  }

  return (
    <div className="flex h-full">
      {/* Members List - Left Panel (25%) */}
      <div className="w-[25%] flex flex-col border-r">
        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar por função
                {roleFilter !== "all" && (
                  <Badge variant="secondary" className="ml-auto">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Função</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={roleFilter} onValueChange={setRoleFilter}>
                <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
                {roles.map((role) => (
                  <DropdownMenuRadioItem key={role.slug} value={role.slug}>
                    {role.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum membro encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente buscar por outro termo ou filtro.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedMemberId(member.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedMemberId === member.id}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedMemberId === member.id ? 'bg-muted' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {member.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                       member.user?.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">
                        {member.user?.full_name || member.user?.email}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMemberId(member.id)
                          }}>
                            Ver detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {member.user?.full_name && (
                      <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getRoleColor(member.role) as any}>
                        <Shield className="h-3 w-3 mr-1" />
                        {roles.find(r => r.slug === member.role)?.name || member.role}
                      </Badge>
                      {member.job_title && (
                        <Badge variant="outline" className="text-xs">
                          {member.job_title.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Dashboard - Right Panel (75%) */}
      {selectedMemberId && selectedMember ? (
        <div className="w-[75%] overflow-y-auto bg-background animate-in fade-in slide-in-from-right-4 duration-300">
          <UserDashboard 
            member={selectedMember} 
            jobTitles={jobTitles}
            roles={roles}
            onJobTitleChange={handleJobTitleChange}
            onRoleChange={handleRoleChange}
            onClose={() => setSelectedMemberId(null)}
          />
        </div>
      ) : (
        <div className="w-[75%] flex items-center justify-center p-8 text-center">
          <div>
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Gerencie seu Time</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione um membro da lista ao lado para ver detalhes, editar cargos ou gerenciar permissões.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
