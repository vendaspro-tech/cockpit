'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { UserSelect } from '@/components/ui/user-select'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  full_name: string | null
  email: string
}

interface AssessmentConfigFormProps {
  users: User[]
  testTitle: string
  onSubmit: (formData: FormData) => Promise<void>
}

export function AssessmentConfigForm({ users, testTitle, onSubmit }: AssessmentConfigFormProps) {
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [mode, setMode] = useState<'self' | 'manager'>('manager')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData()
    formData.append('evaluatedId', selectedUser)
    formData.append('mode', mode)
    
    await onSubmit(formData)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Seleção de Usuário */}
        <div className="space-y-4">
          <Label className="text-base">Quem será avaliado?</Label>
          <UserSelect 
            users={users} 
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Selecione o colaborador..."
          />
          <p className="text-sm text-gray-500">
            Selecione o membro do time que passará por esta avaliação.
          </p>
        </div>

        {/* Modo de Avaliação */}
        <div className="space-y-4">
          <Label className="text-base">Tipo de Avaliação</Label>
          <RadioGroup 
            defaultValue="manager" 
            value={mode} 
            onValueChange={(v) => setMode(v as 'self' | 'manager')}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="manager" id="manager" className="peer sr-only" />
              <Label
                htmlFor="manager"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="mb-2 text-lg font-semibold">Avaliação do Gestor</span>
                <span className="text-center text-sm text-gray-500">
                  Você (Gestor) avaliará o colaborador.
                </span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem value="self" id="self" className="peer sr-only" />
              <Label
                htmlFor="self"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="mb-2 text-lg font-semibold">Autoavaliação</span>
                <span className="text-center text-sm text-gray-500">
                  O colaborador avaliará a si mesmo.
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={!selectedUser || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando Avaliação...
            </>
          ) : (
            'Iniciar Avaliação'
          )}
        </Button>
      </form>
    </Card>
  )
}
