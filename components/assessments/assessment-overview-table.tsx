import { useState, useRef, Fragment } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { TableEmptyState } from "@/components/shared"

interface AssessmentItem {
  id: string
  criterion: string
  score: number
  managerScore?: number
  maxScore: number
  category?: string
  weight?: number
}

interface AssessmentOverviewTableProps {
  items: AssessmentItem[]
  maxScore?: number
}

export function AssessmentOverviewTable({ 
  items,
  maxScore = 100
}: AssessmentOverviewTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [columnWidths, setColumnWidths] = useState({
    competence: 400,
    score: 150,
    managerScore: 150,
    status: 150
  })
  const resizingRef = useRef<{ col: keyof typeof columnWidths, startX: number, startWidth: number } | null>(null)

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Geral'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  // Initialize expanded state (default expanded)
  const isExpanded = (category: string) => {
    return expandedCategories[category] !== false
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !isExpanded(category)
    }))
  }

  const calculateAverage = (items: AssessmentItem[], type: 'self' | 'manager' = 'self') => {
    const validItems = type === 'manager' 
      ? items.filter(i => i.managerScore !== undefined)
      : items

    if (validItems.length === 0) return "0.0"

    const totalPercentage = validItems.reduce((acc, item) => {
      const score = type === 'manager' ? (item.managerScore || 0) : item.score
      const itemMax = item.maxScore || maxScore
      const percentage = (score / itemMax) * 100
      return acc + percentage
    }, 0)
    return (totalPercentage / validItems.length).toFixed(1)
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreBadge = (score: number, max: number) => {
    const percentage = (score / max) * 100
    let className = ""
    
    if (percentage >= 70) {
      className = "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
    } else if (percentage >= 50) {
      className = "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
    } else {
      className = "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
    }

    return (
      <Badge variant="outline" className={`${className} justify-center min-w-[60px]`}>
        {parseFloat(score.toFixed(1))} / {max}
      </Badge>
    )
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

  // Calculate Overall Average
  const overallAverage = calculateAverage(items, 'self')
  const overallManagerAverage = calculateAverage(items, 'manager')
  const hasManagerScores = items.some(i => i.managerScore !== undefined)

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table style={{ width: 'max-content', minWidth: '100%' }}>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead style={{ width: columnWidths.competence }} className="relative border-r border-border text-muted-foreground font-medium">
                  Competência / Categoria
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'competence')}
                  />
                </TableHead>
                <TableHead style={{ width: columnWidths.score }} className="text-center relative border-r border-border text-muted-foreground font-medium">
                  Autoavaliação
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'score')}
                  />
                </TableHead>
                {hasManagerScores && (
                  <TableHead style={{ width: columnWidths.managerScore }} className="text-center relative border-r border-border text-muted-foreground font-medium">
                    Gestor
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                      onMouseDown={(e) => startResize(e, 'managerScore')}
                    />
                  </TableHead>
                )}
                <TableHead style={{ width: columnWidths.status }} className="text-center relative text-muted-foreground font-medium">
                  Status
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'status')}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                <>
                  {Object.entries(groupedItems).map(([category, categoryItems]) => {
                    const avgScore = parseFloat(calculateAverage(categoryItems, 'self'))
                    const avgManagerScore = parseFloat(calculateAverage(categoryItems, 'manager'))
                    const expanded = isExpanded(category)
                    const isGeneral = category === 'Geral' && Object.keys(groupedItems).length === 1

                    return (
                      <Fragment key={category}>
                        {!isGeneral && (
                          <TableRow 
                            className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border"
                            onClick={() => toggleCategory(category)}
                          >
                            <TableCell className="font-semibold text-primary py-3 flex items-center gap-2 border-r border-border">
                              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              {category}
                              <Badge variant="secondary" className="ml-2 text-[10px] px-1 h-4 min-w-4 justify-center">
                                {categoryItems.length}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-muted-foreground border-r border-border">
                              {avgScore}%
                            </TableCell>
                            {hasManagerScores && (
                              <TableCell className="text-center font-semibold text-muted-foreground border-r border-border">
                                {avgManagerScore > 0 ? `${avgManagerScore}%` : '-'}
                              </TableCell>
                            )}
                            <TableCell className="text-center px-4">
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getScoreColor(avgScore)}`} 
                                  style={{ width: `${avgScore}%` }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {(expanded || isGeneral) && categoryItems.map((item, index) => (
                          <TableRow key={item.id || index} className="hover:bg-muted/30 border-b border-border">
                            <TableCell className={`font-medium border-r border-border text-foreground ${!isGeneral ? 'pl-10' : ''}`}>
                              <span className="text-muted-foreground mr-1">{index + 1}.</span>
                              {item.criterion}
                            </TableCell>
                            <TableCell className="text-center border-r border-border">
                              {getScoreBadge(item.score, item.maxScore || maxScore)}
                            </TableCell>
                            {hasManagerScores && (
                              <TableCell className="text-center border-r border-border">
                                {item.managerScore !== undefined 
                                  ? getScoreBadge(item.managerScore, item.maxScore || maxScore)
                                  : <span className="text-muted-foreground">-</span>
                                }
                              </TableCell>
                            )}
                            <TableCell className="text-center px-4">
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getScoreColor((item.score / (item.maxScore || maxScore)) * 100)}`} 
                                  style={{ width: `${(item.score / (item.maxScore || maxScore)) * 100}%` }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    )
                  })}
                  
                  {/* Result Row */}
                  <TableRow className="bg-primary/5 border-t-2 border-primary/20 font-bold hover:bg-primary/10">
                    <TableCell className="text-primary border-r border-primary/20">
                      MÉDIA GERAL
                    </TableCell>
                    <TableCell className="text-center text-primary border-r border-primary/20">
                      {overallAverage}%
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getScoreColor(parseFloat(overallAverage))}`} 
                          style={{ width: `${overallAverage}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableEmptyState colSpan={3} message="Nenhum item encontrado." />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
