import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, Calendar, User, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HistoryPageProps {
  params: Promise<{
    workspaceId: string
    testType: string
  }>
}

async function getAssessments(workspaceId: string, testType: string) {
  const supabase = createAdminClient()
  
  console.log('Fetching history for:', { workspaceId, testType })

  const { data: assessments, error } = await supabase
    .from('assessments')
    .select(`
      *,
      evaluator:users!evaluator_user_id(name, email),
      evaluated:users!evaluated_user_id(name, email)
    `)
    .eq('workspace_id', workspaceId)
    .eq('test_type', testType)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching history:', JSON.stringify(error, null, 2))
  }

  console.log('Found assessments:', assessments?.length)
  return assessments || []
}

async function getTestTitle(testType: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('test_structures')
    .select('structure')
    .eq('test_type', testType)
    .single()
    
  return (data?.structure as any)?.title || testType
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { workspaceId, testType } = await params
  const assessments = await getAssessments(workspaceId, testType)
  const title = await getTestTitle(testType)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${workspaceId}/assessments`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Avaliações</h1>
          <p className="text-gray-600">{title}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {assessments.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Clock className="w-12 h-12 mb-2 opacity-20" />
              <h3 className="text-lg font-medium">Nenhuma avaliação encontrada</h3>
              <p>Inicie uma nova avaliação para começar a registrar o histórico.</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={`/${workspaceId}/assessments/${testType}/new`}>
                  Iniciar Nova Avaliação
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card key={assessment.id} className="p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {(assessment.evaluated as any)?.name || 'Usuário'}
                    </span>
                    <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'} 
                      className={assessment.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                      {assessment.status === 'completed' ? 'Concluído' : 'Rascunho'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Avaliador: {(assessment.evaluator as any)?.name || 'Sistema'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(assessment.started_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/${workspaceId}/assessments/${testType}/${assessment.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
