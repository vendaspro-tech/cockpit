import OpenAI from "openai"
import { createOpenRouterClient, getOpenRouterTranscriptionModel } from "@/lib/ai/openrouter"

type AudioPayload = {
  dataUrl: string
  mimeType: string
}

function parseAudioDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:audio/")) {
    throw new Error("Formato de áudio inválido")
  }

  const commaIndex = dataUrl.indexOf(",")
  if (commaIndex <= 0) {
    throw new Error("Formato de áudio inválido")
  }

  const header = dataUrl.slice(5, commaIndex) // remove "data:"
  const base64 = dataUrl.slice(commaIndex + 1)
  const headerParts = header.split(";").map((part) => part.trim()).filter(Boolean)
  const mimeType = headerParts[0]
  const isBase64 = headerParts.some((part) => part.toLowerCase() === "base64")

  if (!mimeType?.startsWith("audio/") || !isBase64 || !base64) {
    throw new Error("Formato de áudio inválido")
  }

  return {
    mimeType,
    base64,
  }
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes("webm")) return "webm"
  if (mimeType.includes("ogg")) return "ogg"
  if (mimeType.includes("mp4")) return "m4a"
  if (mimeType.includes("mpeg")) return "mp3"
  if (mimeType.includes("wav")) return "wav"
  return "webm"
}

export async function transcribeChatAudio(audio: AudioPayload) {
  const parsed = parseAudioDataUrl(audio.dataUrl)
  const mimeType = audio.mimeType || parsed.mimeType
  const buffer = Buffer.from(parsed.base64, "base64")

  if (!buffer.length) {
    throw new Error("Áudio vazio")
  }

  const file = new File([buffer], `chat-audio.${extensionFromMimeType(mimeType)}`, {
    type: mimeType,
  })

  let transcriptionText = ""

  try {
    const openrouter = createOpenRouterClient()
    const transcription = await openrouter.audio.transcriptions.create({
      model: getOpenRouterTranscriptionModel(),
      file,
      language: "pt",
    })
    transcriptionText = transcription.text || ""
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined
    const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY)

    if (status !== 405 || !hasOpenAiKey) {
      throw error
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "pt",
    })
    transcriptionText = transcription.text || ""
  }

  return transcriptionText.trim()
}
