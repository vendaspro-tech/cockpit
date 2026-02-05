'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updateSystemAISettings, type AISettings } from "@/app/actions/admin/settings"
import { useToast } from "@/hooks/use-toast"
import { Bot, Brain, Globe, Key, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AISettingsFormProps {
  initialSettings?: AISettings
}

export function AISettingsForm({ initialSettings }: AISettingsFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<AISettings>({
    provider: initialSettings?.provider || "google",
    model: initialSettings?.model || "gemini-1.5-flash",
    thinkingMode: initialSettings?.thinkingMode || false,
    searchGrounding: initialSettings?.searchGrounding || false,
    apiKey: initialSettings?.apiKey || "",
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await updateSystemAISettings(settings)
      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sucesso",
          description: "Configurações de IA atualizadas com sucesso.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Inteligência Artificial</h2>
          <p className="text-sm text-muted-foreground">
            Configure qual cérebro vai alimentar seu sistema.
          </p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-muted/50">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Provedor de IA
              </Label>
              <Select
                value={settings.provider}
                onValueChange={(value) => setSettings({ ...settings, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Modelo
              </Label>
              <Select
                value={settings.model}
                onValueChange={(value) => setSettings({ ...settings, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash - Recomendado ($0.15 / $0.60)</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro - Mais Inteligente</SelectItem>
                  <SelectItem value="gpt-4o-mini">OpenAI GPT-4o mini - Rápido</SelectItem>
                  <SelectItem value="gpt-4o">OpenAI GPT-4o - Mais potente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <Label className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-pink-500" />
                Modo Pensamento (Thinking)
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite que o modelo &quot;pense&quot; antes de responder, melhorando o raciocínio.
              </p>
            </div>
            <Switch
              checked={settings.thinkingMode}
              onCheckedChange={(checked) => setSettings({ ...settings, thinkingMode: checked })}
            />
          </div>

          <div className="rounded-lg border bg-card p-4 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <Label className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Google Search Grounding
              </Label>
              <p className="text-sm text-muted-foreground">
                Conecta o modelo à internet para buscar informações atualizadas.
              </p>
            </div>
            <Switch
              checked={settings.searchGrounding}
              onCheckedChange={(checked) => setSettings({ ...settings, searchGrounding: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Chave de API (provedor selecionado)
            </Label>
            <Input
              type="password"
              placeholder="Cole sua chave aqui..."
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Sua chave é salva de forma segura no banco de dados do workspace.
            </p>
          </div>

          {!settings.apiKey && (
            <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-500">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuração Pendente</AlertTitle>
              <AlertDescription>
                Você precisa inserir uma chave de API válida para usar o assistente.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
