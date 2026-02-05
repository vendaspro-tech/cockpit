import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, TrendingUp, Award } from 'lucide-react'
import { CreateSeniorityDialog } from '@/components/assessments/seniority/create-seniority-dialog'
import { listSeniorityAssessments } from '@/app/actions/seniority-assessments'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ workspaceId: string }>
}

async function SeniorityDashboardContent({ workspaceId }: { workspaceId: string }) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get internal user
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('supabase_user_id', user.id)
    .single()

  if (!dbUser) {
    redirect('/login')
  }

  // Get workspace member info with job title
  const { data: workspaceMember } = await supabase
    .from('workspace_members')
    .select(`
      *,
      job_title:job_titles(id, name, hierarchy_level)
    `)
    .eq('user_id', dbUser.id)
    .eq('workspace_id', workspaceId)
    .single()

  // Get all workspace users (for leader evaluations)
  const { data: workspaceUsers } = await supabase
    .from('workspace_members')
    .select(`
      user:users(id, full_name, email),
      job_title:job_titles(id, name, hierarchy_level)
    `)
    .eq('workspace_id', workspaceId)

  const formattedUsers = workspaceUsers?.map((wm: any) => ({
    id: wm.user.id,
    full_name: wm.user.full_name,
    email: wm.user.email,
    job_title: wm.job_title,
  })) || []

  // Get competency frameworks (published global templates only - FR-003, T034)
  const { data: frameworks } = await supabase
    .from('competency_frameworks')
    .select('*')
    .is('workspace_id', null)
    .eq('is_active', true)
    .eq('is_template', true)
    .order('name')

  // Get assessments
  const assessmentsResult = await listSeniorityAssessments(workspaceId)
  const assessments = assessmentsResult.success ? assessmentsResult.data : []

  // Calculate stats
  const myAssessments = assessments.filter((a: any) => a.evaluated_user_id === dbUser.id)
  const pendingCalibrations = assessments.filter((a: any) => a.status === 'submitted')
  const completedAssessments = assessments.filter((a: any) => a.status === 'calibrated')

  const currentUser = {
    id: dbUser.id,
    full_name: dbUser.full_name,
    email: dbUser.email,
    job_title: workspaceMember?.job_title || undefined,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Avaliações de Senioridade</h1>
          <p className="text-muted-foreground">
            Sistema de avaliação baseado em matriz de competências
          </p>
        </div>
        <CreateSeniorityDialog
          workspaceId={workspaceId}
          currentUser={currentUser}
          workspaceUsers={formattedUsers}
          competencyFrameworks={frameworks || []}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minhas Avaliações
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myAssessments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de avaliações realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes de Calibração
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCalibrations.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando revisão do líder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calibradas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssessments.length}</div>
            <p className="text-xs text-muted-foreground">
              Avaliações finalizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
          <CardDescription>
            Todas as avaliações de senioridade do workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira avaliação de senioridade
              </p>
              <CreateSeniorityDialog
                workspaceId={workspaceId}
                currentUser={currentUser}
                workspaceUsers={formattedUsers}
                competencyFrameworks={frameworks || []}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Avaliação
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment: any) => (
                <Link
                  key={assessment.id}
                  href={`/${workspaceId}/assessments/seniority-v2/${assessment.id}`}
                  className="block"
                >
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {assessment.evaluated_user?.full_name || assessment.evaluated_user?.email}
                            </p>
                            <Badge variant="outline">
                              {assessment.assessment_type === 'self' ? 'Auto-avaliação' : 'Avaliação do Líder'}
                            </Badge>
                            <Badge variant={
                              assessment.status === 'draft' ? 'secondary' :
                              assessment.status === 'submitted' ? 'default' :
                              'default'
                            }>
                              {assessment.status === 'draft' ? 'Rascunho' :
                               assessment.status === 'submitted' ? 'Submetida' :
                               'Calibrada'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {assessment.assessment_period}
                          </p>
                          {assessment.evaluator_user && (
                            <p className="text-xs text-muted-foreground">
                              Avaliador: {assessment.evaluator_user.full_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {assessment.global_level && (
                            <Badge className="mb-1">
                              {assessment.global_level === 'junior' ? 'Júnior' :
                               assessment.global_level === 'pleno' ? 'Pleno' :
                               'Sênior'}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(assessment.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function SeniorityDashboardPage({ params }: PageProps) {
  const { workspaceId } = await params

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SeniorityDashboardContent workspaceId={workspaceId} />
    </Suspense>
  )
}
