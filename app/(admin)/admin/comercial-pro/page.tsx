import { redirect } from "next/navigation"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Target, BookOpen, ClipboardList, Video } from "lucide-react"

const modules = [
  {
    title: "Playbook Comercial PRO",
    description: "Guia premium com rituais, cadências e melhores práticas para equipes de alta performance.",
    icon: BookOpen,
  },
  {
    title: "Consultorias & Mentorias",
    description: "Sessões guiadas para calibrar estratégia, ICP e funil. Planeje slots recorrentes e convidados.",
    icon: Sparkles,
  },
  {
    title: "Planos de Ação e OKRs",
    description: "Defina planos trimestrais, metas e owners. Integração com KPIs e tarefas do time.",
    icon: ClipboardList,
  },
  {
    title: "Biblioteca PRO (vídeo + templates)",
    description: "Coleção de vídeos, templates e checklists exclusivos para o plano PRO.",
    icon: Video,
  },
  {
    title: "Avaliações & PDIs avançados",
    description: "Trilhas de desenvolvimento com pesos customizados e alertas automáticos.",
    icon: Target,
  },
]

export default async function AdminComercialProPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) {
    redirect("/")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Plano premium
          </Badge>
          <Badge variant="secondary" className="bg-secondary/20">
            Comercial PRO
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Comercial PRO</h1>
        <p className="text-muted-foreground max-w-2xl">
          Central do plano PRO para habilitar conteúdos, agendar consultorias e acompanhar entregáveis premium.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title} className="border-muted-foreground/10 bg-card/60 backdrop-blur">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <module.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {module.description}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-muted-foreground/20">
        <CardContent className="p-4 flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Precisa de algo específico aqui (ex.: upload de conteúdos, checklist de entregas, agenda fixa de lives)?
          </p>
          <p className="text-sm text-muted-foreground">
            Me diga o fluxo desejado que eu integro nesta tela e adiciono links para as páginas existentes do Comercial PRO.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
