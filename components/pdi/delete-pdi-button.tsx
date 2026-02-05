'use client'

import { useState } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { deletePDIPlan } from '@/app/actions/pdi-delete'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DeletePDIButtonProps {
  pdiId: string
  workspaceId: string
}

export function DeletePDIButton({ pdiId, workspaceId }: DeletePDIButtonProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)
    const loadingToast = toast.loading('Excluindo PDI...')

    try {
      const result = await deletePDIPlan(pdiId)

      toast.dismiss(loadingToast)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('PDI excluído com sucesso!')
        router.push(`/${workspaceId}/pdi`)
        router.refresh()
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Delete error:', error)
      toast.error('Erro ao excluir PDI')
    } finally {
      setDeleting(false)
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir PDI
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir PDI?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O PDI e todos os seus itens, ações e evidências serão removidos permanentemente.
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
  )
}
