import { getAllWorkspacePDIs } from "@/app/actions/pdi"
import { getUserAssessmentsForPDI } from "@/app/actions/pdi-approval"
import { createAdminClient } from "@/lib/supabase/admin"
import { CreatePDIButton } from "@/components/pdi/create-pdi-button"
import { PDIListView } from "@/components/pdi/pdi-list-view"
import { getAuthUser } from "@/lib/auth-server"

interface PDIPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function PDIPage({ params }: PDIPageProps) {
  const { workspaceId } = await params
  const authUser = await getAuthUser()
  const supabase = createAdminClient()

  if (!authUser) {
    return <div>Não autenticado</div>
  }

  // Get current user from database
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', authUser.id)
    .single()

  if (!user) {
    return <div>Usuário não encontrado no banco de dados</div>
  }

  // Fetch ALL PDIs for the workspace to allow filtering by user
  const pdis = await getAllWorkspacePDIs(workspaceId)
  const assessments = await getUserAssessmentsForPDI(user.id, workspaceId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos de Desenvolvimento (PDI)</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso e desenvolvimento da equipe.
          </p>
        </div>
        <CreatePDIButton 
          assessments={assessments} 
          workspaceId={workspaceId}
        />
      </div>

      <PDIListView 
        pdis={pdis} 
        workspaceId={workspaceId} 
        currentUserId={user.id} 
      />
    </div>
  )
}
