'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getJobTitles } from "@/app/actions/teams"
import { updateMemberJobTitleAdmin, UserWorkspaceMembership } from "@/app/actions/admin/users"
import { Briefcase, Building2 } from "lucide-react"

interface EditMemberJobTitleDialogProps {
  membership: UserWorkspaceMembership
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export function EditMemberJobTitleDialog({ 
  membership, 
  userName,
  onClose, 
  onSuccess 
}: EditMemberJobTitleDialogProps) {
  const { toast } = useToast()
  const [jobTitles, setJobTitles] = useState<any[]>([])
  const [selectedJobTitleId, setSelectedJobTitleId] = useState<string>(membership.job_title_id || "none")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load job titles on mount
  useEffect(() => {
    const loadJobTitles = async () => {
      const titles = await getJobTitles("")
      setJobTitles(titles)
      setMounted(true)
    }
    loadJobTitles()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const result = await updateMemberJobTitleAdmin(
      membership.member_id, 
      selectedJobTitleId === 'none' ? null : selectedJobTitleId
    )
    setLoading(false)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error
      })
    } else {
      toast({
        title: "Cargo atualizado",
        description: "O cargo do membro foi atualizado com sucesso."
      })
      onSuccess()
      onClose()
    }
  }

  if (!mounted) return null

  const selectedTitle = jobTitles.find(jt => jt.id === selectedJobTitleId)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cargo</DialogTitle>
          <DialogDescription>
            Altere o cargo de {userName} no workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Workspace Info */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">{membership.workspace_name}</div>
              <div className="text-xs text-muted-foreground">
                Nível de acesso: <Badge variant="outline" className="ml-1">{membership.access_level}</Badge>
              </div>
            </div>
          </div>

          {/* Current Job Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cargo Atual</label>
            <div className="p-3 rounded-lg border">
              {membership.job_title_name ? (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{membership.job_title_name}</span>
                  {membership.hierarchy_level !== null && (
                    <Badge variant="secondary" className="ml-auto">
                      Nível {membership.hierarchy_level}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Nenhum cargo atribuído</span>
              )}
            </div>
          </div>

          {/* New Job Title Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Cargo</label>
            <Select value={selectedJobTitleId} onValueChange={setSelectedJobTitleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Remover cargo</SelectItem>
                {jobTitles.map((jt) => (
                  <SelectItem key={jt.id} value={jt.id}>
                    <div className="flex items-center gap-2">
                      <span>{jt.name}</span>
                      {jt.hierarchy_level !== null && (
                        <span className="text-xs text-muted-foreground">
                          (Nível {jt.hierarchy_level})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview selected */}
          {selectedTitle && selectedTitle.id !== membership.job_title_id && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Novo cargo:</strong> {selectedTitle.name}
                {selectedTitle.hierarchy_level !== null && ` (Nível ${selectedTitle.hierarchy_level})`}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || selectedJobTitleId === membership.job_title_id}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
