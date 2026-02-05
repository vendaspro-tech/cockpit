import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssessmentsView } from './components/assessments-view'
import { PDIsView } from './components/pdis-view'
import { getAdminAssessments, getAdminPDIs, getWorkspaces } from './actions'
import { Loader2 } from 'lucide-react'

export default async function AdminAssessmentsPDIsPage() {
  const [assessments, pdis, workspaces] = await Promise.all([
    getAdminAssessments(),
    getAdminPDIs(),
    getWorkspaces()
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Avaliações e PDIs</h2>
      </div>
      
      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          <TabsTrigger value="pdis">PDIs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assessments" className="space-y-4">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <AssessmentsView initialData={assessments} workspaces={workspaces} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="pdis" className="space-y-4">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <PDIsView initialData={pdis} workspaces={workspaces} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
