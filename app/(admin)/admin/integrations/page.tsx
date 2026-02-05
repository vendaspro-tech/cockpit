import { getSystemSettings } from "@/app/actions/admin/settings"
import { AISettingsForm } from "@/components/admin/ai-settings-form"
import { APISettings } from "@/components/admin/api-settings"
import { WebhooksSettings } from "@/components/admin/webhooks-settings"
import { isSystemOwner } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthUser } from "@/lib/auth-server"

export default async function AdminIntegrationsPage() {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Gerencie as integrações do sistema, chaves de API e webhooks.
        </p>
      </div>

      <Tabs defaultValue="llms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="llms">Chaves de LLMs</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="llms" className="space-y-4">
          <AISettingsForm initialSettings={settings || undefined} />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <APISettings />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhooksSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
