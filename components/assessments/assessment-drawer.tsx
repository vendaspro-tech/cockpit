'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ResultsView } from '@/components/assessments/results-view'
import { DiscResults } from '@/components/assessments/disc-results'
import { Maximize2, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssessmentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: any
  result: any
  workspaceId: string
}

export function AssessmentDrawer({ 
  open, 
  onOpenChange, 
  assessment, 
  result,
  workspaceId 
}: AssessmentDrawerProps) {
  // Debug
  console.log('AssessmentDrawer render:', { 
    open, 
    hasAssessment: !!assessment, 
    hasResult: !!result,
    resultKeys: result ? Object.keys(result) : [],
    resultScoresKeys: result?.scores ? Object.keys(result.scores) : [],
    testType: assessment?.test_type
  })

  // Early return if no assessment to prevent null access errors
  if (!assessment) {
    console.log('AssessmentDrawer: No assessment provided, not rendering')
    return null
  }

  const TEST_TYPE_LABELS = {
    'seniority_seller': 'Senioridade Vendedor',
    'seniority_leader': 'Senioridade Líder',
    'def_method': 'Matriz DEF',
    'leadership_style': 'Estilo de Liderança',
    'values_8d': 'Mapa de Valores',
    'disc': 'Perfil DISC'
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[600px] md:w-[50vw] sm:max-w-none overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-background sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold text-foreground">
                {TEST_TYPE_LABELS[assessment.test_type as keyof typeof TEST_TYPE_LABELS] || assessment.test_type}
              </SheetTitle>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.updated_at 
                  ? `Concluída em ${format(new Date(assessment.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                  : 'Data não disponível'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${workspaceId}/assessments/${assessment.test_type}/${assessment.id}`}>
                <Button variant="ghost" size="sm">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Tela Cheia
                </Button>
              </Link>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="p-6">
          {result?.scores ? (
            assessment.test_type === 'disc' ? (
              <DiscResults 
                scores={result.scores} 
                profile={result.classification?.profile} 
              />
            ) : (
              <ResultsView 
                testType={assessment.test_type}
                result={result.scores}
              />
            )
          ) : assessment.status === 'completed' ? (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Resultados não disponíveis</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Esta avaliação foi concluída mas os resultados não foram calculados. 
                Clique em &quot;Tela Cheia&quot; para visualizar os detalhes completos.
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Esta avaliação ainda não foi concluída.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
