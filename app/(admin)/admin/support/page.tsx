import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeBuoy, MessageSquare, FileText, Mail, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
        <p className="text-muted-foreground mt-2">
          Recursos e canais de suporte para administradores do sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentação
            </CardTitle>
            <CardDescription>
              Guias completos sobre funcionalidades e configurações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acesse nossa documentação técnica com guias passo a passo, referências de API e melhores práticas.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/docs" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Documentação
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat de Suporte
            </CardTitle>
            <CardDescription>
              Converse diretamente com nossa equipe de suporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Atendimento em tempo real para dúvidas técnicas e problemas urgentes.
            </p>
            <Button variant="outline" className="w-full" disabled>
              <MessageSquare className="h-4 w-4 mr-2" />
              Em breve
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email de Suporte
            </CardTitle>
            <CardDescription>
              Entre em contato por email para questões não urgentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Envie suas dúvidas e sugestões. Respondemos em até 24 horas úteis.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:support@cockpitcomercial.com">
                <Mail className="h-4 w-4 mr-2" />
                support@cockpitcomercial.com
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              Base de Conhecimento
            </CardTitle>
            <CardDescription>
              Artigos e tutoriais sobre recursos do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Explore nossa biblioteca de artigos com soluções para problemas comuns.
            </p>
            <Button variant="outline" className="w-full" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Em breve
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suporte Prioritário - System Owner</CardTitle>
          <CardDescription>
            Como System Owner, você tem acesso a suporte prioritário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Resposta Rápida</p>
              <p className="text-sm text-muted-foreground">
                Tempo de resposta médio de 2 horas durante horário comercial
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Suporte Técnico Avançado</p>
              <p className="text-sm text-muted-foreground">
                Acesso a especialistas para questões complexas de configuração
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
