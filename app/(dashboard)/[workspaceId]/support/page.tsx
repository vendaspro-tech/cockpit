import { LifeBuoy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="p-3 bg-muted rounded-full">
            <LifeBuoy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Central de Suporte</h1>
        <p className="text-muted-foreground max-w-md">
          Estamos aqui para ajudar. Em breve você poderá conversar com nosso agente de IA especializado.
        </p>
      </div>

      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Precisa de ajuda agora?</CardTitle>
          <CardDescription>
            Entre em contato com nossa equipe via email enquanto finalizamos nosso chat inteligente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button className="w-full" asChild>
                <a href="mailto:support@cockpit.com">Enviar Email</a>
           </Button>
        </CardContent>
      </Card>
    </div>
  )
}
