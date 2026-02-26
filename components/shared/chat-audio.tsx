"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChatAudioMetadata = {
  dataUrl: string
  mimeType: string
  durationMs: number
  transcript?: string
}

export type RecordedAudioDraft = ChatAudioMetadata & {
  createdAt: string
}

type AudioRecorderControlProps = {
  disabled?: boolean
  onRecorded: (draft: RecordedAudioDraft) => void
  onError?: (message: string) => void
  maxDurationMs?: number
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance
type SpeechRecognitionAlternativeLike = { transcript?: string | null }
type SpeechRecognitionResultLike = {
  isFinal?: boolean
  0?: SpeechRecognitionAlternativeLike
}
type SpeechRecognitionResultListLike = {
  length: number
  [index: number]: SpeechRecognitionResultLike | undefined
}
type SpeechRecognitionResultEventLike = {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}
type SpeechRecognitionErrorEventLike = {
  error?: string
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const scopedWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }

  return scopedWindow.SpeechRecognition || scopedWindow.webkitSpeechRecognition || null
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("Falha ao converter áudio"))
    }
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler áudio"))
    reader.readAsDataURL(blob)
  })
}

function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return undefined
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ]
  return candidates.find((mimeType) => {
    try {
      return typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mimeType)
    } catch {
      return false
    }
  })
}

export function AudioRecorderControl({
  disabled,
  onRecorded,
  onError,
  maxDurationMs = 120_000,
}: AudioRecorderControlProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [level, setLevel] = useState(0)
  const [transcriptPreview, setTranscriptPreview] = useState("")
  const [processing, setProcessing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startedAtRef = useRef<number>(0)
  const elapsedIntervalRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef("")

  const clearTimers = () => {
    if (elapsedIntervalRef.current) {
      window.clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const teardownAudioGraph = () => {
    sourceNodeRef.current?.disconnect()
    analyserRef.current?.disconnect()
    sourceNodeRef.current = null
    analyserRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  const teardownStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const stopSpeechRecognition = () => {
    try {
      speechRecognitionRef.current?.stop()
    } catch {
      // noop
    }
    speechRecognitionRef.current = null
  }

  useEffect(() => {
    return () => {
      clearTimers()
      stopSpeechRecognition()
      teardownAudioGraph()
      teardownStream()
    }
  }, [])

  const startSpeechRecognition = () => {
    const SpeechRecognition = getSpeechRecognitionCtor()
    if (!SpeechRecognition) return

    try {
      finalTranscriptRef.current = ""
      setTranscriptPreview("")

      const recognition = new SpeechRecognition()
      recognition.lang = "pt-BR"
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event) => {
        let finalChunk = ""
        let interimChunk = ""

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = String(event.results[i]?.[0]?.transcript || "").trim()
          if (!transcript) continue
          if (event.results[i].isFinal) {
            finalChunk += `${transcript} `
          } else {
            interimChunk += `${transcript} `
          }
        }

        if (finalChunk) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk}`.trim()
        }

        const fullPreview = `${finalTranscriptRef.current} ${interimChunk}`.trim()
        setTranscriptPreview(fullPreview)
      }
      recognition.onerror = (event) => {
        const code = String(event?.error || "")
        if (code && !["aborted", "no-speech"].includes(code)) {
          onError?.("Falha na transcrição automática. Você ainda pode enviar o áudio.")
        }
      }
      recognition.onend = () => {
        speechRecognitionRef.current = null
      }

      speechRecognitionRef.current = recognition
      recognition.start()
    } catch {
      speechRecognitionRef.current = null
    }
  }

  const startLevelMeter = async (stream: MediaStream) => {
    try {
      const audioContext = new window.AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceNodeRef.current = source

      const buffer = new Uint8Array(analyser.fftSize)
      const tick = () => {
        const activeAnalyser = analyserRef.current
        if (!activeAnalyser) return
        activeAnalyser.getByteTimeDomainData(buffer)
        let sumSquares = 0
        for (let i = 0; i < buffer.length; i += 1) {
          const normalized = (buffer[i] - 128) / 128
          sumSquares += normalized * normalized
        }
        const rms = Math.sqrt(sumSquares / buffer.length)
        setLevel(Math.min(1, rms * 4))
        rafRef.current = window.requestAnimationFrame(tick)
      }

      rafRef.current = window.requestAnimationFrame(tick)
    } catch {
      setLevel(0)
    }
  }

  const startRecording = async () => {
    if (disabled || isRecording || processing) return

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError?.("Seu navegador não suporta gravação de áudio.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      finalTranscriptRef.current = ""
      setTranscriptPreview("")
      setElapsedMs(0)
      setLevel(0)

      const supportedMimeType = getSupportedAudioMimeType()
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      startedAtRef.current = Date.now()
      elapsedIntervalRef.current = window.setInterval(() => {
        const nextElapsed = Date.now() - startedAtRef.current
        setElapsedMs(nextElapsed)
        if (nextElapsed >= maxDurationMs && mediaRecorderRef.current?.state === "recording") {
          void stopRecording()
        }
      }, 150)

      await startLevelMeter(stream)
      startSpeechRecognition()

      setIsRecording(true)
      recorder.start(250)
    } catch (error) {
      console.error("Audio recording start error:", error)
      teardownAudioGraph()
      teardownStream()
      onError?.("Não foi possível acessar o microfone.")
    }
  }

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== "recording") return

    setProcessing(true)
    stopSpeechRecognition()

    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = async () => {
        try {
          clearTimers()
          setIsRecording(false)
          teardownAudioGraph()
          teardownStream()

          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
          chunksRef.current = []
          if (!blob.size) {
            setProcessing(false)
            onError?.("Nenhum áudio foi capturado.")
            resolve()
            return
          }

          const dataUrl = await blobToDataUrl(blob)
          const durationMs = Math.max(0, Date.now() - startedAtRef.current)
          const transcript = transcriptPreview.trim() || finalTranscriptRef.current.trim()

          onRecorded({
            dataUrl,
            mimeType: blob.type || recorder.mimeType || "audio/webm",
            durationMs,
            transcript: transcript || undefined,
            createdAt: new Date().toISOString(),
          })
          setTranscriptPreview("")
          setProcessing(false)
          resolve()
        } catch (error) {
          console.error("Audio recording stop error:", error)
          setProcessing(false)
          onError?.("Falha ao finalizar gravação.")
          reject(error)
        }
      }
    })

    try {
      recorder.stop()
      await stopped
    } catch {
      clearTimers()
      setIsRecording(false)
      setProcessing(false)
      teardownAudioGraph()
      teardownStream()
    } finally {
      mediaRecorderRef.current = null
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            onClick={startRecording}
            disabled={disabled || processing}
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            {processing ? "Processando áudio..." : "Gravar áudio"}
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={stopRecording} className="gap-2">
            <Square className="h-4 w-4" />
            Parar gravação
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-medium">Gravando...</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{formatDuration(elapsedMs)}</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 16 }).map((_, index) => {
              const threshold = (index + 1) / 16
              const active = level >= threshold - 0.05
              return (
                <span
                  key={index}
                  className={cn(
                    "h-5 w-1 rounded-full transition-all",
                    active ? "bg-primary" : "bg-primary/20"
                  )}
                  style={{ height: `${10 + Math.max(0, (level * 24) - index)}px` }}
                />
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            A transcrição é feita no navegador para reduzir custo. Limite atual: {Math.floor(maxDurationMs / 1000)}s.
          </p>
        </div>
      )}
    </div>
  )
}

export function getChatAudioMetadata(
  metadata: Record<string, unknown> | null | undefined
): ChatAudioMetadata | null {
  const audio = metadata?.audio
  if (!audio || typeof audio !== "object") return null

  const dataUrl = typeof audio.dataUrl === "string" ? audio.dataUrl : ""
  const mimeType = typeof audio.mimeType === "string" ? audio.mimeType : "audio/webm"
  const durationMs = typeof audio.durationMs === "number" ? audio.durationMs : 0
  const transcript = typeof audio.transcript === "string" ? audio.transcript : undefined

  if (!dataUrl.startsWith("data:audio/")) return null

  return {
    dataUrl,
    mimeType,
    durationMs,
    transcript,
  }
}

export function ChatAudioPlayer({
  audio,
  className,
}: {
  audio: ChatAudioMetadata
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <audio controls preload="metadata" src={audio.dataUrl} className="h-10 w-full" />
      {audio.transcript ? (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
          <span className="font-medium">Transcrição:</span> {audio.transcript}
        </p>
      ) : null}
    </div>
  )
}
