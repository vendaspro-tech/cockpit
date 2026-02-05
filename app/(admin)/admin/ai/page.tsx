import { getSystemSettings } from "@/app/actions/admin/settings"
import { AISettingsForm } from "@/components/admin/ai-settings-form"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminAISettingsPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  const settings = await getSystemSettings()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações de IA</h1>
          <p className="text-muted-foreground">
            Gerencie o provedor de inteligência artificial e suas configurações globais.
          </p>
        </div>
      </div>

      <AISettingsForm initialSettings={settings || undefined} />
    </div>
  )
}
