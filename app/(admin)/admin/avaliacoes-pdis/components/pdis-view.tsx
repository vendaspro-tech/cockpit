'use client'

import { useState } from 'react'
import { AdminFilters } from './filters'
import { getAdminPDIs } from '../actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, Loader2, Target } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Helper for initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const STATUS_LABELS: Record<string, { label: string, variant: 'default' | 'secondary' | 'outline' | 'destructive', className?: string }> = {
  'draft': { label: 'Rascunho', variant: 'secondary' },
  'active': { label: 'Ativo', variant: 'default', className: 'bg-blue-600 hover:bg-blue-700' },
  'completed': { label: 'Concluído', variant: 'outline', className: 'bg-green-100 text-green-700 border-green-200' },
  'archived': { label: 'Arquivado', variant: 'secondary' }
}

interface PDIsViewProps {
  initialData: any[]
  workspaces: { id: string; name: string }[]
}

export function PDIsView({ initialData, workspaces }: PDIsViewProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [selectedPDI, setSelectedPDI] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleFilterChange = async (filters: any) => {
    setLoading(true)
    try {
      const result = await getAdminPDIs(filters)
      setData(result)
    } catch (error) {
      console.error('Failed to fetch PDIs', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (pdi: any) => {
    setSelectedPDI(pdi)
    setIsDrawerOpen(true)
  }

  return (
    <div>
      <AdminFilters 
        workspaces={workspaces} 
        onFilterChange={handleFilterChange} 
        type="pdis" 
      />

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Meta</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhum PDI encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((pdi) => (
                <TableRow key={pdi.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(pdi)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-medium">
                          {pdi.user?.full_name 
                            ? getInitials(pdi.user.full_name) 
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {pdi.user?.full_name || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pdi.user?.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{pdi.workspace?.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{pdi.workspace?.plan}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={STATUS_LABELS[pdi.status]?.variant || 'default'}
                      className={STATUS_LABELS[pdi.status]?.className}
                    >
                      {STATUS_LABELS[pdi.status]?.label || pdi.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pdi.source_assessment ? (
                      <Badge variant="outline" className="text-xs">
                        Avaliação
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Manual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pdi.created_at
                      ? format(new Date(pdi.created_at), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pdi.target_completion_date
                      ? format(new Date(pdi.target_completion_date), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(pdi); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-4xl w-[90vw] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Detalhes do PDI</SheetTitle>
          </SheetHeader>
          
          {selectedPDI && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-purple-100 text-purple-700 font-medium text-lg">
                    {selectedPDI.user?.full_name 
                      ? getInitials(selectedPDI.user.full_name) 
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedPDI.user?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPDI.user?.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{selectedPDI.workspace?.name}</Badge>
                    <Badge variant={STATUS_LABELS[selectedPDI.status]?.variant || 'default'}>
                      {STATUS_LABELS[selectedPDI.status]?.label || selectedPDI.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Placeholder for PDI details */}
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-center text-muted-foreground py-8">
                  Visualização detalhada do PDI em desenvolvimento.
                  <br />
                  ID: {selectedPDI.id}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
