import { InviteUserDialog } from "@/components/teams/invite-user-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UsersSettingsProps {
  workspaceId: string
  members: any[]
  invitations: any[]
  planUsage: any
  roles: any[]
  jobTitles?: any[]
  currentUserRole: string
}

export function UsersSettings({
  workspaceId,
  members,
  invitations,
  planUsage,
  roles,
  jobTitles,
  currentUserRole
}: UsersSettingsProps) {
  const roleLabels: Record<string, string> = {
    'system_owner': 'Proprietário do Sistema',
    'owner': 'Proprietário',
    'admin': 'Administrador',
    'member': 'Membro'
  }

  const canManage = ['owner', 'admin', 'system_owner'].includes(currentUserRole)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Usuários do Workspace</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie quem tem acesso ao seu workspace.
          </p>
        </div>
        {canManage && (
            <InviteUserDialog
                workspaceId={workspaceId}
                currentUsers={planUsage.active_users}
                maxUsers={planUsage.max_users === -1 ? null : planUsage.max_users}
                planName={planUsage.plan_name}
                roles={roles}
                jobTitles={jobTitles}
            />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros Ativos ({members.length})</CardTitle>
          <CardDescription>Pessoas com acesso atual ao workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={member.user?.avatar_url || ""} />
                  <AvatarFallback>{member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.user?.full_name || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{roleLabels[member.role] || member.role}</Badge>
                {canManage && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Ações</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem disabled>Editar Função (Em breve)</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                             Remover do Workspace
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
         <Card>
         <CardHeader>
           <CardTitle>Convites Pendentes ({invitations.length})</CardTitle>
           <CardDescription>Convites enviados que ainda não foram aceitos.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {invitations.map((invite) => (
             <div key={invite.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <div>
                   <p className="font-medium">{invite.email}</p>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Função: {roleLabels[invite.role] || invite.role}</span>
                        <span>•</span>
                        <span>Enviado em {new Date(invite.created_at).toLocaleDateString()}</span>
                   </div>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <Badge variant="secondary">Pendente</Badge>
                 {canManage && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Revogar convite</span>
                    </Button>
                 )}
               </div>
             </div>
           ))}
         </CardContent>
       </Card>
      )}
    </div>
  )
}
