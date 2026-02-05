import { Badge } from '@/components/ui/badge'
import { KPITable } from './kpi-table'
import { ShoppingCart, Users, Megaphone, DollarSign } from 'lucide-react'
import type { KPI, KPICategory } from '@/app/(dashboard)/[workspaceId]/kpis/actions'

interface KPICategorySectionProps {
  category: KPICategory
  kpis: KPI[]
}

const categoryConfig: Record<KPICategory, { icon: React.ReactNode; gradient: string }> = {
  'Funil Venda Direta': {
    icon: <ShoppingCart className="w-5 h-5" />,
    gradient: 'from-blue-500 to-cyan-500'
  },
  'Funil Sessão Estratégica': {
    icon: <Users className="w-5 h-5" />,
    gradient: 'from-purple-500 to-pink-500'
  },
  'Marketing': {
    icon: <Megaphone className="w-5 h-5" />,
    gradient: 'from-orange-500 to-red-500'
  },
  'Financeiro': {
    icon: <DollarSign className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-500'
  }
}

export function KPICategorySection({ category, kpis }: KPICategorySectionProps) {
  const config = categoryConfig[category]
  
  return (
    <div className="mb-10">
      {/* Category Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
          {config.icon}
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {category}
          </h2>
          <Badge variant="outline" className="font-normal">
            {kpis.length} {kpis.length === 1 ? 'KPI' : 'KPIs'}
          </Badge>
        </div>
      </div>
      
      {/* KPI Table */}
      <KPITable kpis={kpis} />
    </div>
  )
}
