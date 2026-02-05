'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createKPI, updateKPI, type KPI, type KPICategory } from '@/app/(dashboard)/[workspaceId]/kpis/actions'
import { useState } from 'react'
import { toast } from 'sonner'

const CATEGORIES: KPICategory[] = [
  'Funil Venda Direta',
  'Funil Sessão Estratégica', 
  'Marketing',
  'Financeiro'
]

interface KPIFormDialogProps {
  mode: 'create' | 'edit'
  kpi?: KPI
  children: React.ReactNode
}

export function KPIFormDialog({ mode, kpi, children }: KPIFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    
    try {
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as KPICategory,
        benchmark: formData.get('benchmark') as string,
        formula: formData.get('formula') as string,
        display_order: parseInt(formData.get('display_order') as string) || 0,
        is_active: true
      }
      
      if (mode === 'create') {
        const { error } = await createKPI(data)
        if (error) throw new Error(error)
        toast.success('KPI criado com sucesso!')
      } else {
        if (!kpi) throw new Error('KPI não encontrado')
        const { error } = await updateKPI(kpi.id, data)
        if (error) throw new Error(error)
        toast.success('KPI atualizado com sucesso!')
      }
      
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar KPI')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo KPI' : 'Editar KPI'}
          </DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do KPI</Label>
              <Input id="name" name="name" defaultValue={kpi?.name} required placeholder="Ex: SQL's" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select name="category" defaultValue={kpi?.category} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" defaultValue={kpi?.description} required placeholder="Ex: Leads qualificados para vendas" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="benchmark">Benchmark</Label>
              <Input id="benchmark" name="benchmark" defaultValue={kpi?.benchmark} required placeholder="Ex: até 20/dia" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input type="number" id="display_order" name="display_order" defaultValue={kpi?.display_order || 0} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="formula">Fórmula de Cálculo</Label>
            <Textarea id="formula" name="formula" defaultValue={kpi?.formula} required placeholder="Ex: (Número de Vendas / Leads) * 100" />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
