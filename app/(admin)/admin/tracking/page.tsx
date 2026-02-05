import { getTrackingSettings } from "@/app/actions/admin/tracking"
import { TrackingSettingsForm } from "@/components/admin/tracking-settings-form"

export const dynamic = "force-dynamic"

export default async function AdminTrackingPage() {
  const settings = await getTrackingSettings()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tracking</h1>
        <p className="text-muted-foreground">
          Cole aqui os scripts (GTM, Posthog, Amplitude, Pixels) que devem rodar em todos os workspaces.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <TrackingSettingsForm initialSettings={settings} />
      </div>
    </div>
  )
}
