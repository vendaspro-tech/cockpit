'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth-server"
import { normalizeOpenRouterModel } from "@/lib/ai/openrouter"

const _AISettingsSchema = z.object({
  provider: z.string().default("openrouter"),
  model: z.string().default("openai/gpt-4o-mini"),
  thinkingMode: z.boolean().default(false),
  searchGrounding: z.boolean().default(false),
  apiKey: z.string().optional(),
})

export type AISettings = z.infer<typeof _AISettingsSchema>

export async function getSystemSettings() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("system_settings")
    .select("ai_config")
    .single()

  if (error) {
    // Silently return default settings if table doesn't exist or other error
    // console.warn("Error fetching system settings (using defaults):", error)
    return {
      provider: "openrouter",
      model: "openai/gpt-4o-mini",
      thinkingMode: false,
      searchGrounding: false
    } as AISettings
  }

  const config = (data.ai_config || {}) as AISettings
  if (config.provider === "openai") {
    return {
      ...config,
      provider: "openrouter",
      model: normalizeOpenRouterModel(config.model, "openai/gpt-4o-mini"),
    }
  }

  if (config.provider === "openrouter") {
    return {
      ...config,
      model: normalizeOpenRouterModel(config.model, "openai/gpt-4o-mini"),
    }
  }

  return config
}

export async function updateSystemAISettings(settings: AISettings) {
  const user = await getAuthUser()
  if (!user) return { error: "Não autorizado" }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: "Não autorizado" }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("system_settings")
    .update({ ai_config: settings, updated_at: new Date().toISOString() })
    .eq("id", true)

  if (error) {
    console.error("Error updating system settings:", error)
    return { error: "Erro ao atualizar configurações" }
  }

  revalidatePath("/admin/ai")
  return { success: true }
}
