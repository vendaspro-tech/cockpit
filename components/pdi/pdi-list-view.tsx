'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Calendar, Target, Clock, CheckCircle2, Search, Filter, User, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PDIListViewProps {
  pdis: any[]
  workspaceId: string
  currentUserId: string
}

export function PDIListView({ pdis, workspaceId, currentUserId }: PDIListViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [assessmentFilter, setAssessmentFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Get unique users for filter
  const users = Array.from(new Set(pdis.map(pdi => JSON.stringify({
    id: pdi.user?.id,
    name: pdi.user?.full_name || pdi.user?.email || 'Usuário Desconhecido'
  })))).map(u => JSON.parse(u))

  // Get unique assessment types for filter
  const assessmentTypes = Array.from(new Set(pdis.map(pdi => pdi.assessment?.test_type))).filter(Boolean)

  const typeMap: Record<string, string> = {
    'def_method': 'Matriz DEF',
    'closer_seniority': 'Senioridade de Closer', // Legacy? Keeping just in case
    'seniority_seller': 'Senioridade de Vendedor',
    'seniority_leader': 'Senioridade Líder Comercial',
    'leadership_style': 'Estilo de Liderança',
    'values_8d': 'Valores'
  }

  const filteredPDIs = pdis.filter(pdi => {
    // Status Filter
    if (statusFilter !== 'all' && pdi.status !== statusFilter) return false
    
    // User Filter
    if (userFilter !== 'all' && pdi.user?.id !== userFilter) return false

    // Assessment Type Filter
    if (assessmentFilter !== 'all' && pdi.assessment?.test_type !== assessmentFilter) return false
    
    // Search Term (User name)
    if (searchTerm) {
      const userName = pdi.user?.full_name || pdi.user?.email || ''
      if (!userName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    }

    return true
  })

  const statusConfig = {
    draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground border-border' },
    active: { label: 'Em Andamento', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    completed: { label: 'Concluído', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    archived: { label: 'Arquivado', color: 'bg-muted text-muted-foreground border-border' }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
            <SelectTrigger className="w-auto min-w-[160px]">
              <Target className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tipo de Avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Avaliações</SelectItem>
              {assessmentTypes.map((type: any) => (
                <SelectItem key={type} value={type}>
                  {typeMap[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-auto min-w-[160px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-auto min-w-[180px]">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Colaboradores</SelectItem>
              {users.map((user: any) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filteredPDIs.length > 0 ? (
          filteredPDIs.map((pdi) => {
            const itemsCount = pdi.items?.length || 0
            
            // Calculate progress (only items with score < 3)
            const itemsToImprove = pdi.items?.filter((item: any) => {
              const selfScore = item.current_score_self
              const managerScore = item.current_score_manager
              const selfLow = selfScore !== null && selfScore < 3
              const managerLow = managerScore !== null && managerScore < 3
              return selfLow || managerLow
            }) || []
            
            const totalItems = itemsToImprove.length
            const completedItems = itemsToImprove.filter((item: any) => item.status === 'completed').length
            const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
            
            const isApproved = !!pdi.approved_by
            const assessmentType = pdi.assessment?.test_type
            const assessmentLabel = typeMap[assessmentType] || assessmentType || 'Geral'

            return (
              <Link key={pdi.id} href={`/${workspaceId}/pdi/${pdi.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-base truncate mr-2">
                            {pdi.user?.full_name || pdi.user?.email || 'Colaborador'}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Avaliação:</span>
                            <Badge variant="secondary" className="h-5 px-2 font-normal bg-muted text-muted-foreground hover:bg-muted/80 border border-border">
                              {assessmentLabel}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline" className={cn("h-5 px-2 font-medium", statusConfig[pdi.status as keyof typeof statusConfig].color)}>
                              {statusConfig[pdi.status as keyof typeof statusConfig].label}
                            </Badge>
                          </div>

                          {isApproved && (
                            <Badge variant="outline" className="h-5 px-2 bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Aprovado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Criado em {format(new Date(pdi.created_at), "dd/MM/yy", { locale: ptBR })}
                          </span>
                          {pdi.target_completion_date && (
                            <span className="flex items-center gap-1 font-medium text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                              <Target className="w-3 h-3" />
                              Prazo: {format(new Date(pdi.target_completion_date), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Progress */}
                      <div className="w-full md:w-48 shrink-0">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">
                          {completedItems}/{totalItems} itens
                        </p>
                      </div>

                      {/* Right: Arrow */}
                      <div className="shrink-0 text-muted-foreground">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        ) : (
          <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum PDI encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
