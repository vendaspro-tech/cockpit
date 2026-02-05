import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Lock } from "lucide-react"

export default function InfosPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
            Exclusivo
          </div>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Comercial PRO
          </h1>
          <p className="text-xl text-muted-foreground">
            Eleve seu time comercial ao próximo nível com ferramentas avançadas de gestão, planos de ação personalizados e consultorias exclusivas.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <span className="text-lg">Planos de Ação Estruturados</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <span className="text-lg">Consultorias com Especialistas</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <span className="text-lg">Acompanhamento de Metas e KPIs</span>
            </div>
          </div>

          <div className="pt-4">
            <Button size="lg" className="w-full md:w-auto">
              Falar com um Especialista
            </Button>
          </div>
        </div>

        <Card className="border-2 border-primary/10 bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Área Restrita
            </CardTitle>
            <CardDescription>
              Este conteúdo é exclusivo para assinantes do plano Comercial PRO.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video rounded-lg bg-background border flex items-center justify-center text-muted-foreground">
              Preview do Dashboard
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Atualize seu plano para desbloquear todas as funcionalidades.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
