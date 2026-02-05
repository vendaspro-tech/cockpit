import { createClient } from "@/lib/supabase/server"
import { JobTitlesTable } from "./job-titles-table"
import { OrgChartClient } from "./org-chart-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Table } from "lucide-react"

interface JobTitlePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function JobTitlesPage({ params }: JobTitlePageProps) {
  const { workspaceId } = await params
  const supabase = await createClient()

  // Fetch all global job titles (excluding non-commercial roles)
  const { data: jobTitles } = await supabase
    .from('job_titles')
    .select('*')
    .not('slug', 'is', null)
    .not('slug', 'eq', 'empresario')
    .order('hierarchy_level', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cargos Vendas Pro</h1>
        <p className="text-muted-foreground mt-2">
          Conheça todos os cargos, hierarquia, etc. Clique em um cargo para ver detalhes.
        </p>
      </div>

      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="w-fit">
          <TabsTrigger value="table" className="gap-2">
            <Table className="w-4 h-4" />
            Tabela
          </TabsTrigger>
          <TabsTrigger value="orgchart" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Organograma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orgchart">
          <OrgChartClient jobTitles={jobTitles || []} workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="table">
          <JobTitlesTable jobTitles={jobTitles || []} workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
