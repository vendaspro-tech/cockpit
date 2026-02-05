'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileText, Image as ImageIcon, Download, Trash2, ExternalLink } from 'lucide-react'
import { deleteEvidence } from '@/app/actions/pdi-evidence'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Evidence {
  id: string
  file_url: string
  description: string | null
  uploaded_at: string
  uploader?: {
    full_name: string | null
    email: string
  }
}

interface EvidenceListProps {
  evidences: Evidence[]
  pdiItemId: string
}

export function EvidenceList({ evidences, pdiItemId }: EvidenceListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />
    }
    return <FileText className="w-6 h-6 text-gray-500" />
  }

  const getFileName = (url: string) => {
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    return decodeURIComponent(fileName)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    
    setDeleting(true)
    const loadingToast = toast.loading('Excluindo evidência...')

    try {
      const result = await deleteEvidence(deletingId, pdiItemId)
      
      toast.dismiss(loadingToast)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Evidência excluída com sucesso!')
        router.refresh()
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Delete error:', error)
      toast.error('Erro ao excluir evidência')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const openDeleteDialog = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  if (evidences.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>Nenhuma evidência enviada ainda.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {evidences.map((evidence) => (
          <Card key={evidence.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0">
                {getFileIcon(evidence.file_url)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getFileName(evidence.file_url)}
                    </p>
                    {evidence.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {evidence.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>
                    {format(new Date(evidence.uploaded_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {evidence.uploader && (
                    <span>
                      por {evidence.uploader.full_name || evidence.uploader.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => window.open(evidence.file_url, '_blank')}
                  title="Visualizar"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = evidence.file_url
                    link.download = getFileName(evidence.file_url)
                    link.click()
                  }}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => openDeleteDialog(evidence.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evidência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta evidência será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
