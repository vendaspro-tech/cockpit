import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createAssessment } from "@/app/actions/assessments"
import { BrainCircuit, Target, Users, BarChart } from "lucide-react"

interface DiscIntroPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function DiscIntroPage({ params }: DiscIntroPageProps) {
  const { workspaceId } = await params

  const startAssessment = async () => {
    "use server"
    await createAssessment(workspaceId, 'disc')
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-130px)] flex items-center justify-center p-4">
      <div className="grid md:grid-cols-12 gap-8 w-full items-center">
        {/* Left Column: Content & Action */}
        <div className="md:col-span-5 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Perfil Comportamental DISC
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Descubra seu estilo de comunicação, pontos fortes e áreas de desenvolvimento no contexto comercial.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Instruções Rápidas
            </h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                São 24 questões situacionais
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Ordene as 4 opções (4 = Mais você, 1 = Menos você)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Não existe perfil &quot;certo&quot; ou &quot;errado&quot;
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Tempo estimado: 10-15 minutos
              </li>
            </ul>
          </div>

          <form action={startAssessment}>
            <Button size="lg" className="w-full md:w-auto text-base px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all">
              Iniciar Avaliação DISC
            </Button>
          </form>
        </div>

        {/* Right Column: Value Props Grid */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          <Card className="bg-card/50 hover:bg-card transition-colors border-primary/10 shadow-sm">
            <CardHeader className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Autoconhecimento</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Entenda como você toma decisões e lida com desafios.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 hover:bg-card transition-colors border-primary/10 shadow-sm">
            <CardHeader className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Performance</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Identifique suas funções naturais (Hunter, Closer, Farmer).
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 hover:bg-card transition-colors border-primary/10 shadow-sm">
            <CardHeader className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Relacionamento</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Adapte sua comunicação para cada tipo de cliente.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 hover:bg-card transition-colors border-primary/10 shadow-sm">
            <CardHeader className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                <BarChart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">Plano de Ação</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Recomendações práticas para desenvolver skills.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
