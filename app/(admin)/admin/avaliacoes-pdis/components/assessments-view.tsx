'use client'

import { useState, useEffect } from 'react'
import { AdminFilters } from './filters'
import { getAdminAssessments } from '../actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, FileText, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AssessmentHero } from '@/components/assessments/assessment-hero'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PDIPlanView } from '@/components/pdi/pdi-plan-view'

// Helper for initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const TEST_TYPE_LABELS: Record<string, string> = {
  'seniority_seller': 'Senioridade Vendedor',
  'seniority_leader': 'Senioridade Líder',
  'def_method': 'Matriz DEF',
  'leadership_style': 'Estilo de Liderança',
  'values_8d': 'Mapa de Valores',
  'disc': 'Perfil DISC'
}

const STATUS_LABELS: Record<string, { label: string, variant: 'default' | 'secondary' | 'outline' | 'destructive', className?: string }> = {
  'draft': { label: 'Rascunho', variant: 'secondary' },
  'pending_evaluation': { label: 'Aguardando', variant: 'outline' },
  'completed': { label: 'Concluído', variant: 'outline', className: 'bg-green-100 text-green-700 border-green-200' }
}

interface AssessmentsViewProps {
  initialData: any[]
  workspaces: { id: string; name: string }[]
}

export function AssessmentsView({ initialData, workspaces }: AssessmentsViewProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleFilterChange = async (filters: any) => {
    setLoading(true)
    try {
      const result = await getAdminAssessments(filters)
      setData(result)
    } catch (error) {
      console.error('Failed to fetch assessments', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (assessment: any) => {
    setSelectedAssessment(assessment)
    setIsDrawerOpen(true)
  }

  return (
    <div>
      <AdminFilters 
        workspaces={workspaces} 
        onFilterChange={handleFilterChange} 
        type="assessments" 
      />

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Teste</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>PDI</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhuma avaliação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((assessment) => (
                <TableRow key={assessment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(assessment)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                          {assessment.evaluated_user?.full_name 
                            ? getInitials(assessment.evaluated_user.full_name) 
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {assessment.evaluated_user?.full_name || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assessment.evaluated_user?.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{assessment.workspace?.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{assessment.workspace?.plan}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {TEST_TYPE_LABELS[assessment.test_type] || assessment.test_type}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={STATUS_LABELS[assessment.status]?.variant || 'default'}
                      className={STATUS_LABELS[assessment.status]?.className}
                    >
                      {STATUS_LABELS[assessment.status]?.label || assessment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assessment.pdi ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <FileText className="w-3 h-3 mr-1" />
                        Sim
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {assessment.started_at
                      ? format(new Date(assessment.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(assessment); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-4xl w-[90vw] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Detalhes da Avaliação</SheetTitle>
          </SheetHeader>
          
          {selectedAssessment && (
            <Tabs defaultValue="assessment" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="assessment">Relatório da Avaliação</TabsTrigger>
                <TabsTrigger value="pdi" disabled={!selectedAssessment.pdi}>
                  PDI Vinculado
                  {selectedAssessment.pdi && <FileText className="w-3 h-3 ml-2" />}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="assessment" className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-lg">
                        {selectedAssessment.evaluated_user?.full_name 
                          ? getInitials(selectedAssessment.evaluated_user.full_name) 
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedAssessment.evaluated_user?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedAssessment.evaluated_user?.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{selectedAssessment.workspace?.name}</Badge>
                        <Badge variant="outline">{TEST_TYPE_LABELS[selectedAssessment.test_type]}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* We can reuse AssessmentHero or create a simplified view */}
                  {/* Since AssessmentHero might expect specific props, we might need to fetch full details or just show basic info for now */}
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="text-center text-muted-foreground py-8">
                      Visualização detalhada do relatório em desenvolvimento.
                      <br />
                      ID: {selectedAssessment.id}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pdi" className="mt-0">
                {selectedAssessment.pdi ? (
                  <div className="space-y-4">
                     {/* We would need to fetch the full PDI data here or pass it if available */}
                     {/* For now, placeholder */}
                     <div className="p-4 border rounded-lg bg-card">
                      <p className="text-center text-muted-foreground py-8">
                        Visualização do PDI {selectedAssessment.pdi.id}
                      </p>
                     </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum PDI vinculado a esta avaliação.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
