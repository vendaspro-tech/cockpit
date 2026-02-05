'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Check, 
  ChevronsUpDown, 
  Plus, 
  X, 
  Loader2, 
  Upload, 
  Image as ImageIcon,
  User,
  MapPin,
  Briefcase,
  Target,
  AlertTriangle,
  Heart,
  Zap,
  ShoppingBag,
  BrainCircuit
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createICP, updateICP } from '@/app/actions/icp'
import { uploadICPImage } from '@/app/actions/upload-icp-image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { IcpWithProducts, ProductOption } from '@/lib/types/icp'

const icpSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  image_url: z.string().optional(),
  age_range: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  profession: z.string().optional(),
  income_range: z.string().optional(),
  main_pain: z.string().optional(),
  main_goal: z.string().optional(),
  objections: z.array(z.string()).optional(),
  life_context: z.string().optional(),
  urgency: z.string().optional(),
  product_ids: z.array(z.string()).optional(),
})

type ICPFormData = z.infer<typeof icpSchema>

interface ICPFormProps {
  initialData?: IcpWithProducts | null
  workspaceId: string
  products: ProductOption[]
}

export function ICPForm({ initialData, workspaceId, products }: ICPFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newObjection, setNewObjection] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.image_url || '')

  const form = useForm<ICPFormData>({
    resolver: zodResolver(icpSchema),
    defaultValues: {
      name: initialData?.name || '',
      image_url: initialData?.image_url || '',
      age_range: initialData?.age_range || '',
      gender: initialData?.gender || '',
      location: initialData?.location || '',
      profession: initialData?.profession || '',
      income_range: initialData?.income_range || '',
      main_pain: initialData?.main_pain || '',
      main_goal: initialData?.main_goal || '',
      objections: initialData?.objections || [],
      life_context: initialData?.life_context || '',
      urgency: initialData?.urgency || '',
      product_ids: initialData?.icp_products?.map((p) => p.product_id) || [],
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const onSubmit = async (data: ICPFormData) => {
    try {
      setIsSubmitting(true)
      let imageUrl = data.image_url

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const result = await uploadICPImage(formData)
        
        if (result.error) {
          toast.error(result.error)
          setIsSubmitting(false)
          return
        }
        
        if (result.url) {
          imageUrl = result.url
        }
      }

      const finalData = { ...data, image_url: imageUrl }

      if (initialData) {
        await updateICP(initialData.id, workspaceId, finalData)
        toast.success('ICP atualizado com sucesso!')
      } else {
        await createICP(workspaceId, finalData)
        toast.success('ICP criado com sucesso!')
      }
      router.push(`/${workspaceId}/products?tab=icp`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar ICP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addObjection = () => {
    if (newObjection.trim()) {
      const currentObjections = form.getValues('objections') || []
      form.setValue('objections', [...currentObjections, newObjection.trim()])
      setNewObjection('')
    }
  }

  const removeObjection = (index: number) => {
    const currentObjections = form.getValues('objections') || []
    form.setValue('objections', currentObjections.filter((_, i) => i !== index))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b -mx-6 px-6 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              {initialData ? 'Editar Perfil' : 'Novo Perfil de Cliente Ideal'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Defina as características do seu cliente dos sonhos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/${workspaceId}/products?tab=icp`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Perfil
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Identity & Demographics */}
          <div className="xl:col-span-4 space-y-6 flex flex-col">
            
            {/* Avatar & Name Card */}
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-b from-background to-muted/20">
              <CardContent className="p-6 flex flex-col items-center text-center gap-6">
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "relative w-40 h-40 rounded-full border-4 border-background shadow-xl cursor-pointer overflow-hidden group transition-all hover:scale-105",
                    isDragActive ? "ring-4 ring-primary/20" : "",
                    !previewUrl && "bg-muted flex items-center justify-center"
                  )}
                >
                  <input {...getInputProps()} />
                  {previewUrl ? (
                    <>
                      <img 
                        src={previewUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium">Alterar</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground p-4">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <span className="text-xs text-center leading-tight">Adicionar Foto</span>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Nome do Perfil (ex: Enterprise Buyer)" 
                            className="text-center text-lg font-semibold h-12" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Demographics Card */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-primary" />
                  Demografia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Faixa Etária</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 30-45" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Gênero</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Todos" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Localização</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Ex: São Paulo, SP" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Profissão / Cargo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Ex: Gerente de Marketing" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="income_range"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Faixa de Renda</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: R$ 10k - 15k" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  Produtos Relacionados
                </CardTitle>
                <CardDescription>
                  O que este perfil costuma comprar?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="product_ids"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {field.value?.length
                                ? `${field.value.length} produtos`
                                : "Selecionar produtos"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar..." />
                            <CommandList>
                              <CommandEmpty>Nenhum produto.</CommandEmpty>
                              <CommandGroup>
                                {products.map((product) => (
                                  <CommandItem
                                    value={product.name}
                                    key={product.id}
                                    onSelect={() => {
                                      const current = field.value || []
                                      if (current.includes(product.id)) {
                                        field.onChange(current.filter((id) => id !== product.id))
                                      } else {
                                        field.onChange([...current, product.id])
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(product.id)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {product.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value?.map((productId) => {
                          const product = products.find(p => p.id === productId)
                          return product ? (
                            <Badge key={productId} variant="secondary" className="text-xs">
                              {product.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Psychology & Context */}
          <div className="xl:col-span-8 space-y-6 flex flex-col h-full">
            
            {/* Deep Dive Card */}
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Mergulho Profundo
                </CardTitle>
                <CardDescription>
                  Entenda as motivações, dores e contexto do seu cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 flex-1 flex flex-col">
                
                {/* Context & Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="life_context"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          Momento de Vida / Contexto
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o momento atual da vida ou carreira deste cliente..." 
                            className="min-h-[120px] resize-none bg-muted/30"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Nível de Urgência
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Quão urgente é a solução para ele? O que acontece se não resolver?" 
                            className="min-h-[120px] resize-none bg-muted/30"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Pain & Goal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <FormField
                    control={form.control}
                    name="main_pain"
                    render={({ field }) => (
                      <FormItem className="flex flex-col h-full">
                        <FormLabel className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          Principal Dor (Inferno)
                        </FormLabel>
                        <FormControl className="flex-1">
                          <Textarea 
                            placeholder="O que tira o sono dele? Quais são os maiores medos e frustrações?" 
                            className="min-h-[200px] h-full border-destructive/20 focus-visible:ring-destructive/20 bg-destructive/5 resize-none"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="main_goal"
                    render={({ field }) => (
                      <FormItem className="flex flex-col h-full">
                        <FormLabel className="flex items-center gap-2 text-green-600">
                          <Heart className="w-4 h-4" />
                          Principal Desejo (Céu)
                        </FormLabel>
                        <FormControl className="flex-1">
                          <Textarea 
                            placeholder="O que ele sonha em alcançar? Qual é o cenário ideal?" 
                            className="min-h-[200px] h-full border-green-500/20 focus-visible:ring-green-500/20 bg-green-500/5 resize-none"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Objections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-medium">Objeções Comuns</FormLabel>
                    <span className="text-xs text-muted-foreground">Pressione Enter para adicionar</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      value={newObjection}
                      onChange={(e) => setNewObjection(e.target.value)}
                      placeholder="Digite uma objeção e pressione Enter..."
                      className="max-w-md"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addObjection()
                        }
                      }}
                    />
                    <Button type="button" onClick={addObjection} variant="secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[60px] p-4 rounded-lg border bg-muted/20 border-dashed">
                    {form.watch('objections')?.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm italic">
                        Nenhuma objeção adicionada ainda.
                      </div>
                    )}
                    {form.watch('objections')?.map((obj, index) => (
                      <Badge key={index} variant="outline" className="pl-3 pr-1 py-1 h-8 text-sm bg-background">
                        {obj}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2 hover:bg-destructive/10 hover:text-destructive rounded-full"
                          onClick={() => removeObjection(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
