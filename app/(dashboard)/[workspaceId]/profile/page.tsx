import { getUserRole } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Briefcase, Award, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

interface ProfilePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

type WorkspaceMemberProfile = {
  id: string
  job_title: {
    id: string
    name: string
    slug: string | null
    hierarchy_level: number | null
    mission: string | null
    sector: string | null
    allows_seniority: boolean | null
  } | null
  current_seniority_level: number | null
  seniority_last_calibrated_at: string | null
  seniority_last_assessment_id: string | null
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { workspaceId } = await params
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    return <div>Não autorizado</div>
  }

  const role = await getUserRole(user.id, workspaceId)

  const { data: internalUser } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_user_id", user.id)
    .maybeSingle()

  let membership: WorkspaceMemberProfile | null = null

  if (internalUser?.id) {
    const { data: memberData } = await supabase
      .from("workspace_members")
      .select(`
        id,
        job_title:job_title_id (
          id,
          name,
          slug,
          hierarchy_level,
          mission,
          sector,
          allows_seniority
        ),
        current_seniority_level,
        seniority_last_calibrated_at,
        seniority_last_assessment_id
      `)
      .eq("workspace_id", workspaceId)
      .eq("user_id", internalUser.id)
      .maybeSingle()

    if (memberData) {
      const normalizedJobTitle = (Array.isArray(memberData.job_title)
        ? memberData.job_title[0]
        : memberData.job_title) as WorkspaceMemberProfile["job_title"]

      membership = {
        id: memberData.id,
        job_title: normalizedJobTitle ?? null,
        current_seniority_level: memberData.current_seniority_level,
        seniority_last_calibrated_at: memberData.seniority_last_calibrated_at,
        seniority_last_assessment_id: memberData.seniority_last_assessment_id,
      }
    }
  }

  const jobTitle = membership?.job_title ?? null

  const formatDate = (value?: string | null) =>
    value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : null

  const seniorityLevelLabels: Record<number, string> = {
    0: "Nível 0 • Estratégico",
    1: "Nível 1 • Tático",
    2: "Nível 2 • Operacional",
    3: "Nível 3 • Execução",
  }

  const hasCalibratedSeniority = typeof membership?.current_seniority_level === "number"
  const resolvedSeniorityLevel = hasCalibratedSeniority ? (membership?.current_seniority_level as number) : null
  const seniorityStatusLabel = typeof resolvedSeniorityLevel === "number"
    ? seniorityLevelLabels[resolvedSeniorityLevel] || "Nível definido"
    : "Aguardando Avaliação"
  const lastCalibration = formatDate(membership?.seniority_last_calibrated_at)

  const roleLabels: Record<string, string> = {
    'system_owner': 'Proprietário do Sistema',
    'owner': 'Proprietário',
    'admin': 'Administrador',
    'member': 'Membro'
  }

  const hierarchyLabels: Record<number, string> = {
    0: 'Estratégico (C-Level)',
    1: 'Tático (Coordenação)',
    2: 'Operacional (Supervisão)',
    3: 'Execução (Vendas)'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Seus dados de identificação no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.user_metadata?.full_name || user.email || ''} />
                <AvatarFallback className="text-lg">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{user.user_metadata?.full_name || user.email}</h3>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissões no Workspace
            </CardTitle>
            <CardDescription>
              Seu nível de acesso neste workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Cargo Atual</p>
                <p className="text-xs text-muted-foreground">
                  Define o que você pode ver e editar.
                </p>
              </div>
              <Badge variant={role === 'system_owner' || role === 'owner' ? 'default' : 'secondary'}>
                {roleLabels[role || 'member'] || role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Senioridade v2
          </CardTitle>
          <CardDescription>
            Status derivado das avaliações 360° com calibração.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {membership ? (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {hasCalibratedSeniority
                      ? "Última calibração concluída para este workspace."
                      : "Seu nível será definido após a primeira calibração completa."}
                  </p>
                </div>
                <Badge variant={hasCalibratedSeniority ? "default" : "outline"}>
                  {seniorityStatusLabel}
                </Badge>
              </div>

              {hasCalibratedSeniority ? (
                <div className="text-sm text-muted-foreground">
                  {lastCalibration
                    ? `Calibrado em ${lastCalibration}.`
                    : "Calibração registrada. Data não disponível."}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Conclua a autoavaliação e aguarde a calibração do seu líder para definir sua senioridade.
                </div>
              )}

              <div className="pt-2">
                <Link href={`/${workspaceId}/assessments/seniority-v2`}>
                  <Button variant="outline" size="sm">
                    {hasCalibratedSeniority ? "Ver avaliações de senioridade" : "Iniciar avaliação de senioridade"}
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Não encontramos seu vínculo com este workspace. Solicite suporte ao administrador.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Title Card */}
      {jobTitle ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Cargo e Posição
            </CardTitle>
            <CardDescription>
              Seu cargo atual na organização e detalhes da posição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-2xl font-bold">{jobTitle?.name || 'Cargo não definido'}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {hierarchyLabels[jobTitle?.hierarchy_level ?? -1] || 'Nível não definido'}
                    </Badge>
                    {jobTitle?.allows_seniority && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Permite Avaliação de Senioridade
                      </Badge>
                    )}
                  </div>
                </div>

                {jobTitle?.mission && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Missão do Cargo</p>
                    <p className="text-sm">{jobTitle.mission}</p>
                  </div>
                )}

                {jobTitle?.sector && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Setor:</span>
                    <Badge variant="outline">{jobTitle.sector}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href={`/${workspaceId}/job-titles`}>
                <Button variant="outline" size="sm">
                  Ver Todos os Cargos Disponíveis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Cargo e Posição
            </CardTitle>
            <CardDescription>
              Seu cargo atual na organização e detalhes da posição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não tem um cargo definido no sistema.
              </p>
              <Link href={`/${workspaceId}/job-titles`}>
                <Button variant="outline">
                  Ver Cargos Disponíveis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
