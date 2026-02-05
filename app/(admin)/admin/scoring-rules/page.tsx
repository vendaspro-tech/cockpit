import { getTestStructures } from "@/app/actions/admin/scoring-rules"
import { ScoringRulesEditor } from "@/components/admin/scoring-rules-editor"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminScoringRulesPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const structures = await getTestStructures()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuração de Avaliações</h1>
        <p className="text-muted-foreground">
          Gerencie a estrutura, pesos por pergunta e regras de cálculo das avaliações.
        </p>
      </div>

      <ScoringRulesEditor structures={structures} />
    </div>
  )
}
