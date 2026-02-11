import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"

export const runtime = "nodejs"

const DeleteSchema = z.object({
  agentId: z.string().uuid(),
  documentId: z.string().uuid(),
})

export async function DELETE(request: NextRequest) {
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
    const parsed = DeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: existing, error: existingError } = await supabase
      .from("ai_agent_knowledge_base")
      .select("storage_path")
      .eq("id", parsed.data.documentId)
      .eq("agent_id", parsed.data.agentId)
      .maybeSingle()

    if (existingError || !existing) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from("ai_agent_knowledge_base")
      .delete()
      .eq("id", parsed.data.documentId)
      .eq("agent_id", parsed.data.agentId)

    if (deleteError) {
      console.error("KB delete error:", deleteError)
      return NextResponse.json({ error: "Erro ao excluir documento" }, { status: 500 })
    }

    if (existing.storage_path) {
      await supabase.storage.from("ai-agent-kb-files").remove([existing.storage_path])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("KB delete route error:", error)
    return NextResponse.json({ error: "Erro ao excluir arquivo" }, { status: 500 })
  }
}
