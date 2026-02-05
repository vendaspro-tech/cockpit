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
import { createAgent, updateAgent, deleteAgent } from "@/app/actions/admin/ai-agents"

type AgentFormProps = {
  mode: "create" | "edit"
  agentId?: string
  initial?: {
    name: string
    description: string | null
    system_prompt: string
    model: string
    temperature: number
    status: "active" | "inactive"
  }
}

export function AgentForm({ mode, agentId, initial }: AgentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    systemPrompt: initial?.system_prompt ?? "",
    model: initial?.model ?? "gpt-4o-mini",
    temperature: initial?.temperature ?? 0.7,
    status: initial?.status ?? "active",
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      if (mode === "create") {
        const result = await createAgent(form)
        if (result?.error) {
          toast({ title: "Erro", description: result.error, variant: "destructive" })
        } else if (result?.agent?.id) {
          toast({ title: "Agente criado", description: "Agente criado com sucesso." })
          router.push(`/admin/agents/${result.agent.id}`)
        }
      } else if (agentId) {
        const result = await updateAgent(agentId, form)
        if (result?.error) {
          toast({ title: "Erro", description: result.error, variant: "destructive" })
        } else {
          toast({ title: "Agente atualizado", description: "Alterações salvas com sucesso." })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!agentId) return
    const confirmed = window.confirm("Tem certeza que deseja excluir este agente? Esta ação é irreversível.")
    if (!confirmed) return

    setLoading(true)
    try {
      const result = await deleteAgent(agentId)
      if (result?.error) {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Agente excluído", description: "Agente removido com sucesso." })
        router.push("/admin/agents")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Novo Agente" : "Detalhes do Agente"}</CardTitle>
        <CardDescription>
          Configure nome, descrição e system prompt do agente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Consultor de Vendas"
          />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Breve descrição do agente"
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) => setForm({ ...form, status: value as "active" | "inactive" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>System Prompt</Label>
          <Textarea
            value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            placeholder="Instruções detalhadas para o agente"
            rows={8}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select
              value={form.model}
              onValueChange={(value) => setForm({ ...form, model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o mini (rápido)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (mais potente)</SelectItem>
                <SelectItem value="gpt-4.1-mini">GPT-4.1 mini</SelectItem>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Temperatura (0 a 1)</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {mode === "edit" ? (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={handleSave} disabled={loading}>
            {mode === "create" ? "Criar Agente" : "Salvar Alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
