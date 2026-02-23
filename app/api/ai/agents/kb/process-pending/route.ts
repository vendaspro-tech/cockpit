import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { processPendingKbSources } from "@/lib/ai/kb/ingestion"
import { createClient } from "@/lib/supabase/server"
import { isSystemOwner } from "@/lib/auth-utils"

export const runtime = "nodejs"

const ProcessSchema = z.object({
  agentId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(20).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const owner = await isSystemOwner(authData.user.id)
    if (!owner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = ProcessSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY ausente no servidor" }, { status: 500 })
    }

    const result = await processPendingKbSources(parsed.data, openaiKey)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("KB process-pending error:", error)
    return NextResponse.json({ error: "Falha ao processar pendências" }, { status: 500 })
  }
}
