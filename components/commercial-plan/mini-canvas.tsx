'use client'

import { CommercialPlan } from '@/app/actions/commercial-plans'
import { Card } from '@/components/ui/card'
import { ArrowRight, Target, Split, Building2, Package, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MiniCanvasProps {
  plan: CommercialPlan
  onNodeClick?: (tab: string) => void
}

export function MiniCanvas({ plan, onNodeClick }: MiniCanvasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: plan.currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  }

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-auto">
      <div className="flex items-center gap-4 min-w-max">
        {/* Meta Node */}
        <div
          onClick={() => onNodeClick?.('overview')}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 bg-background cursor-pointer",
            "hover:border-primary hover:shadow-md transition-all"
          )}
        >
          <Target className="h-6 w-6 text-primary" />
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground">Meta {plan.year}</div>
            <div className="text-sm font-bold">{formatCurrency(plan.global_target)}</div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground" />

        {/* Split Node (if using attribution) */}
        {plan.marketing_share && plan.commercial_share && (
          <>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 bg-background">
              <Split className="h-6 w-6 text-orange-500" />
              <div className="text-center">
                <div className="text-xs font-medium text-muted-foreground">Split</div>
                <div className="text-xs">
                  MKT {(plan.marketing_share * 100).toFixed(0)}% / 
                  COM {(plan.commercial_share * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </>
        )}

        {/* Squads/Products Node */}
        <div
          onClick={() => onNodeClick?.(plan.use_squads ? 'squads' : 'products')}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 bg-background cursor-pointer",
            "hover:border-primary hover:shadow-md transition-all"
          )}
        >
          {plan.use_squads ? (
            <Building2 className="h-6 w-6 text-blue-500" />
          ) : (
            <Package className="h-6 w-6 text-purple-500" />
          )}
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground">
              {plan.use_squads ? 'Squads' : 'Produtos'}
            </div>
            <div className="text-xs">-</div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground" />

        {/* Finance Node */}
        <div
          onClick={() => onNodeClick?.('finance')}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 bg-background cursor-pointer",
            "hover:border-primary hover:shadow-md transition-all"
          )}
        >
          <TrendingUp className="h-6 w-6 text-green-500" />
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground">KPIs</div>
            <div className="text-xs">CAC | ROI | Margem</div>
          </div>
        </div>
      </div>
    </div>
  )
}
