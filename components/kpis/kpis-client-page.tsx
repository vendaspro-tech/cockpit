'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { KPIsHero } from './kpis-hero'
import { KPIGroupedTable } from './kpi-grouped-table'
import type { KPI, KPICategory } from '@/app/(dashboard)/[workspaceId]/kpis/actions'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const KPI_CATEGORIES: KPICategory[] = [
  'Funil Venda Direta',
  'Funil Sessão Estratégica',
  'Marketing',
  'Financeiro'
]

interface KPIsClientPageProps {
  initialKpis: KPI[]
  workspaceId: string
  userRole: string | null
}

export function KPIsClientPage({ initialKpis, workspaceId, userRole }: KPIsClientPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredKpis = initialKpis.filter(kpi => {
    const matchesSearch = 
      kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || kpi.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        <KPIsHero />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto min-w-0">
          {/* Category Filter */}
          <div className="w-full sm:w-[220px] shrink-0">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Todas categorias" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {KPI_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[320px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar KPI..." 
              className="pl-9 pr-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          

        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <p>Mostrando {filteredKpis.length} KPIs</p>
          {(selectedCategory !== 'all' || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="h-auto p-0 hover:bg-transparent text-primary hover:text-primary/80"
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {KPI_CATEGORIES.map(category => {
            // If specific category selected, only show that one
            if (selectedCategory !== 'all' && category !== selectedCategory) return null

            const categoryKpis = filteredKpis.filter(kpi => kpi.category === category)
            if (categoryKpis.length === 0) return null

            return (
              <KPIGroupedTable 
                key={category}
                category={category}
                kpis={categoryKpis}
                defaultOpen={true}
              />
            )
          })}
        </div>
      </div>
      
      {filteredKpis.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
          <div className="flex flex-col items-center gap-2">
            <Search className="w-10 h-10 opacity-20" />
            <p className="text-lg font-medium">Nenhum KPI encontrado</p>
            <p className="text-sm">Tente ajustar seus filtros ou busca</p>
          </div>
        </div>
      )}
    </div>
  )
}
