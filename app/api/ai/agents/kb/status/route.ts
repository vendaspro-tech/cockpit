import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"

export const runtime = "nodejs"

const QuerySchema = z.object({
  agentId: z.string().uuid(),
})

type SourceRow = {
  id: string
  title: string
  type: string
  filename: string | null
  mime_type: string | null
  size_bytes: number | null
  storage_path: string | null
  status: "pending" | "processing" | "ready" | "failed"
  error_message: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
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

    const parsed = QuerySchema.safeParse({
      agentId: request.nextUrl.searchParams.get("agentId"),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: sources, error } = await supabase
      .from("ai_agent_kb_sources")
      .select("*")
      .eq("agent_id", parsed.data.agentId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Falha ao listar fontes" }, { status: 500 })
    }

    const sourceRows = (sources ?? []) as SourceRow[]
    const sourceIds = sourceRows.map((source) => source.id)

    let chunkCounts = new Map<string, number>()
    if (sourceIds.length > 0) {
      const { data: chunks, error: chunkError } = await supabase
        .from("ai_agent_kb_chunks")
        .select("source_id")
        .in("source_id", sourceIds)
      if (!chunkError) {
        chunkCounts = (chunks ?? []).reduce((map, row: any) => {
          const count = map.get(row.source_id) || 0
          map.set(row.source_id, count + 1)
          return map
        }, new Map<string, number>())
      }
    }

    const documents = sourceRows.map((source) => ({
      id: source.id,
      title: source.title,
      type: source.type,
      filename: source.filename,
      mime_type: source.mime_type,
      size_bytes: source.size_bytes,
      storage_path: source.storage_path,
      status: source.status,
      error_message: source.error_message,
      chunk_count: chunkCounts.get(source.id) || 0,
      metadata: source.metadata || {},
      created_at: source.created_at,
      updated_at: source.updated_at,
    }))

    const stats = {
      total: documents.length,
      pending: documents.filter((doc) => doc.status === "pending").length,
      processing: documents.filter((doc) => doc.status === "processing").length,
      ready: documents.filter((doc) => doc.status === "ready").length,
      failed: documents.filter((doc) => doc.status === "failed").length,
      chunks: documents.reduce((total, doc) => total + doc.chunk_count, 0),
    }

    return NextResponse.json({ success: true, documents, stats })
  } catch (error) {
    console.error("KB status error:", error)
    return NextResponse.json({ error: "Falha ao listar status da KB" }, { status: 500 })
  }
}
