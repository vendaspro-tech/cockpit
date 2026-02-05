'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function WebhooksSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Configure webhooks para receber notificações de eventos em tempo real.
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Webhook
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">Nenhum webhook configurado</p>
            <Button variant="outline" size="sm">
              Adicionar Endpoint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
