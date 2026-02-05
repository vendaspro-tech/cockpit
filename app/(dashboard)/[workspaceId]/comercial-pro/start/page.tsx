import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, PlayCircle } from "lucide-react"
import Link from "next/link"

interface StartPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function StartPage({ params }: StartPageProps) {
  const { workspaceId } = await params

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Comercial PRO</h1>
        <p className="text-muted-foreground">
          Sua central de alta performance comercial. Comece por aqui para configurar sua jornada.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assista ao vídeo de introdução e entenda como extrair o máximo do Comercial PRO.
            </p>
            <Button variant="ghost" className="w-full justify-between group-hover:translate-x-1 transition-transform">
              Assistir agora <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Link href={`/${workspaceId}/comercial-pro/action-plans`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer group h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                Planos de Ação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Defina e acompanhe seus planos de ação estratégicos.
              </p>
              <Button variant="ghost" className="w-full justify-between group-hover:translate-x-1 transition-transform">
                Acessar Planos <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${workspaceId}/comercial-pro/consultancies`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer group h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                Consultorias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Agende e revise suas consultorias com nossos especialistas.
              </p>
              <Button variant="ghost" className="w-full justify-between group-hover:translate-x-1 transition-transform">
                Ver Consultorias <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
