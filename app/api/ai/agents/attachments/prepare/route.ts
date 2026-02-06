import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { z } from "zod"

export const runtime = "nodejs"

const PrepareSchema = z.object({
  agentId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

const MAX_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set(["text/plain", "text/csv", "application/pdf"])
const BUCKET = "ai-chat-attachments"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = PrepareSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(parsed.data.mimeType)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }

    if (parsed.data.sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo acima de 25MB" }, { status: 400 })
    }

    const { userId } = await ensureSupabaseUser(authData.user.id)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let resolvedConversationId = parsed.data.conversationId

    if (!resolvedConversationId) {
      const { data: newConversation, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          agent_id: parsed.data.agentId,
          workspace_id: parsed.data.workspaceId,
          user_id: userId,
          title: "Anexos",
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError || !newConversation) {
        return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
      }

      resolvedConversationId = newConversation.id
    }

    const safeName = sanitizeFileName(parsed.data.filename)
    const storagePath = `${resolvedConversationId}/${Date.now()}-${safeName}`

    return NextResponse.json({
      success: true,
      conversationId: resolvedConversationId,
      storagePath,
      bucket: BUCKET,
    })
  } catch (error) {
    console.error("Attachment prepare error:", error)
    return NextResponse.json({ error: "Erro ao preparar anexo" }, { status: 500 })
  }
}
