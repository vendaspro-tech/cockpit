'use client'

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message || "Erro ao enviar link. Verifique o e-mail.")
    } else {
      setMessage("Enviamos um link de redefinição para seu e-mail.")
    }

    setIsLoading(false)
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleEmailSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-white">Esqueceu a senha?</h1>
          <p className="text-gray-400 text-sm text-balance">
            Digite seu e-mail para receber o link de recuperação.
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-900/50 p-2 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-900/50 p-2 rounded">
            {message}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email" className="text-gray-300">E-mail</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="seu@email.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#A08D5A] focus:ring-[#A08D5A]/20"
          />
        </Field>
        <Field>
          <Button type="submit" disabled={isLoading} className="w-full bg-[#A08D5A] hover:bg-[#8c7b4d] text-white border-0">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar Link
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
