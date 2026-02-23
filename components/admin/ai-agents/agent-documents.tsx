"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Upload } from "lucide-react"

type AgentDocumentsProps = {
  agentId: string
  documents: AdminAgentDocument[]
}

type AgentDocumentFormInput = Omit<AgentDocumentInput, "sourceUrl"> & { sourceUrl: string }

const emptyDoc: AgentDocumentFormInput = {
  title: "",
  content: "",
  type: "document" as AgentDocumentInput["type"],
  sourceUrl: "",
}

export function AgentDocuments({ agentId, documents }: AgentDocumentsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<AgentDocumentFormInput>({ ...emptyDoc })
  const [uploading, setUploading] = useState(false)
  const [draft, setDraft] = useState<AgentDocumentFormInput>({ ...emptyDoc })
  const [editing, setEditing] = useState<AdminAgentDocument | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const result = await createAgentDocument(agentId, draft)
      if (result && "error" in result) {
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
    if (result && "error" in result) {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Documento excluído", description: "Documento removido." })
      router.refresh()
    }
  }

  const handleUploadFile = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("agentId", agentId)
      formData.append("file", file)
      const response = await fetch("/api/ai/agents/kb/upload", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        toast({ title: "Erro", description: result.error || "Falha no upload", variant: "destructive" })
        return
      }
      toast({ title: "Upload concluído", description: "Documento indexado com sucesso." })
      router.refresh()
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao enviar arquivo.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleReplaceFile = async (doc: AdminAgentDocument, file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("agentId", agentId)
      formData.append("documentId", doc.id)
      formData.append("file", file)
      const response = await fetch("/api/ai/agents/kb/update-file", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        toast({ title: "Erro", description: result.error || "Falha ao substituir arquivo", variant: "destructive" })
        return
      }
      toast({ title: "Arquivo substituído", description: "Documento atualizado e reindexado." })
      router.refresh()
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao substituir arquivo.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setLoading(true)
    try {
      const result = await updateAgentDocument(agentId, editing.id, {
        title: editing.title,
        content: editing.content || "",
        type: editing.type as AgentDocumentInput["type"],
        sourceUrl: editing.source_url ?? "",
      })
      if (result && "error" in result) {
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
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={uploading}
            onClick={async () => {
              setUploading(true)
              try {
                const response = await fetch("/api/ai/agents/kb/process-pending", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agentId }),
                })
                const result = await response.json()
                if (!response.ok) {
                  toast({
                    title: "Erro",
                    description: result.error || "Falha ao processar pendências",
                    variant: "destructive",
                  })
                  return
                }
                toast({
                  title: "Processamento concluído",
                  description: `${result.succeeded || 0} fonte(s) processada(s).`,
                })
                router.refresh()
              } catch {
                toast({ title: "Erro", description: "Falha ao processar pendências.", variant: "destructive" })
              } finally {
                setUploading(false)
              }
            }}
          >
            Processar Pendentes
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <h4 className="font-medium">Upload de Arquivos (PDF, TXT, CSV)</h4>
            <p className="text-xs text-muted-foreground">Limite de 25MB por arquivo.</p>
          </div>
          <Label htmlFor="kb-file-upload" className="w-fit cursor-pointer">
            <span className="sr-only">Selecionar arquivo</span>
            <Button asChild variant="outline" disabled={uploading}>
              <span>
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : "Enviar arquivo"}
              </span>
            </Button>
          </Label>
          <Input
            id="kb-file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.txt,.csv"
            onChange={(e) => handleUploadFile(e.target.files?.[0] || null)}
          />
        </div>

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
                  {doc.type} • {doc.chunk_count} chunks • status: {doc.status}
                </p>
                {doc.error_message ? (
                  <p className="text-xs text-destructive">{doc.error_message}</p>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  <Badge variant={doc.filename ? "secondary" : "outline"}>
                    {doc.filename ? "Arquivo" : "Manual"}
                  </Badge>
                  <Badge variant="outline">{doc.status}</Badge>
                  {doc.filename && <Badge variant="outline">{doc.filename}</Badge>}
                  {doc.size_bytes ? (
                    <Badge variant="outline">{Math.ceil(doc.size_bytes / 1024)} KB</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                {doc.filename && (
                  <>
                    <Label htmlFor={`replace-${doc.id}`} className="w-fit cursor-pointer">
                    <Button asChild variant="outline" size="sm" disabled={uploading}>
                      <span>Substituir arquivo</span>
                    </Button>
                  </Label>
                    <Input
                      id={`replace-${doc.id}`}
                      type="file"
                      className="hidden"
                      accept=".pdf,.txt,.csv"
                      onChange={(e) => handleReplaceFile(doc, e.target.files?.[0] || null)}
                    />
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={uploading}
                  onClick={async () => {
                    setUploading(true)
                    try {
                      const response = await fetch("/api/ai/agents/kb/reindex", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sourceId: doc.id }),
                      })
                      const result = await response.json()
                      if (!response.ok) {
                        toast({
                          title: "Erro",
                          description: result.error || "Falha ao reindexar",
                          variant: "destructive",
                        })
                        return
                      }
                      toast({ title: "Reindexação concluída", description: "Fonte processada com sucesso." })
                      router.refresh()
                    } catch {
                      toast({ title: "Erro", description: "Falha ao reindexar.", variant: "destructive" })
                    } finally {
                      setUploading(false)
                    }
                  }}
                >
                  Reindexar
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(doc)}
                      disabled={!!doc.filename || !doc.content}
                    >
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
                            value={editing.content || ""}
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
