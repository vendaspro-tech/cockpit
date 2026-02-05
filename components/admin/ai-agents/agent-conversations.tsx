"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getConversationMessagesAdmin } from "@/app/actions/admin/ai-agents"
import { useToast } from "@/hooks/use-toast"

type ConversationRow = {
  id: string
  title: string | null
  last_message_at: string | null
  created_at: string
  user: { id: string; email: string | null; full_name: string | null } | null
}

type AgentConversationsProps = {
  conversations: ConversationRow[]
}

export function AgentConversations({ conversations }: AgentConversationsProps) {
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; content: string; created_at: string }>>([])
  const [loading, setLoading] = useState(false)

  const handleSelect = async (conversationId: string) => {
    setSelectedId(conversationId)
    setLoading(true)
    try {
      const data = await getConversationMessagesAdmin(conversationId)
      setMessages(data as any)
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar a conversa.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas</CardTitle>
        <CardDescription>
          Visualize conversas dos usuários com este agente.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
          )}
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{conversation.title || "Sem título"}</p>
                <p className="text-xs text-muted-foreground">
                  {conversation.user?.full_name || conversation.user?.email || "Usuário"}
                </p>
              </div>
              <Button
                variant={selectedId === conversation.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleSelect(conversation.id)}
              >
                Ver
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-semibold mb-3">Mensagens</h4>
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && selectedId && (
            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground mb-1">{msg.sender}</p>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {!selectedId && !loading && (
            <p className="text-sm text-muted-foreground">Selecione uma conversa para visualizar.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
