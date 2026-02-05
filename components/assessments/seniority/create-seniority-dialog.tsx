'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Plus, CalendarIcon } from 'lucide-react'
import { createSeniorityAssessment } from '@/app/actions/seniority-assessments'
import { toast } from 'sonner'
import type { CompetencyFramework } from '@/lib/types/competency'
import { format, addDays, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface User {
  id: string
  full_name: string | null
  email: string
  job_title?: {
    id: string
    name: string
    hierarchy_level: number
  }
}

interface CreateSeniorityDialogProps {
  workspaceId: string
  currentUser: User
  workspaceUsers: User[]
  competencyFrameworks: CompetencyFramework[]
  trigger?: React.ReactNode
}

export function CreateSeniorityDialog({
  workspaceId,
  currentUser,
  workspaceUsers,
  competencyFrameworks,
  trigger,
}: CreateSeniorityDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [assessmentType, setAssessmentType] = useState<'self' | 'leader'>('self')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter users based on assessment type
  const availableUsers = assessmentType === 'self'
    ? [currentUser]
    : workspaceUsers.filter(u => {
        // Leaders can only evaluate subordinates (based on hierarchy)
        if (!u.job_title || !currentUser.job_title) return false
        return currentUser.job_title.hierarchy_level < u.job_title.hierarchy_level
      })

  // Get job title for selected user
  const selectedUser = availableUsers.find(u => u.id === selectedUserId)
  const selectedJobTitle = selectedUser?.job_title

  // Filter frameworks for selected job title
  const availableFrameworks = selectedJobTitle
    ? competencyFrameworks.filter(f => f.job_title_id === selectedJobTitle.id && f.is_active)
    : []

  // Calculate recommended next assessment date (starts immediately after current ends for quarterly cycle)
  const recommendedNextAssessment = endDate ? addDays(endDate, 1) : null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedUserId) {
      newErrors.user = 'Selecione quem será avaliado'
    }

    if (!selectedFrameworkId) {
      newErrors.framework = 'Selecione um framework de competências'
    }

    if (!startDate) {
      newErrors.startDate = 'Selecione a data de início'
    }

    if (!endDate) {
      newErrors.endDate = 'Selecione a data de término'
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = 'A data de término deve ser posterior à data de início'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) return

    setIsCreating(true)

    try {
      // Format period as "MMM/yyyy - MMM/yyyy"
      const assessmentPeriod = `${format(startDate!, 'MMM/yyyy', { locale: ptBR })} - ${format(endDate!, 'MMM/yyyy', { locale: ptBR })}`

      const result = await createSeniorityAssessment({
        workspace_id: workspaceId,
        evaluated_user_id: selectedUserId,
        job_title_id: selectedJobTitle!.id,
        competency_framework_id: selectedFrameworkId,
        assessment_type: assessmentType,
        assessment_period: assessmentPeriod,
      })

      if (result.success) {
        toast.success('Avaliação criada com sucesso!')
        setOpen(false)

        // Redirect to assessment form
        router.push(`/${workspaceId}/assessments/seniority-v2/${result.data.id}`)
      }
    } catch (error: any) {
      console.error('Error creating assessment:', error)
      toast.error(error.message || 'Erro ao criar avaliação')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setAssessmentType('self')
    setSelectedUserId('')
    setSelectedFrameworkId('')
    setStartDate(undefined)
    setEndDate(undefined)
    setErrors({})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaliação de Senioridade
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Avaliação de Senioridade</DialogTitle>
          <DialogDescription>
            Crie uma nova avaliação baseada em matriz de competências (Comportamental + Técnica DEF + Processos)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Assessment Type */}
          <div className="space-y-3">
            <Label>Tipo de Avaliação</Label>
            <RadioGroup
              value={assessmentType}
              onValueChange={(value) => {
                setAssessmentType(value as 'self' | 'leader')
                setSelectedUserId('') // Reset user selection
                setErrors({})
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self" id="self" />
                <Label htmlFor="self" className="font-normal cursor-pointer">
                  Auto-avaliação
                  <p className="text-sm text-muted-foreground">Você avalia suas próprias competências</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leader" id="leader" />
                <Label htmlFor="leader" className="font-normal cursor-pointer">
                  Avaliação de Subordinado
                  <p className="text-sm text-muted-foreground">Você avalia um membro da sua equipe</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Select User */}
          <div className="space-y-2">
            <Label htmlFor="user">
              {assessmentType === 'self' ? 'Avaliado' : 'Selecione o Colaborador'}
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => {
                setSelectedUserId(value)
                setSelectedFrameworkId('') // Reset framework when user changes
                setErrors(prev => ({ ...prev, user: '' }))
              }}
            >
              <SelectTrigger id="user" className={errors.user ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.full_name || user.email}</span>
                      {user.job_title && (
                        <span className="text-xs text-muted-foreground">
                          {user.job_title.name}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.user && (
              <p className="text-sm text-destructive">{errors.user}</p>
            )}
          </div>

          {/* Info about selected user's job title */}
          {selectedUser && !selectedJobTitle && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este usuário não possui cargo definido. É necessário atribuir um cargo antes de criar uma avaliação.
              </AlertDescription>
            </Alert>
          )}

          {/* Select Competency Framework */}
          {selectedJobTitle && (
            <div className="space-y-2">
              <Label htmlFor="framework">Framework de Competências</Label>
              <Select
                value={selectedFrameworkId}
                onValueChange={(value) => {
                  setSelectedFrameworkId(value)
                  setErrors(prev => ({ ...prev, framework: '' }))
                }}
              >
                <SelectTrigger id="framework" className={errors.framework ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o framework..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFrameworks.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum framework disponível para {selectedJobTitle.name}
                    </div>
                  ) : (
                    availableFrameworks.map((framework) => (
                      <SelectItem key={framework.id} value={framework.id}>
                        {framework.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.framework && (
                <p className="text-sm text-destructive">{errors.framework}</p>
              )}
              {availableFrameworks.length === 0 && selectedJobTitle && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não há frameworks de competências ativos para o cargo &quot;{selectedJobTitle.name}&quot;.
                    Entre em contato com o administrador.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Select Period */}
          <div className="space-y-3">
            <div>
              <Label>Período da Avaliação</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Recomendamos um período de 3 meses para validade da avaliação
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm text-muted-foreground">
                  Data de Início
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground',
                        errors.startDate && 'border-destructive'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        setErrors(prev => ({ ...prev, startDate: '' }))
                        // Auto-set end date to 3 months ahead if not set
                        if (date && !endDate) {
                          setEndDate(addMonths(date, 3))
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm text-muted-foreground">
                  Data de Término
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground',
                        errors.endDate && 'border-destructive'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date)
                        setErrors(prev => ({ ...prev, endDate: '' }))
                      }}
                      disabled={(date) => startDate ? date <= startDate : false}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-xs text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Recommendation for next assessment */}
            {recommendedNextAssessment && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Recomendação:</strong> Próxima reavaliação em{' '}
                  {format(recommendedNextAssessment, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {' '}(avaliações trimestrais contínuas)
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !selectedJobTitle || availableFrameworks.length === 0}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Avaliação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
