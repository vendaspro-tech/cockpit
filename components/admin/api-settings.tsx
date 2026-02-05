'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"

export function APISettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chaves de API</CardTitle>
          <CardDescription>
            Gerencie as chaves de API para acessar os recursos da plataforma externamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chave de API Pública</Label>
            <div className="flex gap-2">
              <Input value="public_key_placeholder" readOnly />
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use esta chave para autenticar requisições do lado do cliente.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Chave Secreta</Label>
            <div className="flex gap-2">
              <Input value="secret_key_placeholder" type="password" readOnly />
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mantenha esta chave segura. Nunca a exponha no lado do cliente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
