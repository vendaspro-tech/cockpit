'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Clock, X, Loader2 } from "lucide-react"
import { revokeInvitation } from "@/app/actions/invitations"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
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

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
}

interface InvitationsListProps {
  workspaceId: string
  invitations: Invitation[]
}

export function InvitationsList({ workspaceId, invitations: initialInvitations }: InvitationsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [invitations, setInvitations] = useState(initialInvitations)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filteredInvitations = invitations.filter(inv =>
    inv.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRevoke = async () => {
    if (!revokeId) return

    setIsRevoking(true)
    try {
      const result = await revokeInvitation(revokeId)
      
      if (result.error) {
        toast({
          title: "Erro ao revogar convite",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Convite revogado",
          description: "O convite foi cancelado com sucesso.",
        })
        setInvitations(prev => prev.filter(inv => inv.id !== revokeId))
        router.refresh()
      }
    } finally {
      setIsRevoking(false)
      setRevokeId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Há poucos minutos'
    if (diffInHours < 24) return `Há ${diffInHours}h`
    if (diffInHours < 48) return 'Há 1 dia'
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Há ${diffInDays} dias`
    
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar convite por email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Invitations List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredInvitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Mail className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {invitations.length === 0 ? 'Nenhum convite pendente' : 'Nenhum convite encontrado'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {invitations.length === 0 
                  ? 'Quando você convidar novos membros, eles aparecerão aqui.'
                  : 'Tente buscar por outro email.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{invitation.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(invitation.created_at)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {invitation.status === 'pending' ? 'Pendente' : invitation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRevokeId(invitation.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este convite? O destinatário não poderá mais usar o link de convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
