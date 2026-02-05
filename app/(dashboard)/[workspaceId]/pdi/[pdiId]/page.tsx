import { getPDIPlan } from "@/app/actions/pdi" 
import { PDIPlanView } from "@/components/pdi/pdi-plan-view"
import { ApprovePDIButton } from "@/components/pdi/approve-pdi-button"
import { DeletePDIButton } from "@/components/pdi/delete-pdi-button"
import { PDIPlanDates } from "@/components/pdi/pdi-plan-dates"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PDIDetailPageProps {
  params: Promise<{
    workspaceId: string
    pdiId: string
  }>
}

export default async function PDIDetailPage({ params }: PDIDetailPageProps) {
  const { workspaceId, pdiId } = await params
  
  const pdi = await getPDIPlan(pdiId)

  if (!pdi) {
    notFound()
  }

  const isApproved = !!pdi.approved_by
  
  // Status configs
  const statusConfig = {
    draft: { label: '📝 Rascunho', color: 'bg-muted text-muted-foreground border-border' },
    active: { label: '🔄 Em Andamento', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    completed: { label: '✅ Concluído', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    archived: { label: '📦 Arquivado', color: 'bg-muted text-muted-foreground border-border' }
  }

  const approvalConfig = isApproved 
    ? { label: '✅ Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20' }
    : { label: '⏳ Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-b from-muted/30 to-background">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Link href={`/${workspaceId}/pdi`} className="hover:text-primary transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para PDIs
                  </Link>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="uppercase tracking-wider font-semibold text-[10px] text-muted-foreground/70">
                    Plano de Desenvolvimento Individual
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  Plano de {pdi.user?.full_name?.split(' ')[0] || pdi.user?.email || 'Colaborador'}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="font-medium bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 px-3 py-1">
                    <span className="text-muted-foreground mr-1.5 font-normal">Avaliação:</span>
                    {(() => {
                      const type = (pdi as any).assessment?.test_type
                      const typeMap: Record<string, string> = {
                        'def_method': 'Matriz DEF',
                        'closer_seniority': 'Senioridade de Closer',
                        'seniority_seller': 'Senioridade de Vendedor',
                        'seniority_leader': 'Senioridade Líder Comercial',
                        'leadership_style': 'Estilo de Liderança',
                        'values_8d': 'Valores'
                      }
                      return typeMap[type] || type || 'Geral'
                    })()}
                  </Badge>
                  <Badge variant="outline" className={`${statusConfig[pdi.status as keyof typeof statusConfig].color} px-3 py-1`}>
                    <span className="text-muted-foreground mr-1.5 font-normal">Status:</span>
                    {statusConfig[pdi.status as keyof typeof statusConfig].label.split(' ').slice(1).join(' ')}
                  </Badge>
                  <Badge variant="outline" className={`${approvalConfig.color} px-3 py-1`}>
                    <span className="text-muted-foreground mr-1.5 font-normal">Aprovação:</span>
                    {approvalConfig.label.split(' ').slice(1).join(' ')}
                  </Badge>
                </div>
              </div>

              <PDIPlanDates 
                pdiId={pdi.id}
                startDate={pdi.start_date}
                targetCompletionDate={pdi.target_completion_date}
                createdAt={pdi.created_at}
                approvedAt={pdi.approved_at}
              />
            </div>


            <div className="flex flex-col gap-4 min-w-[300px]">
              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <DeletePDIButton pdiId={pdi.id} workspaceId={workspaceId} />
                <ApprovePDIButton pdiId={pdi.id} isApproved={isApproved} />
              </div>

              {/* Progress Card */}
              {pdi.items && pdi.items.length > 0 && (() => {
                // Filter items that have score < 3 (need improvement)
                // Only count valid scores. If a score is null, it shouldn't trigger "needs improvement" by default (treated as 0 previously)
                const itemsToImprove = pdi.items.filter((item: any) => {
                  const selfScore = item.current_score_self
                  const managerScore = item.current_score_manager
                  
                  // Check if either score exists AND is less than 3
                  const selfLow = selfScore !== null && selfScore < 3
                  const managerLow = managerScore !== null && managerScore < 3
                  
                  return selfLow || managerLow
                })
                const totalItems = itemsToImprove.length
                
                if (totalItems === 0) return null

                const completedItems = itemsToImprove.filter((item: any) => item.status === 'completed').length
                const progressPercentage = Math.round((completedItems / totalItems) * 100)
                
                return (
                  <div className="bg-card p-5 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Progresso Geral</span>
                      <span className="text-2xl font-bold text-primary">
                        {progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-right">
                      <strong className="text-foreground">{completedItems}</strong> de {totalItems} itens concluídos
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* PDI Content */}
      <PDIPlanView pdi={pdi} />
    </div>
  )
}
