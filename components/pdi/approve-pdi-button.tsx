'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { approvePDI } from "@/app/actions/pdi-approval"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
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
} from "@/components/ui/alert-dialog"

interface ApprovePDIButtonProps {
  pdiId: string
  isApproved: boolean
}

export function ApprovePDIButton({ pdiId, isApproved }: ApprovePDIButtonProps) {
  const [isApproving, setIsApproving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleApprove() {
    setIsApproving(true)
    const result = await approvePDI(pdiId)

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "PDI Aprovado!",
        description: "O PDI foi aprovado e está ativo para execução."
      })
      router.refresh()
    }
    setIsApproving(false)
  }

  if (isApproved) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Já Aprovado
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Aprovar PDI
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar Plano de Desenvolvimento?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao aprovar este PDI, você confirma que:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Revisou os itens de desenvolvimento</li>
              <li>Concorda com as ações propostas</li>
              <li>O colaborador pode iniciar a execução</li>
            </ul>
            O PDI será marcado como &quot;Ativo&quot; e o colaborador poderá começar a trabalhar nos itens.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isApproving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
            {isApproving ? 'Aprovando...' : 'Confirmar Aprovação'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
