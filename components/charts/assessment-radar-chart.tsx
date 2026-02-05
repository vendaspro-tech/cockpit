"use client"

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AssessmentRadarChartProps {
  title: string
  description?: string
  data: {
    subject: string
    A: number // Current Score
    B?: number // Previous Score or Benchmark
    fullMark: number
  }[]
  footer?: React.ReactNode
}

export function AssessmentRadarChart({ title, description, data, footer }: AssessmentRadarChartProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {title && <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4 text-center">{description}</p>}
      
      <div className="mx-auto aspect-square w-full max-w-[700px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 500 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickCount={6}
              axisLine={false}
            />
            <Radar
              name="Autoavaliação"
              dataKey="A"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="var(--primary)"
              fillOpacity={0.3}
            />
            {data && data.length > 0 && data[0].B !== undefined && (
              <Radar
                name="Gestor"
                dataKey="B"
                stroke="var(--chart-2)" 
                strokeWidth={3}
                fill="var(--chart-2)"
                fillOpacity={0.3}
              />
            )}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--popover)',
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--popover-foreground)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
