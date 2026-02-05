'use client'

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Info, FileText, Target, Eye, AlertCircle, History } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDraft } from "@/hooks/use-draft"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { TestStructure, TestStructureData, TestType } from "@/lib/types/test-structure"
import { createTestStructure, updateTestStructure } from "@/app/actions/admin/test-structures"
import { OverviewTab } from "./overview-tab"
import { StructureTab } from "./structure-tab"
import { ScoringTab } from "./scoring-tab"
import { PreviewTab } from "./preview-tab"

// Test type labels for UI
const TEST_TYPE_LABELS: Record<TestType, string> = {
  disc: 'DISC',
  seniority_seller: 'Senioridade Vendedor',
  seniority_leader: 'Senioridade Líder',
  leadership_style: 'Estilo de Liderança',
  def_method: 'Método DEF',
  values_8d: '8 Dimensões de Valores'
}

interface TestStructureEditorProps {
  testStructure?: TestStructure
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Default structure for new test structures
const DEFAULT_STRUCTURE: TestStructureData = {
  metadata: {
    name: '',
    description: '',
    instructions: '',
    applicable_job_titles: [],
    estimated_duration_minutes: 15
  },
  categories: [],
  scoring: {
    method: 'sum',
    category_weights: {},
    scale: {
      min: 1,
      max: 5,
      labels: {
        min: 'Discordo totalmente',
        max: 'Concordo totalmente'
      }
    },
    ranges: []
  }
}

export function TestStructureEditor({
  testStructure,
  open,
  onOpenChange
}: TestStructureEditorProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Draft management
  const { hasDraft, saveDraft, loadDraft, clearDraft } = useDraft(testStructure?.id)
  const [showDraftAlert, setShowDraftAlert] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string>()

  // Form state
  const [testType, setTestType] = useState<TestType | ''>('')
  const [structure, setStructure] = useState<TestStructureData>(DEFAULT_STRUCTURE)
  const [changelog, setChangelog] = useState('')

  // Initialize form when testStructure changes
  useEffect(() => {
    if (testStructure) {
      setTestType(testStructure.test_type)
      setStructure(testStructure.structure)
      setChangelog('')
    } else {
      setTestType('')
      setStructure(DEFAULT_STRUCTURE)
      setChangelog('')
    }

    // Check for draft
    if (open && hasDraft) {
      const draft = loadDraft()
      if (draft) {
        setShowDraftAlert(true)
        setDraftTimestamp(draft.last_saved_at)
      }
    }
  }, [testStructure, open, hasDraft, loadDraft])

  // Auto-save draft
  useEffect(() => {
    if (!open || !testType) return

    const timeoutId = setTimeout(() => {
      saveDraft({
        test_type: testType as TestType,
        structure
      })
    }, 5000) // Save draft every 5 seconds

    return () => clearTimeout(timeoutId)
  }, [structure, testType, open, saveDraft])

  const handleLoadDraft = () => {
    const draft = loadDraft()
    if (draft) {
      if (draft.test_type) setTestType(draft.test_type)
      if (draft.structure) setStructure(draft.structure)
      setShowDraftAlert(false)
      toast({
        title: "Draft recuperado",
        description: "Os dados do draft foram carregados"
      })
    }
  }

  const handleDiscardDraft = () => {
    clearDraft()
    setShowDraftAlert(false)
    toast({
      title: "Draft descartado",
      description: "O draft foi removido"
    })
  }

  const handleSaveDraft = async () => {
    // Basic validation for draft
    if (!testType) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Selecione um tipo de teste"
      })
      return
    }

    if (!structure.metadata?.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Nome é obrigatório"
      })
      setActiveTab('overview')
      return
    }

    setIsSaving(true)

    // Save to localStorage via useDraft hook
    saveDraft({
      test_type: testType as TestType,
      structure
    })

    setIsSaving(false)

    toast({
      title: "Rascunho salvo",
      description: "Alterações salvas localmente. Use 'Publicar' quando pronto."
    })
  }

  const handlePublish = async () => {
    // Full validation for publishing
    if (!testType) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Selecione um tipo de teste"
      })
      return
    }

    if (!structure.metadata?.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Nome é obrigatório"
      })
      setActiveTab('overview')
      return
    }

    if (!structure.metadata?.description?.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Descrição é obrigatória"
      })
      setActiveTab('overview')
      return
    }

    if (structure.categories.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Adicione pelo menos uma categoria"
      })
      setActiveTab('structure')
      return
    }

    // Check if all categories have questions
    const emptyCat = structure.categories.find(c => c.questions.length === 0)
    if (emptyCat) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: `A categoria "${emptyCat.name}" não possui questões`
      })
      setActiveTab('structure')
      return
    }

    // Changelog OBRIGATÓRIO para publicar (quando editando)
    if (testStructure && !changelog.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Changelog é obrigatório para publicar nova versão"
      })
      return
    }

    setIsSaving(true)

    let result
    if (testStructure) {
      // Update (creates new version)
      result = await updateTestStructure(testStructure.id, {
        structure,
        changelog
      })
    } else {
      // Create
      result = await createTestStructure({
        test_type: testType as TestType,
        structure,
        changelog: changelog || 'Versão inicial'
      })
    }

    setIsSaving(false)

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao publicar",
        description: result.error
      })
      return
    }

    toast({
      title: "Publicado com sucesso",
      description: testStructure
        ? "Nova versão criada"
        : "Estrutura de teste criada"
    })

    // Clear draft after successful publish
    clearDraft()

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {testStructure
              ? `Editar ${TEST_TYPE_LABELS[testStructure.test_type]} (v${testStructure.version})`
              : 'Nova Estrutura de Teste'}
          </DialogTitle>
        </DialogHeader>

        {showDraftAlert && draftTimestamp && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Draft Encontrado
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">
                Encontramos um rascunho salvo {formatDistanceToNow(new Date(draftTimestamp), { addSuffix: true, locale: ptBR })}. Deseja recuperá-lo?
              </span>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={handleDiscardDraft}>
                  Descartar
                </Button>
                <Button size="sm" onClick={handleLoadDraft}>
                  Recuperar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Info className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="structure" className="gap-2">
              <FileText className="h-4 w-4" />
              Estrutura
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2">
              <Target className="h-4 w-4" />
              Pontuação
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <OverviewTab
              testType={testType}
              metadata={structure.metadata}
              isEditing={!!testStructure}
              changelog={changelog}
              onTestTypeChange={setTestType}
              onMetadataChange={(metadata) => setStructure({ ...structure, metadata })}
              onChangelogChange={setChangelog}
            />
          </TabsContent>

          <TabsContent value="structure" className="space-y-4 mt-4">
            <StructureTab
              categories={structure.categories}
              onCategoriesChange={(categories) => setStructure({ ...structure, categories })}
            />
          </TabsContent>

          <TabsContent value="scoring" className="space-y-4 mt-4">
            <ScoringTab
              scoring={structure.scoring}
              categories={structure.categories}
              onScoringChange={(scoring) => setStructure({ ...structure, scoring })}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            <PreviewTab structure={structure} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>

          {/* Salvar Rascunho - sem versionar */}
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : '💾 Salvar Rascunho'}
          </Button>

          {/* Publicar - cria nova versão */}
          <Button onClick={handlePublish} disabled={isSaving}>
            {isSaving ? 'Publicando...' : '🚀 Publicar' + (testStructure ? ' Nova Versão' : '')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
