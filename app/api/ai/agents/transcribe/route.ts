import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createOpenRouterClient, getOpenRouterTranscriptionModel } from "@/lib/ai/openrouter"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo de áudio inválido" }, { status: 400 })
    }

    const openai = createOpenRouterClient()
    const transcription = await openai.audio.transcriptions.create({
      model: getOpenRouterTranscriptionModel(),
      file,
      language: "pt",
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Erro ao transcrever áudio" }, { status: 500 })
  }
}
