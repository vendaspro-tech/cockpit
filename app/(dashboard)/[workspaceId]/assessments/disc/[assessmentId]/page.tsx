import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import { DiscQuestionnaire } from "@/components/assessments/disc-questionnaire"
import { DiscResults } from "@/components/assessments/disc-results"
import { Button } from "@/components/ui/button"
import { resetAssessment, recoverAssessmentResults } from "@/app/actions/assessments"
import { getAuthUser } from "@/lib/auth-server"



interface DiscAssessmentPageProps {
  params: Promise<{
    workspaceId: string
    assessmentId: string
  }>
}

export default async function DiscAssessmentPage({ params }: DiscAssessmentPageProps) {
  const { workspaceId, assessmentId } = await params
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = createAdminClient()

  // Fetch assessment details
  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single()

  if (error || !assessment) {
    console.error("Error fetching assessment:", error)
    notFound()
  }

  // Verify ownership (optional, RLS handles it but good for UX redirect/error)
  // In this case, we just proceed.

  if (assessment.status === "completed") {
    // Fetch results
    const { data: results, error: resultsError } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("assessment_id", assessmentId)
      .single()

    if (resultsError || !results) {
      // Only log unexpected errors (PGRST116 is "no rows returned", which is expected here)
      if (resultsError && resultsError.code !== 'PGRST116') {
        console.error("Error fetching results:", resultsError)
      }
      
      // Check if we have responses to recover from
      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('question_id')
        .eq('assessment_id', assessmentId)
        .limit(1)
      
      const hasRecoverableData = responses && responses.length > 0 && responses[0].question_id.includes('_')

      return (
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
          <div className="text-center space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-destructive">Erro ao carregar resultados</h2>
            <p className="text-muted-foreground">
              {hasRecoverableData 
                ? "Encontramos suas respostas salvas, mas os resultados finais não foram gerados." 
                : "Não foi possível encontrar os resultados desta avaliação."}
            </p>
          </div>
          
          <div className="flex gap-4">
            {hasRecoverableData && (
              <form action={async () => {
                'use server'
                await recoverAssessmentResults(workspaceId, assessmentId)
              }}>
                <Button type="submit" variant="default">
                  Recuperar Resultados
                </Button>
              </form>
            )}
            
            <form action={async () => {
              'use server'
              await resetAssessment(workspaceId, assessmentId)
            }}>
              <Button type="submit" variant="outline">
                Refazer Avaliação
              </Button>
            </form>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto py-8">
        <DiscResults 
          scores={results.scores} 
          profile={results.classification.profile} 
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <DiscQuestionnaire 
        assessmentId={assessmentId} 
        workspaceId={workspaceId} 
      />
    </div>
  )
}
