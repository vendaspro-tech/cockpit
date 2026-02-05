'use client'

import { useState, useRef } from "react"
import { Plus, Trash2, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createJobTitle, deleteJobTitle } from "@/app/actions/admin/job-titles"
import { useToast } from "@/hooks/use-toast"

interface JobTitle {
  id: string
  name: string
}

interface JobTitlesManagerProps {
  workspaceId: string
  initialJobTitles: JobTitle[]
  userRole: string | null
}

export function JobTitlesManager({ workspaceId, initialJobTitles, userRole }: JobTitlesManagerProps) {
  const [isPending, setIsPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  
  const isSystemOwner = userRole === 'system_owner'

  async function handleCreate(formData: FormData) {
    if (!isSystemOwner) return
    
    const name = formData.get('name') as string
    if (!name) return

    setIsPending(true)
    const result = await createJobTitle({ name })
    setIsPending(false)

    if ('error' in result && result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Cargo criado com sucesso",
      })
      formRef.current?.reset()
    }
  }

  async function handleDelete(id: string) {
    if (!isSystemOwner) return
    
    if (!confirm("Tem certeza que deseja excluir este cargo?")) return

    const result = await deleteJobTitle(id)

    if ('error' in result && result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Cargo excluído com sucesso",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Cargos e Funções
        </CardTitle>
        <CardDescription>
          Gerencie os cargos disponíveis para os membros do time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSystemOwner ? (
          <form ref={formRef} action={handleCreate} className="flex gap-2">
            <Input
              name="name"
              placeholder="Nome do novo cargo (ex: Closer, SDR)"
              required
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </form>
        ) : (
          <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
            Apenas o proprietário do sistema pode gerenciar cargos.
          </div>
        )}

        <div className="space-y-2">
          {initialJobTitles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum cargo cadastrado.
            </p>
          ) : (
            initialJobTitles.map((title) => (
              <div
                key={title.id}
                className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium">{title.name}</span>
                {isSystemOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(title.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
