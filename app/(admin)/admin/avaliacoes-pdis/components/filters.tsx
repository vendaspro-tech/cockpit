'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, X, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface FilterProps {
  workspaces: { id: string; name: string }[]
  onFilterChange: (filters: any) => void
  type: 'assessments' | 'pdis'
}

export function AdminFilters({ workspaces, onFilterChange, type }: FilterProps) {
  const [search, setSearch] = useState('')
  const [workspaceId, setWorkspaceId] = useState('all')
  const [testType, setTestType] = useState('all')
  const [status, setStatus] = useState('all')
  const [hasPdi, setHasPdi] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const applyFilters = useCallback(() => {
    onFilterChange({
      search,
      workspaceId,
      testType,
      status,
      hasPdi: hasPdi === 'all' ? undefined : hasPdi === 'yes',
      dateRange
    })
  }, [dateRange, hasPdi, onFilterChange, search, status, testType, workspaceId])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters()
    }, 500)
    return () => clearTimeout(timer)
  }, [applyFilters])

  // Apply filters when selects change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const clearFilters = () => {
    setSearch('')
    setWorkspaceId('all')
    setTestType('all')
    setStatus('all')
    setHasPdi('all')
    setDateRange(undefined)
  }

  const activeFiltersCount = [
    workspaceId !== 'all',
    testType !== 'all',
    status !== 'all',
    hasPdi !== 'all',
    dateRange !== undefined
  ].filter(Boolean).length

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário, email ou workspace..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Workspaces</SelectItem>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {type === 'assessments' && (
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Teste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="seniority_seller">Senioridade Vendedor</SelectItem>
                <SelectItem value="seniority_leader">Senioridade Líder</SelectItem>
                <SelectItem value="def_method">Matriz DEF</SelectItem>
                <SelectItem value="leadership_style">Estilo de Liderança</SelectItem>
                <SelectItem value="values_8d">Mapa de Valores</SelectItem>
                <SelectItem value="disc">Perfil DISC</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {type === 'assessments' ? (
                <>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {type === 'assessments' && (
            <Select value={hasPdi} onValueChange={setHasPdi}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="PDI Vinculado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Com PDI</SelectItem>
                <SelectItem value="no">Sem PDI</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span>Filtros ativos:</span>
          {workspaceId !== 'all' && <Badge variant="secondary">Workspace</Badge>}
          {testType !== 'all' && <Badge variant="secondary">Tipo</Badge>}
          {status !== 'all' && <Badge variant="secondary">Status</Badge>}
          {hasPdi !== 'all' && <Badge variant="secondary">PDI</Badge>}
          {dateRange && <Badge variant="secondary">Data</Badge>}
        </div>
      )}
    </div>
  )
}
