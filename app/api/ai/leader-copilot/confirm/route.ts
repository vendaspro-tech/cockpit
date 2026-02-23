import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { canAccessLeaderCopilot } from "@/lib/leader-scope"
import { executePendingAction } from "@/lib/ai/leader-copilot-agent"

export const runtime = "nodejs"

const ConfirmRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid(),
  pendingActionId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ConfirmRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { workspaceId, conversationId, pendingActionId } = parsed.data

    const hasAccess = await canAccessLeaderCopilot(workspaceId, authData.user.id, supabase)
    if (!hasAccess) {
      return NextResponse.json({ error: "Acesso negado ao Copiloto do Líder" }, { status: 403 })
    }

    const result = await executePendingAction({
      workspaceId,
      conversationId,
      pendingActionId,
      actorAuthUserId: authData.user.id,
    })

    const confirmationMessage = `Ação confirmada e executada com sucesso (${result.entity}: ${result.id}).`

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      sender: "assistant",
      content: confirmationMessage,
      metadata: {
        type: "execution_confirmation",
        pendingActionId,
        result,
      },
    })

    await supabase
      .from("ai_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId)

    return NextResponse.json({ success: true, executed: true, result })
  } catch (error) {
    console.error("Leader copilot confirm error:", error)
    return NextResponse.json({ error: "Falha ao confirmar ação" }, { status: 500 })
  }
}
