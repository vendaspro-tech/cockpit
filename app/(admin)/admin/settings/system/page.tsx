import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Database, Bell, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações do Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie configurações globais do sistema e monitoramento.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissões de Sistema
            </CardTitle>
            <CardDescription>
              Você possui privilégios de System Owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Nível de Acesso</p>
                <p className="text-xs text-muted-foreground">
                  Acesso total a todas as funcionalidades administrativas.
                </p>
              </div>
              <Badge variant="default">System Owner</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Banco de Dados
            </CardTitle>
            <CardDescription>
              Informações sobre o banco de dados do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  Online
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span>Supabase PostgreSQL</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações do Sistema
            </CardTitle>
            <CardDescription>
              Configure alertas e notificações administrativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve: Configure alertas personalizados para eventos do sistema.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monitoramento
            </CardTitle>
            <CardDescription>
              Acompanhe a saúde e performance do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve: Dashboards de monitoramento e métricas de performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
