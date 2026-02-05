'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { DateRange } from 'react-day-picker'


import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter, Search, X, ArrowUpDown, BarChart3, Users, Target, Compass, Gem, ListFilter, FileText, Calendar as CalendarIcon, BrainCircuit, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createAssessment, deleteAssessment } from '@/app/actions/assessments'
import { AssessmentsTable } from '@/components/assessments/assessments-table'
import { AssessmentDrawer } from '@/components/assessments/assessment-drawer'
import { createClient } from '@/lib/supabase/client'
import { getAssessmentResult } from './actions'
import { Calendar } from '@/components/ui/calendar'


interface AssessmentsDashboardProps {
  initialData: any[]
  workspaceId: string
  users: any[]
  products: any[]
}

const TEST_TYPES = [
  { id: 'seniority_seller', label: 'Senioridade Vendedor' },
  { id: 'seniority_leader', label: 'Senioridade Líder' },
  { id: 'leadership_style', label: 'Estilo de Liderança' },
  { id: 'values_8d', label: 'Mapa de Valores' },
  { id: 'disc', label: 'Perfil DISC' },
]



export function AssessmentsDashboard({ initialData, workspaceId, users, products }: AssessmentsDashboardProps) {
  console.log('AssessmentsDashboard received products:', products)
  const router = useRouter()
  const [isCreating, setIsCreating] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [testTypeFilter, setTestTypeFilter] = useState('all')
  
  // Drawer state
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerResult, setDrawerResult] = useState<any>(null)
  const [loadingResult, setLoadingResult] = useState(false)
  
  const [userFilter, setUserFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'type' | 'status'
    direction: 'asc' | 'desc'
  } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleCreate(testType: string) {
    setIsCreating(testType)
    await createAssessment(workspaceId, testType)
  }

  async function handleDelete() {
    if (!deleteId) return
    
    try {
      await deleteAssessment(workspaceId, deleteId)
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting assessment:', error)
    }
  }

  async function handleView(assessment: any) {
    console.log('==== handleView called ====', assessment)
    setSelectedAssessment(assessment)
    setLoadingResult(true)
    setDrawerOpen(true)
    console.log('Drawer state after setDrawerOpen(true):', { drawerOpen: true })
    
    try {
      console.log('Fetching results for assessment:', assessment.id)
      
      const resultData = await getAssessmentResult(assessment.id)
      
      console.log('Results fetch:', { resultData })
      
      if (resultData) {
        console.log('Setting drawer result:', resultData)
        setDrawerResult(resultData)
      } else {
        console.warn('No results found')
        setDrawerResult(null)
      }
    } catch (err) {
      console.error('Error fetching results:', err)
      setDrawerResult(null)
    } finally {
      setLoadingResult(false)
      console.log('==== handleView complete ====', { loadingResult: false })
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteAssessment(workspaceId, deleteId)
      setDeleteId(null)
    } catch (error) {
      console.error(error)
      alert('Erro ao excluir avaliação')
    }
  }

  const handleSort = (key: 'date' | 'type' | 'status', direction?: 'asc' | 'desc') => {
    if (direction) {
      setSortConfig({ key, direction })
    } else {
      if (sortConfig?.key === key) {
        setSortConfig({
          key,
          direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
        })
      } else {
        setSortConfig({ key, direction: 'desc' })
      }
    }
  }

  const filteredData = initialData.filter(item => {
    const matchesSearch = 
      item.evaluated_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.test_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesType = testTypeFilter === 'all' || item.test_type === testTypeFilter
    const matchesUser = userFilter === 'all' || item.evaluated_user_id === userFilter
    
    const matchesProduct = productFilter === 'all' || (item as any).product_id === productFilter

    // Date range filter
    const matchesDateRange = !dateRange?.from || (
      (() => {
        const itemDate = new Date(item.started_at || item.created_at)
        const fromDate = new Date(dateRange.from)
        fromDate.setHours(0, 0, 0, 0)
        
        if (!dateRange.to) {
          return itemDate >= fromDate
        }
        
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        
        return itemDate >= fromDate && itemDate <= toDate
      })()
    )
    
    return matchesSearch && matchesStatus && matchesType && matchesUser && matchesProduct && matchesDateRange
  })

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortConfig.key) {
        case 'date':
          aVal = new Date(a.started_at).getTime()
          bVal = new Date(b.started_at).getTime()
          break
        case 'type':
          aVal = a.test_type
          bVal = b.test_type
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        default:
          return 0
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }, [filteredData, sortConfig])

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTestTypeFilter('all')
    setUserFilter('all')
    setProductFilter('all')
    setSortConfig(null)
  }

  const hasActiveFilters = 
    searchTerm !== '' || 
    statusFilter !== 'all' || 
    testTypeFilter !== 'all' || 
    userFilter !== 'all' ||
    productFilter !== 'all' ||
    sortConfig !== null

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {/* Header & Actions */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Avaliações</h1>
          <Link href={`/${workspaceId}/assessments/dashboard`}>
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard de Performance
            </Button>
          </Link>
        </div>

        {/* New Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TEST_TYPES.map((type) => {
            const iconComponents = {
              'seniority_seller': BarChart3,
              'seniority_leader': Users,
              'def_method': Target,
              'leadership_style': Compass,
              'values_8d': Gem,
              'disc': BrainCircuit
            }

            const IconComponent = iconComponents[type.id as keyof typeof iconComponents]

            return (
              <button
                key={type.id}
                onClick={() => handleCreate(type.id)}
                disabled={!!isCreating}
                className={`
                  group relative overflow-hidden rounded-2xl bg-card border-2 border-border
                  shadow-sm hover:shadow-2xl hover:scale-105 transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  p-6 text-left
                `}
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className={`
                    w-16 h-16 rounded-full bg-primary
                    flex items-center justify-center
                    group-hover:scale-110 transition-transform duration-300
                    shadow-lg
                  `}>
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-foreground text-sm leading-tight mb-1">
                      {type.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">Nova avaliação</p>
                  </div>

                  <div className="
                    absolute top-3 right-3
                    w-6 h-6 rounded-full bg-background shadow-md
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {isCreating === type.id && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      
      {/* Filters Above Table */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar avaliações..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="pending_evaluation">Aguardando</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Test Type Filter */}
        <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
          <SelectTrigger className="w-[240px] bg-background">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Teste" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Avaliações</SelectItem>
            <SelectItem value="seniority_seller">Senioridade Vendedor</SelectItem>
            <SelectItem value="seniority_leader">Senioridade Líder</SelectItem>
            <SelectItem value="leadership_style">Estilo de Liderança</SelectItem>
            <SelectItem value="values_8d">Mapa de Valores</SelectItem>
            <SelectItem value="disc">Perfil DISC</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[160px] bg-background justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                ) : format(dateRange.from, 'dd/MM/yyyy')
              ) : (
                <span>Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setDateRange(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        
        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || testTypeFilter !== 'all' || dateRange?.from) && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTestTypeFilter('all'); setDateRange(undefined); }}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      <AssessmentsTable 
        data={sortedData} 
        workspaceId={workspaceId}
        onDelete={setDeleteId}
        onView={handleView}
        showProductColumn={true}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a avaliação e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assessment Drawer */}
      <AssessmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        assessment={selectedAssessment}
        result={drawerResult}
        workspaceId={workspaceId}
      />

    </div>
  )
}
