'use client'

import React from 'react'
import Link from 'next/link'
import { BarChart3, Users, Target, Compass, Gem, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AssessmentHeroProps {
  testType: string
  testTitle: string
  testDescription: string
  currentCategory: string
  categoryIndex: number
  totalCategories: number
  progress: number
  answeredQuestions: number
  totalQuestions: number
  currentQuestionNumber?: number
  workspaceId?: string
  hideProgress?: boolean
}

const TEST_TYPE_ICONS = {
  'seniority_seller': BarChart3,
  'seniority_leader': Users,
  'def_method': Target,
  'leadership_style': Compass,
  'values_8d': Gem
}

const TEST_TYPE_GRADIENTS = {
  'seniority_seller': 'from-blue-600 to-cyan-600',
  'seniority_leader': 'from-purple-600 to-pink-600',
  'def_method': 'from-orange-600 to-red-600',
  'leadership_style': 'from-green-600 to-emerald-600',
  'values_8d': 'from-indigo-600 to-purple-600'
}

export function AssessmentHero({
  testType,
  testTitle,
  testDescription,
  currentCategory,
  categoryIndex,
  totalCategories,
  progress,
  answeredQuestions,
  totalQuestions,
  currentQuestionNumber,
  workspaceId,
  hideProgress = false
}: AssessmentHeroProps) {
  const backHref = workspaceId
    ? testType === 'def_method'
      ? `/${workspaceId}/def`
      : `/${workspaceId}/assessments`
    : undefined

  return (
    <div className="w-full bg-background border-b border-border/40 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Category */}
          <div className="relative flex items-center gap-3 md:block">
            {backHref && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground md:absolute md:-left-12 md:top-1/2 md:-translate-y-1/2"
                asChild
              >
                <Link href={backHref}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <div className="space-y-1">
              <h1 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{testTitle}</h1>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <span className="text-primary">{currentCategory}</span>
                {!hideProgress && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>Questão {currentQuestionNumber || (answeredQuestions + 1)} de {totalQuestions}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!hideProgress && (
            <div className="flex flex-col gap-2 min-w-[200px] md:w-64">
              <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Progresso</span>
                <span>{Math.round(progress)}% ({answeredQuestions}/{totalQuestions})</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
