"use client"

import { useState, useTransition } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateTrackingSettings, type TrackingSettings } from "@/app/actions/admin/tracking"

interface TrackingSettingsFormProps {
  initialSettings: TrackingSettings
}

export function TrackingSettingsForm({ initialSettings }: TrackingSettingsFormProps) {
  const [settings, setSettings] = useState<TrackingSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  const handleChange = (field: keyof TrackingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateTrackingSettings(settings)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Scripts salvos e serão aplicados globalmente")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>
            Bloco HEAD (GA4, tag do GTM, PostHog, Amplitude)
          </Label>
          <Textarea
            placeholder={`Cole aqui scripts que precisam ficar no <head>.\nEx.: GA4 gtag/js + init, tag do GTM, PostHog, Amplitude.`}
            value={settings.headSnippet || ""}
            onChange={(e) => handleChange("headSnippet", e.target.value)}
            className="min-h-[160px]"
          />
        </div>
        <div className="space-y-2">
          <Label>
            Início do BODY (noscript do GTM/Meta, iframes que precisam logo após &lt;body&gt;)
          </Label>
          <Textarea
            placeholder={`Cole aqui trechos que precisam ficar logo após <body>.\nEx.: <noscript><iframe ...></iframe></noscript> do GTM/Meta.`}
            value={settings.bodyStartSnippet || ""}
            onChange={(e) => handleChange("bodyStartSnippet", e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-2">
          <Label>
            Final do BODY (scripts menos críticos)
          </Label>
          <Textarea
            placeholder={`Cole aqui scripts menos críticos que podem ficar antes de </body>.`}
            value={settings.bodyEndSnippet || ""}
            onChange={(e) => handleChange("bodyEndSnippet", e.target.value)}
            className="min-h-[120px]"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar scripts"}
        </Button>
      </div>
    </div>
  )
}
