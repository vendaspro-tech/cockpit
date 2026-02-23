'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'

import { submitBugReport } from '@/app/actions/bug-reports'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const MAX_FILES = 5
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface BugReportDialogProps {
  workspaceId: string
}

export function BugReportDialog({ workspaceId }: BugReportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const canSubmit = useMemo(() => {
    return title.trim().length >= 3 && description.trim().length >= 10 && files.length > 0
  }, [title, description, files.length])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setFiles([])
  }

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const list = Array.from(selectedFiles)
    const merged = [...files, ...list]

    if (merged.length > MAX_FILES) {
      toast.error(`Você pode enviar no máximo ${MAX_FILES} imagens.`)
      return
    }

    for (const file of merged) {
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(`Formato não suportado: ${file.name}`)
        return
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`Arquivo acima de 5MB: ${file.name}`)
        return
      }
    }

    setFiles(merged)
  }

  const handleRemoveFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Preencha título, descrição e anexe pelo menos 1 imagem.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitBugReport(
        {
          title: title.trim(),
          description: description.trim(),
          images: files,
        },
        workspaceId
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Relato enviado com sucesso.')
      resetForm()
      setOpen(false)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Relatar bug</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Relatar bug</DialogTitle>
          <DialogDescription>
            Descreva o problema com detalhes e anexe até 5 imagens.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bug-title">Título</Label>
            <Input
              id="bug-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Erro ao salvar produto"
              maxLength={140}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bug-description">Descrição</Label>
            <Textarea
              id="bug-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explique o que aconteceu, como reproduzir e o impacto."
              rows={6}
              maxLength={4000}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bug-images">Imagens (até 5)</Label>
            <Input
              id="bug-images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={isSubmitting || files.length >= MAX_FILES}
              onChange={(event) => {
                handleFileSelection(event.target.files)
                event.currentTarget.value = ''
              }}
            />
            <p className="text-xs text-muted-foreground">
              {files.length}/{MAX_FILES} imagens selecionadas.
            </p>

            {files.length > 0 ? (
              <div className="grid gap-2 rounded-md border p-3">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {previewUrls[index] ? (
                        <Image
                          src={previewUrls[index]}
                          alt={file.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 rounded object-cover border"
                        />
                      ) : null}
                      <span className="truncate">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar relato'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
