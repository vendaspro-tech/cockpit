'use client'

import { useState } from "react"
import { UserDashboard } from "./user-dashboard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreHorizontal, UserPlus, Mail, X, Clock, User } from "lucide-react"
import { updateMemberJobTitle, updateMemberRole } from "@/app/actions/teams"
import { revokeInvitation } from "@/app/actions/invitations"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
}

interface TeamsListProps {
  workspaceId: string
  initialMembers: Member[]
  jobTitles: JobTitle[]
  roles: Role[]
  invitations: Invitation[]
}

export function TeamsList({ workspaceId, initialMembers, jobTitles, roles, invitations: initialInvitations }: TeamsListProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [invitations, setInvitations] = useState(initialInvitations)
  const { toast } = useToast()

  const filteredMembers = initialMembers.filter(member => {
    const matchesSearch = 
      member.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter

    return matchesSearch && matchesRole
  })

  const selectedMember = initialMembers.find(m => m.id === selectedMemberId)

  async function handleJobTitleChange(memberId: string, jobTitleId: string) {
    const result = await updateMemberJobTitle(workspaceId, memberId, jobTitleId)
    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Cargo atualizado com sucesso"
      })
    }
  }

  async function handleRoleChange(memberId: string, roleSlug: string) {
    const result = await updateMemberRole(workspaceId, memberId, roleSlug)
    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Função atualizada com sucesso"
      })
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    const result = await revokeInvitation(invitationId)
    if (result.error) {
      toast({
        title: "Erro ao revogar",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Convite revogado",
        description: "O convite foi cancelado com sucesso."
      })
      setInvitations(invitations.filter(i => i.id !== invitationId))
    }
  }

  return (
    <div className="flex h-full">
      {/* Members List - Left Panel */}
      <div className="flex flex-col border-r bg-card transition-all duration-300 w-full md:w-[30%] md:min-w-[320px]">
        
        <Tabs defaultValue="members" className="flex-1 flex flex-col">
          <div className="p-4 border-b space-y-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Membros ({filteredMembers.length})</TabsTrigger>
                <TabsTrigger value="invitations">Convites ({invitations.length})</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className={roleFilter !== 'all' ? 'text-primary border-primary' : ''}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filtrar por Função</DropdownMenuLabel>
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
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="members" className="m-0 h-full">
              {filteredMembers.length > 0 ? (
                <div className="divide-y">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`
                        flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-all
                        ${selectedMemberId === member.id ? 'bg-accent border-l-4 border-l-primary pl-[12px]' : 'border-l-4 border-l-transparent'}
                      `}
                    >
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {member.user?.full_name?.charAt(0) || member.user?.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold truncate text-foreground">{member.user?.full_name || 'Usuário'}</span>
                          <Badge variant="outline" className="capitalize font-normal text-xs bg-background/50">
                            {roles.find(r => r.slug === member.role)?.name || member.role}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            {member.user?.email}
                          </span>
                          {member.job_title && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {member.job_title.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-medium text-lg mb-1">Nenhum membro encontrado</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Tente buscar por outro termo ou limpe os filtros.
                  </p>
                  {roleFilter !== 'all' && (
                    <Button variant="link" onClick={() => setRoleFilter('all')} className="mt-2">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invitations" className="m-0 h-full">
              {invitations.length > 0 ? (
                <div className="divide-y">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors group">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate text-sm text-foreground">{invitation.email}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRevokeInvitation(invitation.id)
                            }}
                            title="Revogar convite"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
                            Pendente
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Enviado em {new Date(invitation.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-medium text-lg mb-1">Nenhum convite pendente</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Todos os convites foram aceitos ou você ainda não enviou nenhum.
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* User Dashboard - Right Panel */}
      {selectedMemberId && selectedMember ? (
        <div className="flex-1 overflow-y-auto bg-background animate-in fade-in slide-in-from-right-4 duration-300 shadow-xl z-20">
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
        !selectedMemberId && (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground bg-muted/5 p-8">
            <div className="text-center max-w-md">
              <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-10 w-10 text-primary/40" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Gerencie seu Time</h2>
              <p className="text-muted-foreground mb-8">
                Selecione um membro da lista ao lado para ver detalhes, editar cargos ou gerenciar permissões.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Funções</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Defina quem é Admin, BDR, Closer, etc.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Cargos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Gerencie Job Titles personalizados.</p>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}
