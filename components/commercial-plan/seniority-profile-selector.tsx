'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export const SENIORITY_PROFILES = {
  junior: {
    name: 'Time Júnior',
    description: 'Mais acessível, maior rotatividade',
    distribution: { junior: 0.6, pleno: 0.3, senior: 0.1 }
  },
  balanced: {
    name: 'Time Balanceado',
    description: 'Equilíbrio - Padrão do mercado',
    distribution: { junior: 0.3, pleno: 0.5, senior: 0.2 }
  },
  senior: {
    name: 'Time Sênior',
    description: 'Alto conhecimento, maior custo',
    distribution: { junior: 0.1, pleno: 0.3, senior: 0.6 }
  }
} as const

export type SeniorityProfileKey = keyof typeof SENIORITY_PROFILES

interface SeniorityProfileSelectorProps {
  selectedProfile: SeniorityProfileKey
  onProfileChange: (profile: SeniorityProfileKey) => void
}

function ProfileBar({ junior, pleno, senior }: { junior: number; pleno: number; senior: number }) {
  return (
    <div className="flex h-8 w-full rounded-full overflow-hidden border border-muted-foreground/20">
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

export function SeniorityProfileSelector({ selectedProfile, onProfileChange }: SeniorityProfileSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Perfil de Senioridade</CardTitle>
        <CardDescription>
          Escolha um perfil ou customize a distribuição de júnior, pleno e sênior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedProfile} onValueChange={(v) => onProfileChange(v as SeniorityProfileKey)}>
          <div className="space-y-4">
            {Object.entries(SENIORITY_PROFILES).map(([key, profile]) => (
              <div key={key} className="flex items-start space-x-3">
                <RadioGroupItem value={key} id={key} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key} className="font-semibold cursor-pointer">
                      {profile.name}
                    </Label>
                    <span className="text-xs text-muted-foreground">{profile.description}</span>
                  </div>
                  <ProfileBar {...profile.distribution} />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Júnior</span>
                    <span>Pleno</span>
                    <span>Sênior</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Júnior</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Pleno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Sênior</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
