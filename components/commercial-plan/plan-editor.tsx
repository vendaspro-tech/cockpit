'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CommercialPlan } from '@/app/actions/commercial-plans'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MiniCanvas } from './mini-canvas'
import { OverviewTab } from './overview-tab'
import { ProductsTab } from './products-tab'
import { OTEsTab } from './otes-tab'
import { TeamTab } from './team-tab'
import { FinanceTab } from './finance-tab'
import { SquadsTab } from './squads-tab'
import { Building2, Package, DollarSign, Users, TrendingUp } from 'lucide-react'

interface PlanEditorProps {
  plan: CommercialPlan
}

export function PlanEditor({ plan }: PlanEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Mini-Canvas - 150px height */}
      <div className="h-[150px] border-b bg-muted/30">
        <MiniCanvas plan={plan} onNodeClick={setActiveTab} />
      </div>

      {/* Tabs Section */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b bg-background sticky top-0 z-10">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="gap-2 data-[state=active]:bg-background"
              >
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              
              <TabsTrigger 
                value="products"
                className="gap-2 data-[state=active]:bg-background"
              >
                <Package className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              
              {plan.use_squads && (
                <TabsTrigger 
                  value="squads"
                  className="gap-2 data-[state=active]:bg-background"
                >
                  <Building2 className="h-4 w-4" />
                  Squads
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="otes"
                className="gap-2 data-[state=active]:bg-background"
              >
                <DollarSign className="h-4 w-4" />
                OTEs
              </TabsTrigger>
              
              <TabsTrigger 
                value="team"
                className="gap-2 data-[state=active]:bg-background"
              >
                <Users className="h-4 w-4" />
                Time
              </TabsTrigger>
              
              <TabsTrigger 
                value="finance"
                className="gap-2 data-[state=active]:bg-background"
              >
                <TrendingUp className="h-4 w-4" />
                Finanças
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab plan={plan} onUpdate={handleUpdate} />
            </TabsContent>

            <TabsContent value="products" className="mt-0">
              <ProductsTab plan={plan} />
            </TabsContent>

            {plan.use_squads && (
              <TabsContent value="squads" className="mt-0">
                <SquadsTab plan={plan} />
              </TabsContent>
            )}

            <TabsContent value="otes" className="mt-0">
              <OTEsTab plan={plan} />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <TeamTab plan={plan} />
            </TabsContent>

            <TabsContent value="finance" className="mt-0">
              <FinanceTab plan={plan} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
