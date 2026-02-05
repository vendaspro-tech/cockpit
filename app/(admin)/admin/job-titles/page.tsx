import { listJobTitles, getJobTitleHierarchy } from "@/app/actions/admin/job-titles"
import { JobTitlesClient } from "./client"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export const metadata = {
  title: "Cargos | Admin",
  description: "Gerenciamento global de cargos e hierarquia organizacional"
}

export default async function AdminJobTitlesPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const [jobTitlesResult, hierarchyResult] = await Promise.all([
    listJobTitles(),
    getJobTitleHierarchy()
  ])

  if ('error' in jobTitlesResult) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center text-muted-foreground">
          Erro ao carregar cargos: {jobTitlesResult.error}
        </div>
      </div>
    )
  }

  if ('error' in hierarchyResult) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center text-muted-foreground">
          Erro ao carregar hierarquia: {hierarchyResult.error}
        </div>
      </div>
    )
  }

  const jobTitles = jobTitlesResult.data || []
  const hierarchy = 'data' in hierarchyResult && hierarchyResult.data || {}

  return (
    <JobTitlesClient
      initialJobTitles={jobTitles}
      hierarchy={hierarchy}
    />
  )
}
