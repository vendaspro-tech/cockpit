'use server'

import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

const TrackingSettingsSchema = z.object({
  headSnippet: z.string().optional(),       // scripts que precisam ficar no <head> (ex.: GA4, GTM tag, Posthog, Amplitude)
  bodyStartSnippet: z.string().optional(),  // logo após a abertura do <body> (ex.: noscript GTM/Meta)
  bodyEndSnippet: z.string().optional(),    // antes de </body> (scripts menos críticos)
})

export type TrackingSettings = z.infer<typeof TrackingSettingsSchema>

export async function getTrackingSettings(): Promise<TrackingSettings> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("system_settings")
    .select("tracking_config")
    .single()

  const config = (data?.tracking_config as TrackingSettings) || {}
  return {
    headSnippet: config.headSnippet || "",
    bodyStartSnippet: config.bodyStartSnippet || "",
    bodyEndSnippet: config.bodyEndSnippet || ""
  }
}

export async function updateTrackingSettings(input: TrackingSettings) {
  const user = await getAuthUser()
  if (!user) return { error: "Não autorizado" }

  const owner = await isSystemOwner(user.id)
  if (!owner) return { error: "Não autorizado" }

  const parsed = TrackingSettingsSchema.parse(input)

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("system_settings")
    .update({
      tracking_config: parsed,
      updated_at: new Date().toISOString()
    })
    .eq("id", true)

  if (error) {
    console.error("Erro ao salvar tracking_config:", error)
    return { error: "Erro ao salvar scripts" }
  }

  revalidatePath("/admin/tracking")
  // also revalidate layouts consuming scripts
  revalidatePath("/")
  return { success: true }
}
