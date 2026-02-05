'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { generatePDI } from "@/app/actions/pdi"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Assessment {
  id: string
  test_type: string
  started_at: string
  completed_at: string | null
  pdi_id: string | null
  evaluated_user: { full_name: string | null; email: string } | null
  evaluator_user: { full_name: string } | null
}

interface CreatePDIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessments: Assessment[]
  workspaceId: string
}

const TEST_TYPE_LABELS: Record<string, string> = {
  seniority_seller: 'Senioridade Vendedor',
  seniority_leader: 'Senioridade Líder',
  def_method: 'Matriz DEF',
  values_8d: 'Mapa de Valores',
  leadership_style: 'Estilo de Liderança'
}

export function CreatePDIDialog({ open, onOpenChange, assessments, workspaceId }: CreatePDIDialogProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const availableAssessments = assessments.filter(a => !a.pdi_id)

  // Debug
  console.log('=== DEBUG CREATE PDI DIALOG ===')
  console.log('Total assessments received:', assessments.length)
  console.log('Available assessments (no PDI):', availableAssessments.length)
  console.log('Available assessments data:', availableAssessments)
  console.log('===============================')

  async function handleCreate() {
    if (!selectedAssessment) return

    setIsCreating(true)
    const result = await generatePDI(selectedAssessment, workspaceId)

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "PDI criado!",
        description: `${result.itemsCreated} itens de desenvolvimento criados. Aguardando aprovação do gestor.`
      })
      onOpenChange(false)
      router.refresh()
    }
    setIsCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo PDI</DialogTitle>
          <DialogDescription>
            Selecione uma avaliação completa para gerar seu Plano de Desenvolvimento Individual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableAssessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma avaliação disponível para criar PDI.</p>
              <p className="text-sm mt-1">Complete uma avaliação primeiro ou todas já possuem PDI.</p>
            </div>
          ) : (
            <>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma avaliação" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">
                          {assessment.evaluated_user?.full_name || assessment.evaluated_user?.email}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span>{TEST_TYPE_LABELS[assessment.test_type] || assessment.test_type}</span>
                        <span className="text-xs text-muted-foreground">
                          ({format(new Date(assessment.completed_at || assessment.started_at), 'dd/MM/yyyy', { locale: ptBR })})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAssessment && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-blue-900 mb-1">Como funciona?</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• O PDI será criado baseado nas competências com menor avaliação</li>
                        <li>• Ações de desenvolvimento serão sugeridas automaticamente</li>
                        <li>• Você poderá adicionar ações personalizadas a qualquer momento</li>
                        <li>• Após criar, poderá executar e marcar progresso</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedAssessment || isCreating}
          >
            {isCreating ? 'Criando...' : 'Criar PDI'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
