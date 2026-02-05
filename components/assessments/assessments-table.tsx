"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  MoreHorizontal, 
  Eye, 
  Play, 
  Trash2, 
  ArrowUp,
  ArrowDown,
  FileText,
  MessageSquare,
  FilePlus2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { UserAvatar, AssessmentStatusBadge, TableEmptyState, ASSESSMENT_STATUS_CONFIG } from '@/components/shared'
import Link from 'next/link'
import { saveManagerComment } from '@/app/(dashboard)/[workspaceId]/assessments/actions'
import { CommentDialog } from './comment-dialog'
import { generatePDI } from '@/app/actions/pdi'
import { toast } from 'sonner'

// Mapping of test types to readable names
const TEST_TYPE_LABELS: Record<string, string> = {
  'seniority_seller': 'Senioridade Vendedor',
  'seniority_leader': 'Senioridade Líder',
  'def_method': 'Matriz DEF',
  'leadership_style': 'Estilo de Liderança',
  'values_8d': 'Mapa de Valores',
  'disc': 'Perfil DISC'
}

// STATUS_LABELS moved to shared/status-badge.tsx as ASSESSMENT_STATUS_CONFIG

interface Assessment {
  id: string
  started_at: string
  completed_at?: string
  created_at?: string // Optional/Legacy
  updated_at?: string // Optional/Legacy
  test_type: string
  status: string
  assessment_mode: string
  manager_comments?: string
  pdi_id?: string
  product?: {
    name: string
  } | null
  evaluated_user: {
    full_name: string | null
    email: string
  } | null
  evaluator_user: {
    full_name: string | null
    email: string
  } | null
}

type SortKey = 'created_at' | 'updated_at' | 'test_type' | 'status' | 'user'
type SortDirection = 'asc' | 'desc'
type SortConfig = { key: SortKey; direction: SortDirection } | null

function SortIcon({ column, sortConfig }: { column: SortKey; sortConfig: SortConfig }) {
  if (!sortConfig || sortConfig.key !== column) {
    return <ArrowUp className="h-3 w-3 opacity-30" />
  }
  return sortConfig.direction === 'asc'
    ? <ArrowUp className="h-3 w-3" />
    : <ArrowDown className="h-3 w-3" />
}

interface AssessmentsTableProps {
  data: Assessment[]
  workspaceId: string
  onDelete: (id: string) => void
  onView?: (assessment: Assessment) => void
  showProductColumn?: boolean
}

export function AssessmentsTable({ data, workspaceId, onDelete, onView, showProductColumn = false }: AssessmentsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' })
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const router = useRouter()

  const handleCreatePDI = async (assessmentId: string) => {
    setGeneratingId(assessmentId)
    const result = await generatePDI(assessmentId, workspaceId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('PDI criado com sucesso')
      router.refresh()
    }
    setGeneratingId(null)
  }

  // Find the currently active assessment for comments
  const activeAssessment = activeCommentId ? data.find(a => a.id === activeCommentId) : null

  const handleSaveComment = async (comment: string) => {
    if (!activeCommentId) return
    
    await saveManagerComment(activeCommentId, comment, workspaceId)
    // The table data will be refreshed by the server action revalidatePath
  }

  const handleSort = (key: SortKey) => {
    if (sortConfig?.key === key) {
      setSortConfig(prev => ({ key, direction: prev?.direction === 'asc' ? 'desc' : 'asc' }))
    } else {
      setSortConfig({ key, direction: 'desc' })
    }
  }

  const sortedData = [...data].sort((a, b) => {
    let aValue: any
    let bValue: any

    if (!sortConfig) return 0
    const { key: sortKey, direction: sortDirection } = sortConfig

    switch (sortKey) {
      case 'created_at':
        aValue = new Date(a.started_at || 0).getTime()
        bValue = new Date(b.started_at || 0).getTime()
        break
      case 'updated_at':
        aValue = new Date(a.completed_at || a.started_at || 0).getTime()
        bValue = new Date(b.completed_at || b.started_at || 0).getTime()
        break
      case 'test_type':
        aValue = TEST_TYPE_LABELS[a.test_type] || a.test_type
        bValue = TEST_TYPE_LABELS[b.test_type] || b.test_type
        break
      case 'status':
        aValue = ASSESSMENT_STATUS_CONFIG[a.status]?.label || a.status
        bValue = ASSESSMENT_STATUS_CONFIG[b.status]?.label || b.status
        break
      case 'user':
        aValue = (a.evaluated_user as any)?.full_name || (a.evaluated_user as any)?.email || ''
        bValue = (b.evaluated_user as any)?.full_name || (b.evaluated_user as any)?.email || ''
        break
      default:
        return 0
    }

    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })



  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {/* Teste */}
            <TableHead>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('test_type')}
              >
                Teste
                <SortIcon column="test_type" sortConfig={sortConfig} />
              </div>
            </TableHead>
            
            {/* Usuário */}
            <TableHead className="min-w-[200px]">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('user')}
              >
                Usuário
                <SortIcon column="user" sortConfig={sortConfig} />
              </div>
            </TableHead>
            
            {/* Status */}
            <TableHead>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                Status
                <SortIcon column="status" sortConfig={sortConfig} />
              </div>
            </TableHead>
            
            {/* Produto (conditional) */}
            {showProductColumn && (
              <TableHead>Produto</TableHead>
            )}
            
            {/* PDI */}
            <TableHead>PDI</TableHead>
            
            {/* Comentários */}
            <TableHead className="min-w-[200px]">Comentários</TableHead>

            {/* Criado em */}
            <TableHead className="min-w-[120px]">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('created_at')}
              >
                Criado em
                <SortIcon column="created_at" sortConfig={sortConfig} />
              </div>
            </TableHead>
            
            {/* Última Edição */}
            <TableHead className="min-w-[120px]">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('updated_at')}
              >
                Última Edição
                <SortIcon column="updated_at" sortConfig={sortConfig} />
              </div>
            </TableHead>
            
            {/* Ações */}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableEmptyState colSpan={8 + (showProductColumn ? 1 : 0)} message="Nenhuma avaliação encontrada." />
          ) : (
            sortedData.map((assessment) => (
              <TableRow 
                key={assessment.id}
                className={onView && assessment.status === 'completed' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                onClick={() => {
                  if (onView && assessment.status === 'completed') {
                    onView(assessment)
                  }
                }}
              >
                {/* Teste */}
                <TableCell className="font-medium text-foreground">
                  {TEST_TYPE_LABELS[assessment.test_type] || assessment.test_type}
                </TableCell>
                
                {/* Usuário */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      name={assessment.evaluated_user?.full_name} 
                      size="sm" 
                    />
                    <div className="flex flex-col justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {assessment.evaluated_user?.full_name || 'Usuário'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                
                {/* Status */}
                <TableCell>
                  <AssessmentStatusBadge status={assessment.status} />
                </TableCell>
                
                {/* Produto */}
                {showProductColumn && (
                  <TableCell className="text-sm text-muted-foreground">
                    {assessment.product?.name || '-'}
                  </TableCell>
                )}
                
                {/* PDI */}
                <TableCell>
                  {assessment.pdi_id ? (
                    <Badge variant="default" className="bg-green-600">
                      <FileText className="w-3 h-3 mr-1" />
                      Gerado
                    </Badge>
                  ) : assessment.status === 'completed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={generatingId === assessment.id}
                      onClick={() => handleCreatePDI(assessment.id)}
                    >
                      <FilePlus2 className="w-4 h-4 mr-1" />
                      {generatingId === assessment.id ? 'Gerando...' : 'Criar PDI'}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                
                {/* Comentários */}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      relative h-8 gap-2 px-2
                      ${assessment.manager_comments 
                        ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' 
                        : 'text-muted-foreground hover:text-foreground'}
                    `}
                    onClick={() => setActiveCommentId(assessment.id)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-normal">
                      {assessment.manager_comments ? 'Ver comentário' : 'Adicionar'}
                    </span>
                    
                    {assessment.manager_comments && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                    )}
                  </Button>
                </TableCell>

                {/* Created At */}
                <TableCell className="text-sm text-muted-foreground">
                  {assessment.started_at
                    ? format(new Date(assessment.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : '-'}
                </TableCell>
                
                {/* Updated At (using completed_at as proxy for now, or started_at if null) */}
                <TableCell className="text-sm text-muted-foreground">
                  {assessment.completed_at
                    ? format(new Date(assessment.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : '-'}
                </TableCell>
                
                {/* Ações */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {assessment.status === 'completed' ? (
                        <>
                          {onView ? (
                            <DropdownMenuItem onClick={() => onView(assessment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                          ) : (
                            <Link href={`/${workspaceId}/assessments/${assessment.test_type}/${assessment.id}`}>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                            </Link>
                          )}
                          {!assessment.pdi_id && (
                            <DropdownMenuItem
                              disabled={generatingId === assessment.id}
                              onClick={() => handleCreatePDI(assessment.id)}
                            >
                              <FilePlus2 className="mr-2 h-4 w-4" />
                              {generatingId === assessment.id ? 'Gerando PDI...' : 'Criar PDI'}
                            </DropdownMenuItem>
                          )}
                        </>
                      ) : (
                        <Link href={`/${workspaceId}/assessments/${assessment.test_type}/${assessment.id}`}>
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            {assessment.status === 'draft' ? 'Continuar' : 'Iniciar'}
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={() => onDelete(assessment.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CommentDialog
        isOpen={!!activeCommentId}
        onOpenChange={(open) => !open && setActiveCommentId(null)}
        initialComment={activeAssessment?.manager_comments || ''}
        onSave={handleSaveComment}
        title={`Comentários - ${activeAssessment?.evaluated_user?.full_name || 'Avaliação'}`}
      />
    </div>
  )
}
