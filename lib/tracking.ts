import { createAdminClient } from "@/lib/supabase/admin"

export async function fetchTrackingSettings() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("system_settings")
    .select("tracking_config")
    .single()

  if (error) {
    // Table or column might not exist yet; fail safe with empty config
    return { headSnippet: undefined, bodyStartSnippet: undefined, bodyEndSnippet: undefined }
  }

  const cfg = (data?.tracking_config as any) || {}
  return {
    headSnippet: cfg.headSnippet as string | undefined,
    bodyStartSnippet: cfg.bodyStartSnippet as string | undefined,
    bodyEndSnippet: cfg.bodyEndSnippet as string | undefined,
  }
}
