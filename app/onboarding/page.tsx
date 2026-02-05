'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogOut } from "lucide-react"
import { createWorkspace } from "@/app/actions/workspace"
import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoaded(true)
      setUserId(data.session?.user.id || null)
    })
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const result = await createWorkspace(name, token || undefined)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.workspaceId) {
        router.push(`/${result.workspaceId}/overview`)
      }
    } catch (err) {
      console.error(err)
      setError("Ocorreu um erro inesperado. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#A08D5A]" />
      </div>
    )
  }

  if (!userId) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#A08D5A] to-[#7a6b43] mb-6">
            <span className="text-2xl font-bold">C</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Cockpit! 🚀</h1>
          <p className="mt-2 text-gray-400">
            Para começar, vamos criar o espaço de trabalho da sua empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-200">Nome da Empresa</Label>
            <Input
              id="name"
              placeholder="Ex: Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-[#A08D5A] focus:ring-[#A08D5A]/20 h-12"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center space-y-3">
              <p>{error}</p>
              {error.includes("Não autorizado") && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push("/login")
                  }}
                  className="w-full border-red-500/30 hover:bg-red-500/10 text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair e Entrar Novamente
                </Button>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || !name.trim()} 
            className="w-full h-12 bg-[#A08D5A] hover:bg-[#8c7b4d] text-white font-medium text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Workspace"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
