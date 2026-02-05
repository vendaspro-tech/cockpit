import React, { useState, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type PDIItem } from "@/lib/types/pdi"
import { ChevronDown, ChevronRight } from "lucide-react"
import { TableEmptyState } from "@/components/shared"

interface PDIOverviewTableProps {
  items: PDIItem[]
  filterSelfScore: string
  filterManagerScore: string
  showGapsOnly: boolean
}

export function PDIOverviewTable({ 
  items,
  filterSelfScore,
  filterManagerScore,
  showGapsOnly
}: PDIOverviewTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [columnWidths, setColumnWidths] = useState({
    competence: 400,
    self: 120,
    manager: 120,
    gap: 150
  })
  const resizingRef = useRef<{ col: keyof typeof columnWidths, startX: number, startWidth: number } | null>(null)

  // Filter logic moved to parent or applied here based on props
  const filteredItems = items.filter(item => {
    // Filter by Self Score
    if (filterSelfScore !== 'all' && item.current_score_self !== parseInt(filterSelfScore)) {
      return false
    }

    // Filter by Manager Score
    if (filterManagerScore !== 'all' && item.current_score_manager !== parseInt(filterManagerScore)) {
      return false
    }

    // Filter by Gap
    if (showGapsOnly) {
      const gap = Math.abs((item.current_score_self || 0) - (item.current_score_manager || 0))
      if (gap === 0) return false
    }

    return true
  })

  // Group items by category preserving order
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category_name || 'Sem Categoria'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  // Initialize expanded state for new categories (default expanded)
  const isExpanded = (category: string) => {
    return expandedCategories[category] !== false // Default to true
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !isExpanded(category)
    }))
  }

  const calculateAverage = (items: PDIItem[], type: 'self' | 'manager') => {
    const sum = items.reduce((acc, item) => {
      return acc + (type === 'self' ? (item.current_score_self || 0) : (item.current_score_manager || 0))
    }, 0)
    return items.length > 0 ? (sum / items.length).toFixed(1) : '0.0'
  }

  const getGapIndicator = (self: number, manager: number) => {
    const diff = Number((self - manager).toFixed(1))
    if (diff === 0) return <Badge variant="outline" className="bg-muted text-muted-foreground border-border w-full justify-center">Sem Gap</Badge>
    if (diff > 0) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 w-full justify-center">Auto +{diff}</Badge>
    return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 w-full justify-center">Gestor +{Math.abs(diff)}</Badge>
  }

  const getScoreBadge = (score: number) => {
    if (score >= 3) return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 w-8 justify-center">{score}</Badge>
    if (score === 2) return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 w-8 justify-center">{score}</Badge>
    return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 w-8 justify-center">{score}</Badge>
  }

  // Resizing Logic
  const startResize = (e: React.MouseEvent, col: keyof typeof columnWidths) => {
    e.preventDefault()
    resizingRef.current = {
      col,
      startX: e.clientX,
      startWidth: columnWidths[col]
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return
    const { col, startX, startWidth } = resizingRef.current
    const diff = e.clientX - startX
    setColumnWidths(prev => ({
      ...prev,
      [col]: Math.max(50, startWidth + diff)
    }))
  }

  const handleMouseUp = () => {
    resizingRef.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Calculate Overall Totals
  const totalSelfAvg = parseFloat(calculateAverage(filteredItems, 'self'))
  const totalManagerAvg = parseFloat(calculateAverage(filteredItems, 'manager'))

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table style={{ width: 'max-content', minWidth: '100%' }}>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead style={{ width: columnWidths.competence }} className="relative border-r">
                  Competência
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'competence')}
                  />
                </TableHead>
                <TableHead style={{ width: columnWidths.self }} className="text-center relative border-r">
                  Autoavaliação
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'self')}
                  />
                </TableHead>
                <TableHead style={{ width: columnWidths.manager }} className="text-center relative border-r">
                  Gestor
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'manager')}
                  />
                </TableHead>
                <TableHead style={{ width: columnWidths.gap }} className="text-center relative">
                  Gap
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'gap')}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                <>
                  {Object.entries(groupedItems).map(([category, categoryItems]) => {
                    const avgSelf = parseFloat(calculateAverage(categoryItems, 'self'))
                    const avgManager = parseFloat(calculateAverage(categoryItems, 'manager'))
                    const expanded = isExpanded(category)

                    return (
                      <React.Fragment key={category}>
                        <TableRow 
                          className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleCategory(category)}
                        >
                          <TableCell className="font-semibold text-primary py-3 flex items-center gap-2 border-r">
                            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {category}
                            <Badge variant="secondary" className="ml-2 text-[10px] px-1 h-4 min-w-4 justify-center">
                              {categoryItems.length}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-muted-foreground border-r">
                            {avgSelf.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-muted-foreground border-r">
                            {avgManager.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getGapIndicator(avgSelf, avgManager)}
                          </TableCell>
                        </TableRow>
                        
                        {expanded && categoryItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium pl-10 border-r">
                              <span className="text-muted-foreground mr-1">{index + 1}.</span>
                              {item.criterion}
                            </TableCell>
                            <TableCell className="text-center border-r">
                              {getScoreBadge(item.current_score_self || 0)}
                            </TableCell>
                            <TableCell className="text-center border-r">
                              {getScoreBadge(item.current_score_manager || 0)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getGapIndicator(item.current_score_self || 0, item.current_score_manager || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    )
                  })}
                  
                  {/* Result Row */}
                  <TableRow className="bg-primary/5 border-t-2 border-primary/20 font-bold hover:bg-primary/10">
                    <TableCell className="text-primary border-r">
                      RESULTADO GERAL
                    </TableCell>
                    <TableCell className="text-center text-primary border-r">
                      {totalSelfAvg.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center text-primary border-r">
                      {totalManagerAvg.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getGapIndicator(totalSelfAvg, totalManagerAvg)}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableEmptyState 
                  colSpan={4} 
                  message="Nenhum item encontrado com os filtros selecionados." 
                />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-right">
        Mostrando {filteredItems.length} de {items.length} itens
      </div>
    </div>
  )
}
