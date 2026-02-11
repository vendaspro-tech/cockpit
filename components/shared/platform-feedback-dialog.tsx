'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

import { dismissPlatformFeedback, submitPlatformFeedback } from '@/app/actions/platform-feedback'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface PlatformFeedbackDialogProps {
  initialOpen: boolean
}

function ScorePicker({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number | null
  onChange: (next: number) => void
  disabled?: boolean
  label: string
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => (
          <Button
            key={score}
            type="button"
            size="sm"
            variant={value === score ? 'default' : 'outline'}
            disabled={disabled}
            className={cn('h-8 px-0', value === score ? 'font-semibold' : 'font-normal')}
            onClick={() => onChange(score)}
          >
            {score}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function PlatformFeedbackDialog({ initialOpen }: PlatformFeedbackDialogProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(initialOpen)
  const [experienceScore, setExperienceScore] = useState<number | null>(null)
  const [recommendationScore, setRecommendationScore] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [handledClose, setHandledClose] = useState(false)

  const canSubmit = useMemo(() => {
    return typeof experienceScore === 'number' && typeof recommendationScore === 'number'
  }, [experienceScore, recommendationScore])

  const handleSubmit = async () => {
    if (!canSubmit || experienceScore === null || recommendationScore === null) {
      toast.error('Selecione as duas notas antes de enviar.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitPlatformFeedback(
        {
          experience_score: experienceScore,
          recommendation_score: recommendationScore,
          notes,
        },
        pathname
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      setHandledClose(true)
      setOpen(false)
      toast.success('Obrigado pelo feedback!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async () => {
    setIsDismissing(true)

    try {
      const result = await dismissPlatformFeedback()
      if (result.error) {
        toast.error(result.error)
        return
      }

      setHandledClose(true)
      setOpen(false)
      toast.message('Vamos te lembrar novamente em 7 dias.')
    } finally {
      setIsDismissing(false)
    }
  }

  const handleOpenChange = async (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true)
      return
    }

    if (handledClose || isSubmitting || isDismissing) {
      setOpen(false)
      return
    }

    await handleDismiss()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Queremos ouvir você</DialogTitle>
          <DialogDescription>
            Avalie sua experiência na plataforma. Leva menos de 1 minuto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <ScorePicker
            label="Como foi sua experiência com a plataforma?"
            value={experienceScore}
            onChange={setExperienceScore}
            disabled={isSubmitting || isDismissing}
          />

          <ScorePicker
            label="Qual a chance de recomendar a plataforma para um amigo?"
            value={recommendationScore}
            onChange={setRecommendationScore}
            disabled={isSubmitting || isDismissing}
          />

          <div className="grid gap-2">
            <Label htmlFor="platform-feedback-notes">Observações (opcional)</Label>
            <Textarea
              id="platform-feedback-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Compartilhe comentários, sugestões ou pontos de melhoria..."
              rows={4}
              disabled={isSubmitting || isDismissing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss} disabled={isSubmitting || isDismissing}>
            {isDismissing ? 'Salvando...' : 'Lembrar depois'}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting || isDismissing}>
            {isSubmitting ? 'Enviando...' : 'Enviar feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
