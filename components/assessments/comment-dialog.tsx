'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CommentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialComment: string
  onSave: (comment: string) => Promise<void>
  title?: string
}

export function CommentDialog({
  isOpen,
  onOpenChange,
  initialComment,
  onSave,
  title = 'Comentários da Avaliação'
}: CommentDialogProps) {
  const [comment, setComment] = useState(initialComment)
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when initialComment changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setComment(initialComment || '')
    }
  }, [isOpen, initialComment])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(comment)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving comment:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Adicione ou edite observações sobre esta avaliação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva seu comentário aqui..."
            className="min-h-[150px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Comentário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
