'use client'

import { useMemo, useState } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const supabase = useMemo(() => createClient(), [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message || 'Nao foi possivel redefinir sua senha.')
      setIsLoading(false)
      return
    }

    setMessage('Senha redefinida com sucesso. Voce ja pode entrar com a nova senha.')
    setPassword('')
    setConfirmPassword('')
    setIsLoading(false)
  }

  return (
    <form className={cn('flex flex-col gap-6', className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-white">Redefinir senha</h1>
          <p className="text-gray-400 text-sm text-balance">
            Digite sua nova senha para concluir a recuperacao.
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
          <FieldLabel htmlFor="new-password" className="text-gray-300">
            Nova senha
          </FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#A08D5A] focus:ring-[#A08D5A]/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password" className="text-gray-300">
            Confirmar nova senha
          </FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#A08D5A] focus:ring-[#A08D5A]/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading} className="w-full bg-[#A08D5A] hover:bg-[#8c7b4d] text-white border-0">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar nova senha
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
