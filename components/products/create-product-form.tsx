'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'
import { createProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Schema de validação
const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  standard_price: z.string().optional(),
  value_ladder_level: z.string().optional(),
  type: z.string().optional(),
  sales_page_url: z.string().optional(),
  checkout_url: z.string().optional(),
  
  benefits: z.array(z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
  })).optional(),
  
  offers: z.array(z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    price: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  
  objections: z.array(z.object({
    objection: z.string().min(1, 'Objeção é obrigatória'),
    response: z.string().optional(),
  })).optional(),
  
  refusal_reasons: z.array(z.object({
    reason: z.string().min(1, 'Motivo é obrigatório'),
  })).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface CreateProductFormProps {
  workspaceId: string
}

export function CreateProductForm({ workspaceId }: CreateProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      benefits: [],
      offers: [],
      objections: [],
      refusal_reasons: [],
    },
  })

  const { fields: benefitsFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({
    control,
    name: 'benefits',
  })

  const { fields: offersFields, append: appendOffer, remove: removeOffer } = useFieldArray({
    control,
    name: 'offers',
  })

  const { fields: objectionsFields, append: appendObjection, remove: removeObjection } = useFieldArray({
    control,
    name: 'objections',
  })

  const { fields: refusalReasonsFields, append: appendRefusalReason, remove: removeRefusalReason } = useFieldArray({
    control,
    name: 'refusal_reasons',
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true)
      const loadingToast = toast.loading('Criando produto...')
      
      await createProduct(workspaceId, data)
      
      toast.dismiss(loadingToast)
      toast.success('Produto criado com sucesso!')
      
      router.push(`/${workspaceId}/products`)
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast.error('Erro ao criar produto. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Informações Gerais */}
      <div className="space-y-4 bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold">Informações Gerais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Consultoria de Vendas"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="standard_price">Preço Padrão (R$)</Label>
            <Input
              id="standard_price"
              {...register('standard_price')}
              type="number"
              step="0.01"
              placeholder="1500.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="value_ladder_level">Nível na Escada de Valor</Label>
            <Select onValueChange={(value) => setValue('value_ladder_level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Front End">Front End</SelectItem>
                <SelectItem value="Back End">Back End</SelectItem>
                <SelectItem value="High End">High End</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo do Produto</Label>
            <Select onValueChange={(value) => setValue('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Curso">Curso</SelectItem>
                <SelectItem value="Comunidade">Comunidade</SelectItem>
                <SelectItem value="Mentoria">Mentoria</SelectItem>
                <SelectItem value="Consultoria">Consultoria</SelectItem>
                <SelectItem value="Ebook">Ebook</SelectItem>
                <SelectItem value="SaaS">SaaS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descreva o produto..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sales_page_url">URL Página de Vendas</Label>
            <Input
              id="sales_page_url"
              {...register('sales_page_url')}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout_url">URL Checkout</Label>
            <Input
              id="checkout_url"
              {...register('checkout_url')}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Benefícios */}
      <div className="space-y-4 bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Benefícios</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendBenefit({ title: '', description: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Benefício
          </Button>
        </div>

        {benefitsFields.map((field, index) => (
          <div key={field.id} className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Benefício #{index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBenefit(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              {...register(`benefits.${index}.title`)}
              placeholder="Título do benefício"
            />
            {errors.benefits?.[index]?.title && (
              <p className="text-sm text-destructive">{errors.benefits[index]?.title?.message}</p>
            )}
            
            <Textarea
              {...register(`benefits.${index}.description`)}
              placeholder="Descrição (opcional)"
              rows={2}
            />
          </div>
        ))}

        {benefitsFields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum benefício adicionado
          </p>
        )}
      </div>

      {/* Ofertas/Planos */}
      <div className="space-y-4 bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ofertas/Planos</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendOffer({ name: '', price: '', description: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Oferta
          </Button>
        </div>

        {offersFields.map((field, index) => (
          <div key={field.id} className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Oferta #{index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOffer(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              {...register(`offers.${index}.name`)}
              placeholder="Nome da oferta"
            />
            {errors.offers?.[index]?.name && (
              <p className="text-sm text-destructive">{errors.offers[index]?.name?.message}</p>
            )}
            
            <Input
              {...register(`offers.${index}.price`)}
              type="number"
              step="0.01"
              placeholder="Preço (R$)"
            />
            
            <Textarea
              {...register(`offers.${index}.description`)}
              placeholder="Descrição (opcional)"
              rows={2}
            />
          </div>
        ))}

        {offersFields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma oferta adicionada
          </p>
        )}
      </div>

      {/* Objeções */}
      <div className="space-y-4 bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Objeções Comuns</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendObjection({ objection: '', response: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Objeção
          </Button>
        </div>

        {objectionsFields.map((field, index) => (
          <div key={field.id} className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Objeção #{index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeObjection(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              {...register(`objections.${index}.objection`)}
              placeholder="Objeção"
            />
            {errors.objections?.[index]?.objection && (
              <p className="text-sm text-destructive">{errors.objections[index]?.objection?.message}</p>
            )}
            
            <Textarea
              {...register(`objections.${index}.response`)}
              placeholder="Resposta sugerida"
              rows={2}
            />
          </div>
        ))}

        {objectionsFields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma objeção adicionada
          </p>
        )}
      </div>

      {/* Motivos de Perda */}
      <div className="space-y-4 bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Motivos de Perda</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendRefusalReason({ reason: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Motivo
          </Button>
        </div>

        {refusalReasonsFields.map((field, index) => (
          <div key={field.id} className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Motivo #{index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRefusalReason(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              {...register(`refusal_reasons.${index}.reason`)}
              placeholder="Motivo de perda"
            />
            {errors.refusal_reasons?.[index]?.reason && (
              <p className="text-sm text-destructive">{errors.refusal_reasons[index]?.reason?.message}</p>
            )}
          </div>
        ))}

        {refusalReasonsFields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum motivo adicionado
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${workspaceId}/products`)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar Produto'}
        </Button>
      </div>
    </form>
  )
}
