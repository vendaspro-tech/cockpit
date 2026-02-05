"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface HeatmapData {
  category: string
  score: number // 0-100
  items: {
    name: string
    score: number
  }[]
}

interface TeamBottleneckHeatmapProps {
  title: string
  description?: string
  data: HeatmapData[]
}

export function TeamBottleneckHeatmap({ title, description, data }: TeamBottleneckHeatmapProps) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-green-300"
    if (score >= 40) return "bg-yellow-400"
    if (score >= 20) return "bg-orange-400"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{category.category}</span>
                <span className="text-muted-foreground">{category.score}%</span>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {category.items.map((item, i) => (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "h-8 w-full rounded-sm transition-all hover:opacity-80 cursor-help",
                            getColor(item.score)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs">Score: {item.score}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span>Crítico</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-400 rounded-sm" />
            <span>Baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
            <span>Médio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-300 rounded-sm" />
            <span>Bom</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span>Excelente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
