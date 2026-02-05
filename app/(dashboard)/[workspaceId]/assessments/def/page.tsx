import { createAdminClient } from "@/lib/supabase/admin"
import { DefAssessmentsClient } from "./def-assessments-client"

interface PageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function DefAssessmentsPage({ params }: PageProps) {
  const { workspaceId } = await params
  const supabase = createAdminClient()

  const { data: assessments, error } = await supabase
    .from("assessments")
    .select(`
      *,
      evaluated_user:users!evaluated_user_id(full_name, email),
      evaluator_user:users!evaluator_user_id(full_name, email),
      product:products(name)
    `)
    .eq("workspace_id", workspaceId)
    .eq("test_type", "def_method")
    .order("started_at", { ascending: false })

  if (error) {
    console.error("Error fetching DEF assessments:", JSON.stringify(error, null, 2))
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .order("name")

  return (
    <DefAssessmentsClient
      initialData={assessments || []}
      workspaceId={workspaceId}
      products={products || []}
    />
  )
}
