import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { listTestStructures, getTestStructureStats } from "@/app/actions/admin/test-structures"
import { TestStructuresClient } from "./client"

export const metadata = {
  title: "Estruturas de Teste | Admin",
  description: "Gerencie as estruturas de testes e avaliações do sistema"
}

// Disable caching for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TestStructuresPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect('/')
  }

  // Fetch test structures and stats
  const [structuresResult, statsResult] = await Promise.all([
    listTestStructures(),
    getTestStructureStats()
  ])

  if ('error' in structuresResult) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Erro ao carregar estruturas de teste</p>
          <p className="text-sm text-destructive">{structuresResult.error}</p>
        </div>
      </div>
    )
  }

  const testStructures = structuresResult.data || []
  const stats = 'error' in statsResult ? undefined : statsResult.data

  return (
    <TestStructuresClient
      initialTestStructures={testStructures}
      stats={stats}
    />
  )
}
