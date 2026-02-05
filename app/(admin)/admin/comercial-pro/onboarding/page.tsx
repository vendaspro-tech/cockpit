import { redirect } from "next/navigation"
import { isSystemOwner } from "@/lib/auth-utils"
import { getAuthUser } from "@/lib/auth-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, PlayCircle, Users } from "lucide-react"

const tracks = [
  {
    title: "Onboarding do Time Comercial",
    description: "Sequência de módulos para ramp-up rápido, com checkpoints e quizzes.",
    icon: Users,
  },
  {
    title: "Playbook Interativo",
    description: "Materiais de vídeo e texto com exemplos práticos e scripts.",
    icon: PlayCircle,
  },
  {
    title: "Guia de Produtos/ICP",
    description: "Contexto de ICPs, personas, objeções e cases priorizados.",
    icon: BookOpen,
  },
]

export default async function AdminComercialProOnboardingPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) redirect("/")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
          Comercial PRO
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground max-w-2xl">
          Estruture trilhas de onboarding, vídeos e materiais exclusivos do plano PRO.
        </p>
      </div>

      <Card className="border-muted-foreground/10">
        <CardHeader>
          <CardTitle>Trilhas sugeridas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {tracks.map((track) => (
            <div key={track.title} className="rounded-lg border border-muted-foreground/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <track.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{track.title}</span>
              </div>
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground">{track.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed border-muted-foreground/20">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Quer conectar esta área aos conteúdos já existentes ou a um LMS externo? Posso adicionar integrações e upload de materiais.
        </CardContent>
      </Card>
    </div>
  )
}
