"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts'
import { DISC_PROFILES } from "@/lib/disc-data"

interface DiscResultsProps {
  scores: {
    D: number
    I: number
    S: number
    C: number
  }
  profile: string
}

export function DiscResults({ scores, profile }: DiscResultsProps) {
  const profileData = DISC_PROFILES[profile] || DISC_PROFILES[profile.substring(0, 1)] // Fallback to primary trait if combined not found

  const chartData = [
    { subject: 'Dominância', A: scores.D, fullMark: 96 },
    { subject: 'Influência', A: scores.I, fullMark: 96 },
    { subject: 'Estabilidade', A: scores.S, fullMark: 96 },
    { subject: 'Conformidade', A: scores.C, fullMark: 96 },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Gráfico Radar</CardTitle>
            <CardDescription>Visualização das suas 4 dimensões comportamentais</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 96]} />
                <Radar
                  name="Você"
                  dataKey="A"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profile Summary Section */}
        <Card className="flex flex-col bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-primary">Seu Perfil: {profile}</CardTitle>
              <Badge variant="outline" className="text-lg px-3 py-1 border-primary text-primary">
                {profileData?.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {profileData?.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Dominância (D)</span>
                <div className="text-2xl font-bold">{scores.D} <span className="text-xs font-normal text-muted-foreground">/ 96</span></div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Influência (I)</span>
                <div className="text-2xl font-bold">{scores.I} <span className="text-xs font-normal text-muted-foreground">/ 96</span></div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Estabilidade (S)</span>
                <div className="text-2xl font-bold">{scores.S} <span className="text-xs font-normal text-muted-foreground">/ 96</span></div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Conformidade (C)</span>
                <div className="text-2xl font-bold">{scores.C} <span className="text-xs font-normal text-muted-foreground">/ 96</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {profileData?.strengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              Áreas de Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {profileData?.development_areas.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              Funções Ideais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profileData?.ideal_roles.map((role, i) => (
                <Badge key={i} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
