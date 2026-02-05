'use client'

import { Card, CardContent } from '@/components/ui/card'

interface TeamOrganogramProps {
  sellersNeeded: number
  supervisorsNeeded: number
  coordinatorsNeeded: number
  sellerPerSupervisor: number
  supervisorPerCoordinator: number
}

export function TeamOrganogram({
  sellersNeeded,
  supervisorsNeeded,
  coordinatorsNeeded,
  sellerPerSupervisor,
  supervisorPerCoordinator
}: TeamOrganogramProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Coordenador */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex flex-col items-center gap-2 bg-purple-500/20 border-2 border-purple-500 rounded-lg px-6 py-3">
                <div className="text-xs text-purple-300 font-medium">Coordenador</div>
                <div className="text-2xl font-bold text-purple-100">{coordinatorsNeeded}</div>
              </div>
              {supervisorsNeeded > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Supervisores */}
          {supervisorsNeeded > 0 && (
            <div className="flex justify-center gap-12">
              {Array.from({ length: Math.min(supervisorsNeeded, 4) }).map((_, i) => (
                <div key={i} className="relative">
                  <div className="flex flex-col items-center gap-2 bg-blue-500/20 border-2 border-blue-500 rounded-lg px-5 py-2">
                    <div className="text-xs text-blue-300 font-medium">Supervisor</div>
                    <div className="text-xl font-bold text-blue-100">
                      {i === 3 && supervisorsNeeded > 4 ? `+${supervisorsNeeded - 3}` : '1'}
                    </div>
                  </div>
                  {sellersNeeded > 0 && i < Math.min(supervisorsNeeded, 2) && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vendedores */}
          {sellersNeeded > 0 && (
            <div className="flex justify-center gap-3">
              {Array.from({ length: Math.min(Math.ceil(sellersNeeded / supervisorsNeeded) * 2, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 bg-green-500/20 border border-green-500 rounded px-3 py-2"
                >
                  <div className="text-xs text-green-300">V</div>
                  <div className="text-sm font-semibold text-green-100">
                    {i === 9 && sellersNeeded > 10 ? `+${sellersNeeded - 9}` : '1'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="flex justify-center gap-6 pt-4 border-t border-muted-foreground/20">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Vendedores</div>
              <div className="text-lg font-bold">{sellersNeeded}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Supervisores</div>
              <div className="text-lg font-bold">{supervisorsNeeded}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Coordenadores</div>
              <div className="text-lg font-bold">{coordinatorsNeeded}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xl font-bold text-primary">
                {sellersNeeded + supervisorsNeeded + coordinatorsNeeded}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
