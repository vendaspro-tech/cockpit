'use client'

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeftRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTestStructure } from "@/app/actions/admin/test-structures"
import type { TestStructure } from "@/lib/types/test-structure"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VersionComparisonProps {
  version1Id: string | null
  version2Id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionComparison({
  version1Id,
  version2Id,
  open,
  onOpenChange
}: VersionComparisonProps) {
  const { toast } = useToast()
  const [version1, setVersion1] = useState<TestStructure | null>(null)
  const [version2, setVersion2] = useState<TestStructure | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadVersions = useCallback(async () => {
    if (!version1Id || !version2Id) return

    setIsLoading(true)

    const [result1, result2] = await Promise.all([
      getTestStructure(version1Id),
      getTestStructure(version2Id)
    ])

    if ('error' in result1 && result1.error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar versão 1",
        description: result1.error
      })
      setVersion1(null)
    } else {
      setVersion1(result1.data ?? null)
    }

    if ('error' in result2 && result2.error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar versão 2",
        description: result2.error
      })
      setVersion2(null)
    } else {
      setVersion2(result2.data ?? null)
    }

    setIsLoading(false)
  }, [toast, version1Id, version2Id])

  useEffect(() => {
    if (open && version1Id && version2Id) {
      loadVersions()
    }
  }, [open, version1Id, version2Id, loadVersions])

  const compareMetadata = () => {
    if (!version1 || !version2) return []

    const changes: Array<{ field: string; v1: any; v2: any; changed: boolean }> = []

    const v1Meta = version1.structure.metadata
    const v2Meta = version2.structure.metadata

    changes.push({
      field: 'Nome',
      v1: v1Meta.name,
      v2: v2Meta.name,
      changed: v1Meta.name !== v2Meta.name
    })

    changes.push({
      field: 'Descrição',
      v1: v1Meta.description,
      v2: v2Meta.description,
      changed: v1Meta.description !== v2Meta.description
    })

    changes.push({
      field: 'Instruções',
      v1: v1Meta.instructions || '-',
      v2: v2Meta.instructions || '-',
      changed: v1Meta.instructions !== v2Meta.instructions
    })

    changes.push({
      field: 'Duração estimada',
      v1: v1Meta.estimated_duration_minutes ? `${v1Meta.estimated_duration_minutes} min` : '-',
      v2: v2Meta.estimated_duration_minutes ? `${v2Meta.estimated_duration_minutes} min` : '-',
      changed: v1Meta.estimated_duration_minutes !== v2Meta.estimated_duration_minutes
    })

    return changes
  }

  const compareStructure = () => {
    if (!version1 || !version2) return []

    const changes: Array<{ field: string; v1: any; v2: any; changed: boolean }> = []

    const v1Categories = version1.structure.categories
    const v2Categories = version2.structure.categories

    changes.push({
      field: 'Número de categorias',
      v1: v1Categories.length,
      v2: v2Categories.length,
      changed: v1Categories.length !== v2Categories.length
    })

    const v1TotalQuestions = v1Categories.reduce((sum, cat) => sum + cat.questions.length, 0)
    const v2TotalQuestions = v2Categories.reduce((sum, cat) => sum + cat.questions.length, 0)

    changes.push({
      field: 'Total de questões',
      v1: v1TotalQuestions,
      v2: v2TotalQuestions,
      changed: v1TotalQuestions !== v2TotalQuestions
    })

    // Compare category names
    const v1CatNames = v1Categories.map(c => c.name).sort().join(', ')
    const v2CatNames = v2Categories.map(c => c.name).sort().join(', ')

    changes.push({
      field: 'Categorias',
      v1: v1CatNames,
      v2: v2CatNames,
      changed: v1CatNames !== v2CatNames
    })

    return changes
  }

  const compareScoring = () => {
    if (!version1 || !version2) return []

    const changes: Array<{ field: string; v1: any; v2: any; changed: boolean }> = []

    const v1Scoring = version1.structure.scoring
    const v2Scoring = version2.structure.scoring

    changes.push({
      field: 'Método de cálculo',
      v1: v1Scoring.method,
      v2: v2Scoring.method,
      changed: v1Scoring.method !== v2Scoring.method
    })

    changes.push({
      field: 'Escala',
      v1: `${v1Scoring.scale?.min || 1} - ${v1Scoring.scale?.max || 5}`,
      v2: `${v2Scoring.scale?.min || 1} - ${v2Scoring.scale?.max || 5}`,
      changed: v1Scoring.scale?.min !== v2Scoring.scale?.min || v1Scoring.scale?.max !== v2Scoring.scale?.max
    })

    changes.push({
      field: 'Ranges de pontuação',
      v1: v1Scoring.ranges?.length || 0,
      v2: v2Scoring.ranges?.length || 0,
      changed: (v1Scoring.ranges?.length || 0) !== (v2Scoring.ranges?.length || 0)
    })

    return changes
  }

  if (!version1Id || !version2Id) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comparação de Versões
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Compare as diferenças entre duas versões da estrutura de teste
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !version1 || !version2 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Erro ao carregar versões</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Version headers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-lg">v{version1.version}</span>
                  {version1.is_active && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Ativa
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {version1.changelog || 'Sem descrição'}
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-lg">v{version2.version}</span>
                  {version2.is_active && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Ativa
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {version2.changelog || 'Sem descrição'}
                </p>
              </div>
            </div>

            {/* Comparison tables */}
            <Tabs defaultValue="metadata" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="metadata">Metadados</TabsTrigger>
                <TabsTrigger value="structure">Estrutura</TabsTrigger>
                <TabsTrigger value="scoring">Pontuação</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="space-y-4 mt-4">
                <ComparisonTable changes={compareMetadata()} />
              </TabsContent>

              <TabsContent value="structure" className="space-y-4 mt-4">
                <ComparisonTable changes={compareStructure()} />
              </TabsContent>

              <TabsContent value="scoring" className="space-y-4 mt-4">
                <ComparisonTable changes={compareScoring()} />
              </TabsContent>

              <TabsContent value="json" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="font-medium mb-2">Versão {version1.version}</h4>
                    <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded border">
                      {JSON.stringify(version1.structure, null, 2)}
                    </pre>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="font-medium mb-2">Versão {version2.version}</h4>
                    <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded border">
                      {JSON.stringify(version2.structure, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Sub-component for comparison table
function ComparisonTable({
  changes
}: {
  changes: Array<{ field: string; v1: any; v2: any; changed: boolean }>
}) {
  if (changes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border border-dashed rounded-lg">
        <p className="text-muted-foreground text-sm">Nenhuma mudança para comparar</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium text-sm">Campo</th>
            <th className="text-left p-3 font-medium text-sm">Versão Anterior</th>
            <th className="text-left p-3 font-medium text-sm">Versão Nova</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change, index) => (
            <tr
              key={index}
              className={`border-t ${change.changed ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
            >
              <td className="p-3 text-sm font-medium">{change.field}</td>
              <td className="p-3 text-sm text-muted-foreground font-mono">
                {typeof change.v1 === 'object' ? JSON.stringify(change.v1) : change.v1}
              </td>
              <td className="p-3 text-sm text-muted-foreground font-mono">
                {typeof change.v2 === 'object' ? JSON.stringify(change.v2) : change.v2}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
