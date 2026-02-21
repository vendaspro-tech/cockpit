import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { processPendingKbSources } from "@/lib/ai/kb/ingestion"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isSystemOwner } from "@/lib/auth-utils"

export const runtime = "nodejs"

const ReindexSchema = z.object({
  sourceId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createClient()
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const owner = await isSystemOwner(authData.user.id)
    if (!owner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = ReindexSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY ausente no servidor" }, { status: 500 })
    }

    const admin = createAdminClient()
    const { data: source, error: sourceError } = await admin
      .from("ai_agent_kb_sources")
      .select("id")
      .eq("id", parsed.data.sourceId)
      .maybeSingle()
    if (sourceError || !source) {
      return NextResponse.json({ error: "Fonte não encontrada" }, { status: 404 })
    }

    const { error: chunkDeleteError } = await admin
      .from("ai_agent_kb_chunks")
      .delete()
      .eq("source_id", parsed.data.sourceId)
    if (chunkDeleteError) {
      console.error("KB reindex chunk cleanup error:", chunkDeleteError)
    }

    const { error: markError } = await admin
      .from("ai_agent_kb_sources")
      .update({
        status: "pending",
        error_message: null,
        metadata: {
          reindex_requested_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.sourceId)
    if (markError) {
      return NextResponse.json({ error: "Falha ao agendar reindexação" }, { status: 500 })
    }

    const result = await processPendingKbSources({ sourceId: parsed.data.sourceId, limit: 1 }, openaiKey)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("KB reindex error:", error)
    return NextResponse.json({ error: "Falha ao reindexar fonte" }, { status: 500 })
  }
}
