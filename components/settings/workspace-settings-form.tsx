'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Loader2, Save, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from '@/hooks/use-toast'
import { updateWorkspace, uploadWorkspaceLogo } from '@/app/actions/workspace'
import Image from 'next/image'

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  currency: z.string(),
  timezone: z.string()
})

type FormData = z.infer<typeof formSchema>

interface WorkspaceSettingsFormProps {
  workspaceId: string
  initialData: {
    name: string
    slug?: string | null
    logo_url?: string | null
    currency?: string | null
    timezone?: string | null
  }
}

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Lisbon', label: 'Lisbon (GMT+0)' },
]

export function WorkspaceSettingsForm({ workspaceId, initialData }: WorkspaceSettingsFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logo_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      slug: initialData.slug || '',
      currency: initialData.currency || 'BRL',
      timezone: initialData.timezone || 'America/Sao_Paulo'
    }
  })

  async function onSubmit(data: FormData) {
    setIsPending(true)
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('slug', data.slug)
    formData.append('currency', data.currency)
    formData.append('timezone', data.timezone)

    const result = await updateWorkspace(workspaceId, formData)
    setIsPending(false)

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso",
      })
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadWorkspaceLogo(workspaceId, formData)
    setIsUploading(false)

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setLogoPreview(result.url || null)
      toast({
        title: "Sucesso",
        description: "Logo atualizada com sucesso",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Identidade do Workspace
          </CardTitle>
          <CardDescription>
            Personalize como sua empresa aparece no Cockpit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Logo Upload */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/5 group hover:border-primary/50 transition-colors">
              {logoPreview ? (
                <Image 
                  src={logoPreview} 
                  alt="Workspace Logo" 
                  fill 
                  className="object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground/50" />
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Logo da Empresa</h4>
              <p className="text-xs text-muted-foreground">
                Recomendado: 512x512px (PNG ou JPG)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleLogoUpload}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar imagem
              </Button>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Workspace</Label>
                <Input 
                  id="name" 
                  {...form.register('name')} 
                  disabled={isPending}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL do Workspace (Slug)</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    app.cockpit.com/
                  </span>
                  <Input 
                    id="slug" 
                    className="rounded-l-none"
                    {...form.register('slug')} 
                    disabled={isPending}
                  />
                </div>
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moeda Padrão</Label>
                <Select 
                  onValueChange={(value) => form.setValue('currency', value)}
                  defaultValue={form.getValues('currency')}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select 
                  onValueChange={(value) => form.setValue('timezone', value)}
                  defaultValue={form.getValues('timezone')}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <DangerZone workspaceId={workspaceId} workspaceName={initialData.name} />
    </div>
  )
}

import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteWorkspace } from '@/app/actions/workspace'
import { useRouter } from 'next/navigation'

function DangerZone({ workspaceId, workspaceName }: { workspaceId: string, workspaceName: string }) {
  const [deleteName, setDeleteName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    if (deleteName !== workspaceName) return

    setIsDeleting(true)
    const result = await deleteWorkspace(workspaceId)
    
    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
      setIsDeleting(false)
    } else {
      toast({
        title: "Workspace excluído",
        description: "Você será redirecionado...",
      })
      router.push('/')
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações irreversíveis que afetam todo o workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5 border-destructive/20">
          <div className="space-y-1">
            <h4 className="font-medium text-destructive">Excluir Workspace</h4>
            <p className="text-sm text-muted-foreground">
              Isso excluirá permanentemente todos os dados, avaliações e membros.
            </p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o workspace
                    <strong> {workspaceName} </strong> e removerá todos os dados associados.
                  </p>
                  <div className="space-y-2">
                    <Label>Digite o nome do workspace para confirmar:</Label>
                    <Input 
                      value={deleteName}
                      onChange={(e) => setDeleteName(e.target.value)}
                      placeholder={workspaceName}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={deleteName !== workspaceName || isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? "Excluindo..." : "Excluir Workspace"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
