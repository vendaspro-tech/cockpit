'use client'

import { useState } from "react"
import { PDIItemCard } from "./pdi-item-card"
import { PDIOverviewTable } from "./pdi-overview-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { type PDIPlanWithItems } from "@/lib/types/pdi"
import { Filter, FileText, LayoutGrid, Table2 } from "lucide-react"

interface PDIPlanViewProps {
  pdi: PDIPlanWithItems
}

export function PDIPlanView({ pdi }: PDIPlanViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSelfScore, setFilterSelfScore] = useState<string>('all')
  const [filterManagerScore, setFilterManagerScore] = useState<string>('all')
  const [showGapsOnly, setShowGapsOnly] = useState(false)

  // Group items by category preserving order
  const categories = pdi.items.reduce((acc, item) => {
    const existingCat = acc.find(c => c.id === item.category_id)
    if (existingCat) {
      existingCat.items.push(item)
    } else {
      acc.push({
        id: item.category_id,
        name: item.category_name,
        items: [item]
      })
    }
    return acc
  }, [] as { id: string, name: string, items: typeof pdi.items }[])

  // Helper to filter items by all criteria
  const filterItems = (items: typeof pdi.items) => {
    return items.filter(item => {
      // Status Filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false

      // Self Score Filter
      if (filterSelfScore !== 'all' && item.current_score_self !== parseInt(filterSelfScore)) return false

      // Manager Score Filter
      if (filterManagerScore !== 'all' && item.current_score_manager !== parseInt(filterManagerScore)) return false

      // Gap Filter
      if (showGapsOnly) {
        const gap = Math.abs((item.current_score_self || 0) - (item.current_score_manager || 0))
        if (gap === 0) return false
      }

      return true
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            Competências
          </h2>
        </div>

        {/* Global Filters Area */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] h-8 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="not_started">Não Iniciado</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

          {/* Score Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Nota Auto:</span>
            <Select value={filterSelfScore} onValueChange={setFilterSelfScore}>
              <SelectTrigger className="w-[100px] h-8 bg-background">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Nota Gestor:</span>
            <Select value={filterManagerScore} onValueChange={setFilterManagerScore}>
              <SelectTrigger className="w-[100px] h-8 bg-background">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Switch 
              id="gap-mode" 
              checked={showGapsOnly}
              onCheckedChange={setShowGapsOnly}
            />
            <Label htmlFor="gap-mode" className="text-sm cursor-pointer">Apenas com Gaps</Label>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1 bg-muted/50 gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background gap-2">
            <Table2 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="data-[state=active]:bg-background">
              {category.name}
              <Badge variant="secondary" className="ml-2 text-[10px] px-1 h-4 min-w-4 justify-center">
                {filterItems(category.items).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab - Table View */}
        <TabsContent value="overview" className="mt-6">
          <PDIOverviewTable 
            items={filterItems(pdi.items)} 
            filterSelfScore={filterSelfScore}
            filterManagerScore={filterManagerScore}
            showGapsOnly={showGapsOnly}
          />
        </TabsContent>

        {/* Individual Category Tabs */}
        {categories.map((category) => {
          const visibleItems = filterItems(category.items)
          
          return (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="space-y-4">
                {/* Header removed as per user request */}

                {visibleItems.length > 0 ? (
                  <div className="grid gap-4">
                    {visibleItems.map((item, index) => (
                      <PDIItemCard key={item.id} item={item} index={index + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <p>Nenhum item encontrado com os filtros selecionados.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
