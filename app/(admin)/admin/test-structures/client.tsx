'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, FileText, CheckCircle2, Clock, ListChecks } from "lucide-react"
import { TestStructureList } from "@/components/admin/test-structures/test-structure-list"
import { TestStructureEditor } from "@/components/admin/test-structures/editor/test-structure-editor"
import { VersionHistoryDialog } from "@/components/admin/test-structures/version/version-history-dialog"
import { VersionComparison } from "@/components/admin/test-structures/version/version-comparison"
import { ImportJsonDialog } from "@/components/admin/test-structures/import-json-dialog"
import type { TestStructure, TestStructureStats, TestType } from "@/lib/types/test-structure"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { duplicateTestStructure } from "@/app/actions/admin/test-structures"

interface TestStructuresClientProps {
  initialTestStructures: TestStructure[]
  stats?: TestStructureStats
}

// Test type labels for UI
const TEST_TYPE_LABELS: Record<TestType, string> = {
  disc: 'DISC',
  seniority_seller: 'Senioridade Vendedor',
  seniority_leader: 'Senioridade Líder',
  leadership_style: 'Estilo de Liderança',
  def_method: 'Método DEF',
  values_8d: '8 Dimensões de Valores'
}

export function TestStructuresClient({
  initialTestStructures,
  stats
}: TestStructuresClientProps) {
  const { toast } = useToast()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<TestStructure | undefined>()
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<TestStructure | null>(null)
  const [duplicateTargetType, setDuplicateTargetType] = useState<TestType | "">("")

  // Version history state
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [versionHistoryTestType, setVersionHistoryTestType] = useState<TestType | null>(null)
  const [versionComparisonOpen, setVersionComparisonOpen] = useState(false)
  const [compareVersion1, setCompareVersion1] = useState<string | null>(null)
  const [compareVersion2, setCompareVersion2] = useState<string | null>(null)

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // Calculate stats from structures if not provided
  const calculatedStats: TestStructureStats = stats || {
    total: initialTestStructures.length,
    active: initialTestStructures.filter(s => s.is_active).length,
    draft: initialTestStructures.filter(s => !s.is_active).length,
    by_type: initialTestStructures.reduce((acc, s) => {
      acc[s.test_type] = (acc[s.test_type] || 0) + 1
      return acc
    }, {} as Record<TestType, number>)
  }

  const displayStats = stats || calculatedStats

  const handleEdit = (structure: TestStructure) => {
    setEditingStructure(structure)
    setIsEditorOpen(true)
  }

  const handleCreate = () => {
    setEditingStructure(undefined)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingStructure(undefined)
  }

  const handleDuplicate = (structure: TestStructure) => {
    setDuplicateSource(structure)
    setDuplicateTargetType("")
    setDuplicateDialogOpen(true)
  }

  const handleViewHistory = (testType: TestType) => {
    setVersionHistoryTestType(testType)
    setVersionHistoryOpen(true)
  }

  const handleCompareVersions = (version1Id: string, version2Id: string) => {
    setCompareVersion1(version1Id)
    setCompareVersion2(version2Id)
    setVersionHistoryOpen(false)
    setVersionComparisonOpen(true)
  }

  const handleImport = (data: Partial<TestStructure>) => {
    // Open editor with imported data
    setEditingStructure(data as TestStructure)
    setIsEditorOpen(true)
  }

  const handleDuplicateConfirm = async () => {
    if (!duplicateSource || !duplicateTargetType) return

    const result = await duplicateTestStructure(
      duplicateSource.id,
      duplicateTargetType as TestType,
      `Duplicado de ${TEST_TYPE_LABELS[duplicateSource.test_type]} v${duplicateSource.version}`
    )

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao duplicar",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Estrutura duplicada com sucesso"
      })
      setDuplicateDialogOpen(false)
      setDuplicateSource(null)
      setDuplicateTargetType("")
    }
  }

  // Available test types for duplication (exclude source type)
  const availableTestTypes = (Object.keys(TEST_TYPE_LABELS) as TestType[]).filter(
    type => type !== duplicateSource?.test_type
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estruturas de Teste</h1>
          <p className="text-muted-foreground">
            Gerencie as estruturas e configurações dos testes de avaliação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Importar JSON
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Estrutura
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              estruturas configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.active}</div>
            <p className="text-xs text-muted-foreground">
              versões em produção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.draft}</div>
            <p className="text-xs text-muted-foreground">
              versões inativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(displayStats.by_type).length}
            </div>
            <p className="text-xs text-muted-foreground">
              tipos de teste
            </p>
          </CardContent>
        </Card>
      </div>

      <TestStructureList
        testStructures={initialTestStructures}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onViewHistory={handleViewHistory}
      />

      <TestStructureEditor
        testStructure={editingStructure}
        open={isEditorOpen}
        onOpenChange={handleCloseEditor}
      />

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Estrutura de Teste</DialogTitle>
            <DialogDescription>
              Selecione o tipo de teste de destino para duplicar a estrutura
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estrutura de origem</Label>
              <div className="text-sm text-muted-foreground">
                {duplicateSource && TEST_TYPE_LABELS[duplicateSource.test_type]} (v{duplicateSource?.version})
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-test-type">Tipo de teste de destino *</Label>
              <Select
                value={duplicateTargetType}
                onValueChange={(value) => setDuplicateTargetType(value as TestType)}
              >
                <SelectTrigger id="target-test-type">
                  <SelectValue placeholder="Selecione um tipo de teste" />
                </SelectTrigger>
                <SelectContent>
                  {availableTestTypes.length > 0 ? (
                    availableTestTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TEST_TYPE_LABELS[type]}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum tipo de teste disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!duplicateTargetType}
            >
              Duplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <VersionHistoryDialog
        testType={versionHistoryTestType}
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        onCompareVersions={handleCompareVersions}
      />

      <VersionComparison
        version1Id={compareVersion1}
        version2Id={compareVersion2}
        open={versionComparisonOpen}
        onOpenChange={setVersionComparisonOpen}
      />

      <ImportJsonDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </div>
  )
}
