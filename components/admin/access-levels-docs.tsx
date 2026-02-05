'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Eye, Lock, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AccessLevelsDocs() {
  return (
    <div className="space-y-6">
      {/* Sistema Duplo de Controle */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Sistema Duplo de Controle de Acesso</AlertTitle>
        <AlertDescription>
          O sistema possui <strong>dois níveis independentes</strong> de controle: Níveis de Acesso (permissões de ação) e Hierarquia de Cargos (visibilidade de dados).
        </AlertDescription>
      </Alert>

      {/* Níveis de Acesso (Roles) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>1. Níveis de Acesso (Roles)</CardTitle>
          </div>
          <CardDescription>
            Controlam <strong>permissões de AÇÃO</strong> no workspace: criar, editar, deletar, gerenciar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 space-y-2">
              <Badge className="bg-primary">Owner (Proprietário)</Badge>
              <p className="text-sm font-medium">Acesso Total</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gerenciar faturamento</li>
                <li>• Excluir workspace</li>
                <li>• Gerenciar todos usuários</li>
                <li>• Todas as permissões de admin</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <Badge variant="secondary">Admin (Administrador)</Badge>
              <p className="text-sm font-medium">Gestão Operacional</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Convidar/remover usuários</li>
                <li>• Criar avaliações</li>
                <li>• Configurar processos</li>
                <li>• Gerenciar times</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <Badge variant="outline">Member (Membro)</Badge>
              <p className="text-sm font-medium">Execução</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Responder avaliações</li>
                <li>• Ver seus dados</li>
                <li>• Executar tarefas</li>
                <li>• Acesso restrito</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarquia de Cargos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>2. Hierarquia de Cargos (Job Titles)</CardTitle>
          </div>
          <CardDescription>
            Controla <strong>visibilidade de DADOS sensíveis</strong>: avaliações, salários, PDIs de outros usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">Regra de Visibilidade:</p>
            <code className="text-sm bg-background px-2 py-1 rounded">
              Usuario(Nível N) pode ver dados de Usuario(Nível {'>'} N)
            </code>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge>Nível 0 - Estratégico</Badge>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Gerente Comercial</p>
              <p className="text-sm text-muted-foreground">
                Vê dados de <strong>TODOS</strong> os níveis abaixo (1, 2 e 3)
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Nível 1 - Tático</Badge>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Coordenador, Sales Ops, Enablement</p>
              <p className="text-sm text-muted-foreground">
                Vê dados dos <strong>Níveis 2 e 3</strong>
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Nível 2 - Operacional</Badge>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Supervisor Comercial</p>
              <p className="text-sm text-muted-foreground">
                Vê dados do <strong>Nível 3</strong> apenas
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Nível 3 - Execução</Badge>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">SDR, Closer, BDR, Social Seller, CS, Inside Sales</p>
              <p className="text-sm text-muted-foreground">
                Vê <strong>apenas seus próprios dados</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos Práticos */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos Práticos</CardTitle>
          <CardDescription>Como os dois sistemas interagem na prática</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Exemplo 1: SDR com Role Admin</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>Nível de Acesso:</strong> Admin (pode convidar usuários, configurar sistema)</li>
                <li>• <strong>Cargo:</strong> SDR - Nível 3 (vê apenas seus próprios dados)</li>
                <li>• <strong>Resultado:</strong> Pode gerenciar operações mas não vê avaliações de outros</li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Exemplo 2: Gerente com Role Member</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>Nível de Acesso:</strong> Member (acesso restrito a ações)</li>
                <li>• <strong>Cargo:</strong> Gerente Comercial - Nível 0 (vê dados de todos)</li>
                <li>• <strong>Resultado:</strong> Vê avaliações de toda equipe mas não pode convidar usuários</li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Exemplo 3: Coordenador com Role Admin</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>Nível de Acesso:</strong> Admin (gestão completa)</li>
                <li>• <strong>Cargo:</strong> Coordenador - Nível 1 (vê níveis 2 e 3)</li>
                <li>• <strong>Resultado:</strong> Gestão completa + vê dados de Supervisores e Executores</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
