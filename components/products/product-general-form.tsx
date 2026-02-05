'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProduct } from '@/app/actions/products'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar Alterações'}
    </Button>
  )
}

interface ProductGeneralFormProps {
  product: any // Replace with proper type
  workspaceId: string
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ProductGeneralForm({ product, workspaceId }: ProductGeneralFormProps) {
  return (
    <form 
      action={async (formData) => {
        try {
          await updateProduct(product.id, workspaceId, {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            standard_price: formData.get('standard_price') as string,
            value_ladder_level: formData.get('value_ladder_level') as string,
            type: formData.get('type') as string,
            sales_page_url: formData.get('sales_page_url') as string,
            checkout_url: formData.get('checkout_url') as string,
          })
          toast.success('Produto atualizado com sucesso!')
        } catch (error) {
          console.error('Erro ao atualizar produto:', error)
          toast.error('Erro ao atualizar produto')
        }
      }} 
      className="space-y-6 w-full"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      
      {/* Linha 1 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="name">Nome do Produto</Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={product.name}
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="standard_price">Preço Padrão (R$)</Label>
          <Input 
            id="standard_price" 
            name="standard_price" 
            type="number" 
            step="0.01"
            defaultValue={product.standard_price || ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sales_page_url">URL Página de Vendas</Label>
          <Input 
            id="sales_page_url" 
            name="sales_page_url" 
            defaultValue={product.sales_page_url || ''}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value_ladder_level">Nível na Escada de Valor</Label>
          <Select name="value_ladder_level" defaultValue={product.value_ladder_level || ''}>
            <SelectTrigger className="h-10 w-full">
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
          <Select name="type" defaultValue={product.type || ''}>
            <SelectTrigger className="h-10 w-full">
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

        <div className="space-y-2">
          <Label htmlFor="checkout_url">URL Checkout</Label>
          <Input 
            id="checkout_url" 
            name="checkout_url" 
            defaultValue={product.checkout_url || ''}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Linha 3 */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={product.description || ''}
          rows={5}
          className="min-h-[140px]"
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
