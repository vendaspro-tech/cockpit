import { listCompetencyFrameworks, getCompetencyFrameworkStats } from "@/app/actions/admin/competency-frameworks"
import { listJobTitles } from "@/app/actions/admin/job-titles"
import { CompetencyFrameworksClient } from "./client"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export const metadata = {
  title: "Frameworks de Competências | Admin",
  description: "Gerenciamento de frameworks de competências por cargo"
}

export default async function AdminCompetencyFrameworksPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  // List global templates (no workspace filter needed)
  const [frameworksResult, jobTitlesResult] = await Promise.all([
    listCompetencyFrameworks(), // Lists global templates by default
    listJobTitles()
  ])

  if ('error' in frameworksResult) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center text-muted-foreground">
          Erro ao carregar frameworks: {frameworksResult.error}
        </div>
      </div>
    )
  }

  const frameworks = frameworksResult.data || []
  const jobTitles = ('data' in jobTitlesResult && jobTitlesResult.data) || []

  return (
    <CompetencyFrameworksClient
      initialFrameworks={frameworks}
      jobTitles={jobTitles}
    />
  )
}
