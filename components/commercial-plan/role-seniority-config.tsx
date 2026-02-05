'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'

export const SENIORITY_PROFILES = {
  junior: {
    name: 'Time Júnior',
    description: 'Maior volume, menor custo',
    distribution: { junior: 0.6, pleno: 0.3, senior: 0.1 },
    bestFor: ['Vendedores', 'SDRs']
  },
  balanced: {
    name: 'Time Balanceado',
    description: 'Equilíbrio ideal',
    distribution: { junior: 0.3, pleno: 0.5, senior: 0.2 },
    bestFor: ['Supervisores', 'Inside Sales']
  },
  senior: {
    name: 'Time Sênior',
    description: 'Alta experiência, maior custo',
    distribution: { junior: 0.1, pleno: 0.3, senior: 0.6 },
    bestFor: ['Coordenadores', 'Liderança']
  }
} as const

export type SeniorityProfileKey = keyof typeof SENIORITY_PROFILES

interface RoleSeniorityConfigProps {
  role: 'seller' | 'supervisor' | 'coordinator'
  roleName: string
  headcount: number
  selectedProfile: SeniorityProfileKey
  onProfileChange: (profile: SeniorityProfileKey) => void
  otes?: { junior: number; pleno: number; senior: number }
}

function ProfileBar({ junior, pleno, senior }: { junior: number; pleno: number; senior: number }) {
  return (
    <div className="flex h-6 w-full rounded-full overflow-hidden border border-muted-foreground/20">
      <div 
        className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
        style={{ width: `${junior * 100}%` }}
      >
        {junior > 0.15 && `${(junior * 100).toFixed(0)}%`}
      </div>
      <div 
        className="bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
        style={{ width: `${pleno * 100}%` }}
      >
        {pleno > 0.15 && `${(pleno * 100).toFixed(0)}%`}
      </div>
      <div 
        className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
        style={{ width: `${senior * 100}%` }}
      >
        {senior > 0.15 && `${(senior * 100).toFixed(0)}%`}
      </div>
    </div>
  )
}

export function RoleSeniorityConfig({
  role,
  roleName,
  headcount,
  selectedProfile,
  onProfileChange,
  otes
}: RoleSeniorityConfigProps) {
  const selectedDist = SENIORITY_PROFILES[selectedProfile].distribution
  
  // Calculate breakdown
  const breakdown = {
    junior: Math.ceil(headcount * selectedDist.junior),
    pleno: Math.ceil(headcount * selectedDist.pleno),
    senior: Math.ceil(headcount * selectedDist.senior)
  }

  // Calculate cost if OTEs available
  const totalCost = otes ? (
    breakdown.junior * otes.junior +
    breakdown.pleno * otes.pleno +
    breakdown.senior * otes.senior
  ) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{roleName}</CardTitle>
          <Badge variant="secondary">{headcount} {headcount === 1 ? 'pessoa' : 'pessoas'}</Badge>
        </div>
        <CardDescription>
          Escolha o perfil de senioridade para {roleName.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedProfile} onValueChange={(v) => onProfileChange(v as SeniorityProfileKey)}>
          <div className="space-y-3">
            {Object.entries(SENIORITY_PROFILES).map(([key, profile]) => (
              <div key={key} className="flex items-start space-x-3">
                <RadioGroupItem value={key} id={`${role}-${key}`} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${role}-${key}`} className="font-medium cursor-pointer">
                      {profile.name}
                    </Label>
                    <span className="text-xs text-muted-foreground">{profile.description}</span>
                  </div>
                  <ProfileBar {...profile.distribution} />
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Breakdown */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">→ Resultado:</span>
            <span className="font-medium">
              {breakdown.junior} Jr + {breakdown.pleno} Pl + {breakdown.senior} Sr
            </span>
          </div>

          {/* Cost if available */}
          {totalCost !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">→ Custo médio:</span>
              <span className="font-semibold text-primary">
                R$ {totalCost.toLocaleString('pt-BR')}/mês
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
