"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  createAgentDocument,
  deleteAgentDocument,
  updateAgentDocument,
  type AgentDocumentInput,
  type AdminAgentDocument,
} from "@/app/actions/admin/ai-agents"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type AgentDocumentsProps = {
  agentId: string
  documents: AdminAgentDocument[]
}

const emptyDoc: AgentDocumentInput = {
  title: "",
  content: "",
  type: "document",
  sourceUrl: "",
}

export function AgentDocuments({ agentId, documents }: AgentDocumentsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<AgentDocumentInput>({ ...emptyDoc })
  const [editing, setEditing] = useState<AdminAgentDocument | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const result = await createAgentDocument(agentId, draft)
      if (result?.error) {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Documento adicionado", description: "O documento foi indexado com sucesso." })
        setDraft({ ...emptyDoc })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    const confirmed = window.confirm("Excluir este documento? Isso remove o contexto do agente.")
    if (!confirmed) return

    const result = await deleteAgentDocument(agentId, docId)
    if (result?.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Documento excluído", description: "Documento removido." })
      router.refresh()
    }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setLoading(true)
    try {
      const result = await updateAgentDocument(agentId, editing.id, {
        title: editing.title,
        content: editing.content,
        type: editing.type as any,
        sourceUrl: editing.source_url ?? "",
      })
      if (result?.error) {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Documento atualizado", description: "Documento reindexado com sucesso." })
        setEditing(null)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos do Agente</CardTitle>
        <CardDescription>
          Adicione documentos para enriquecer o contexto do agente via RAG.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Ex: Guia de Objeções"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={draft.type}
              onValueChange={(value) =>
                setDraft({ ...draft, type: value as AgentDocumentInput["type"] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="transcript">Transcrição</SelectItem>
                <SelectItem value="pdi">PDI</SelectItem>
                <SelectItem value="assessment">Avaliação</SelectItem>
                <SelectItem value="image_extracted">Imagem extraída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Conteúdo</Label>
            <Textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={6}
              placeholder="Cole o conteúdo textual que o agente deve conhecer."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Fonte (opcional)</Label>
            <Input
              value={draft.sourceUrl}
              onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreate} disabled={loading}>
              Adicionar Documento
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {documents.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum documento indexado.</p>
          )}

          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-semibold">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.type} • {doc.metadata?.content_length || doc.content.length} caracteres
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditing(doc)}>
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Documento</DialogTitle>
                    </DialogHeader>
                    {editing && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={editing.title}
                            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={editing.type}
                            onValueChange={(value) =>
                              setEditing({ ...editing, type: value as AgentDocumentInput["type"] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">Documento</SelectItem>
                              <SelectItem value="transcript">Transcrição</SelectItem>
                              <SelectItem value="pdi">PDI</SelectItem>
                              <SelectItem value="assessment">Avaliação</SelectItem>
                              <SelectItem value="image_extracted">Imagem extraída</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Conteúdo</Label>
                          <Textarea
                            value={editing.content}
                            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                            rows={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fonte</Label>
                          <Input
                            value={editing.source_url ?? ""}
                            onChange={(e) => setEditing({ ...editing, source_url: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditing(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdate} disabled={loading}>
                        Salvar alterações
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
