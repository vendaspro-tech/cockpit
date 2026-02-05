'use client'

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Play,
  GitCompare,
  FileText,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getVersionHistory, activateVersion } from "@/app/actions/admin/test-structures"
import type { TestType, VersionHistoryEntry } from "@/lib/types/test-structure"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface VersionHistoryDialogProps {
  testType: TestType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompareVersions?: (version1Id: string, version2Id: string) => void
}

const TEST_TYPE_LABELS: Record<TestType, string> = {
  disc: 'DISC',
  seniority_seller: 'Senioridade Vendedor',
  seniority_leader: 'Senioridade Líder',
  leadership_style: 'Estilo de Liderança',
  def_method: 'Método DEF',
  values_8d: '8 Dimensões de Valores'
}

export function VersionHistoryDialog({
  testType,
  open,
  onOpenChange,
  onCompareVersions
}: VersionHistoryDialogProps) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<VersionHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false)
  const [versionToActivate, setVersionToActivate] = useState<VersionHistoryEntry | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  const loadVersionHistory = useCallback(async () => {
    if (!testType) return

    setIsLoading(true)
    const result = await getVersionHistory(testType)

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar histórico",
        description: result.error
      })
      setVersions([])
    } else {
      setVersions(result.data || [])
    }
    setIsLoading(false)
  }, [testType, toast])

  useEffect(() => {
    if (open && testType) {
      loadVersionHistory()
    }
  }, [open, testType, loadVersionHistory])

  const handleActivateClick = (version: VersionHistoryEntry) => {
    if (version.is_active) {
      toast({
        title: "Versão já ativa",
        description: "Esta versão já está ativa"
      })
      return
    }

    setVersionToActivate(version)
    setActivateConfirmOpen(true)
  }

  const handleActivateConfirm = async () => {
    if (!versionToActivate) return

    setIsActivating(true)
    const result = await activateVersion(versionToActivate.id)

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao ativar versão",
        description: result.error
      })
    } else {
      toast({
        title: "Versão ativada",
        description: `Versão ${versionToActivate.version} ativada com sucesso`
      })
      await loadVersionHistory()
    }

    setIsActivating(false)
    setActivateConfirmOpen(false)
    setVersionToActivate(null)
  }

  const handleCompareSelect = (versionId: string) => {
    if (selectedForCompare.includes(versionId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== versionId))
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, versionId])
    } else {
      // Replace oldest selection
      setSelectedForCompare([selectedForCompare[1], versionId])
    }
  }

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompareVersions) {
      onCompareVersions(selectedForCompare[0], selectedForCompare[1])
      setSelectedForCompare([])
    }
  }

  if (!testType) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico de Versões - {TEST_TYPE_LABELS[testType]}
            </DialogTitle>
            <DialogDescription>
              Visualize, ative ou compare diferentes versões desta estrutura de teste
            </DialogDescription>
          </DialogHeader>

          {selectedForCompare.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">
                {selectedForCompare.length === 1
                  ? '1 versão selecionada para comparação'
                  : '2 versões selecionadas para comparação'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedForCompare([])}
                >
                  Limpar
                </Button>
                {selectedForCompare.length === 2 && (
                  <Button size="sm" onClick={handleCompare}>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Comparar
                  </Button>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma versão encontrada</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      {onCompareVersions && (
                        <span className="text-xs text-muted-foreground">Comp</span>
                      )}
                    </TableHead>
                    <TableHead className="w-20">Versão</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Changelog</TableHead>
                    <TableHead className="w-40">Publicado</TableHead>
                    <TableHead className="text-right w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow
                      key={version.id}
                      className={selectedForCompare.includes(version.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        {onCompareVersions && (
                          <input
                            type="checkbox"
                            checked={selectedForCompare.includes(version.id)}
                            onChange={() => handleCompareSelect(version.id)}
                            className="cursor-pointer"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">v{version.version}</span>
                      </TableCell>
                      <TableCell>
                        {version.is_active ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            <Circle className="mr-1 h-3 w-3" />
                            Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {version.changelog || 'Sem descrição'}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {version.published_at
                          ? formatDistanceToNow(new Date(version.published_at), {
                              addSuffix: true,
                              locale: ptBR
                            })
                          : 'Não publicado'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {!version.is_active && (
                              <DropdownMenuItem onClick={() => handleActivateClick(version)}>
                                <Play className="mr-2 h-4 w-4" />
                                Ativar Versão
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                // TODO: Open view details
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={activateConfirmOpen}
        onOpenChange={setActivateConfirmOpen}
        onConfirm={handleActivateConfirm}
        title="Ativar Versão"
        description={
          versionToActivate
            ? `Tem certeza que deseja ativar a versão ${versionToActivate.version}? A versão atual será desativada.`
            : ''
        }
        confirmLabel="Ativar"
        isLoading={isActivating}
      />
    </>
  )
}
