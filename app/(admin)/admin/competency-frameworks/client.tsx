'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Award, Target, Brain, Workflow } from "lucide-react"
import { CompetencyFrameworksTable } from "@/components/admin/competency-frameworks-table"
import { CompetencyFrameworkForm } from "@/components/admin/competency-framework-form"
import type { CompetencyFramework } from "@/lib/types/competency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { duplicateCompetencyFramework } from "@/app/actions/admin/competency-frameworks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface CompetencyFrameworksClientProps {
  initialFrameworks: (CompetencyFramework & { job_titles: any })[]
  jobTitles: Array<{ id: string; name: string; hierarchy_level: number }>
  stats?: {
    total: number
    avgBehavioral: number
    avgTechnical: number
    avgProcess: number
  }
  workspaceId?: string
}

export function CompetencyFrameworksClient({
  initialFrameworks,
  jobTitles,
  stats,
  workspaceId
}: CompetencyFrameworksClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFramework, setEditingFramework] = useState<(CompetencyFramework & { job_titles?: any }) | undefined>()
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<(CompetencyFramework & { job_titles?: any }) | null>(null)

  // Calculate stats from frameworks
  const calculatedStats = {
    total: initialFrameworks.length,
    avgBehavioral: initialFrameworks.length > 0
      ? Math.round(initialFrameworks.reduce((sum, fw) => sum + (fw.behavioral_competencies?.length || 0), 0) / initialFrameworks.length)
      : 0,
    avgTechnical: initialFrameworks.length > 0
      ? Math.round(initialFrameworks.reduce((sum, fw) => sum + (fw.technical_def_competencies?.length || 0), 0) / initialFrameworks.length)
      : 0,
    avgProcess: initialFrameworks.length > 0
      ? Math.round(initialFrameworks.reduce((sum, fw) => sum + (fw.process_competencies?.length || 0), 0) / initialFrameworks.length)
      : 0
  }

  const displayStats = stats || calculatedStats
  const [duplicateTargetJobTitle, setDuplicateTargetJobTitle] = useState<string>("")

  const handleEdit = (framework: CompetencyFramework & { job_titles: any }) => {
    setEditingFramework(framework)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingFramework(undefined)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingFramework(undefined)
  }

  const handleDuplicate = (framework: CompetencyFramework & { job_titles: any }) => {
    setDuplicateSource(framework)
    setDuplicateTargetJobTitle("")
    setDuplicateDialogOpen(true)
  }

  const handleDuplicateConfirm = async () => {
    if (!duplicateSource || !duplicateTargetJobTitle) return

    const result = await duplicateCompetencyFramework(duplicateSource.id, duplicateTargetJobTitle)

    if ('error' in result && result.error) {
      toast({
        variant: "destructive",
        title: "Erro ao duplicar",
        description: result.error
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Framework duplicado com sucesso"
      })
      setDuplicateDialogOpen(false)
      setDuplicateSource(null)
      setDuplicateTargetJobTitle("")
      router.refresh()
    }
  }

  // Filter available job titles for duplication (exclude those that already have frameworks)
  const availableJobTitlesForDuplicate = jobTitles.filter(jt =>
    !initialFrameworks.some(fw => fw.job_title_id === jt.id) &&
    jt.id !== duplicateSource?.job_title_id
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frameworks de Competências</h1>
          <p className="text-muted-foreground">
            Gerencie os frameworks de avaliação de competências por cargo
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Framework
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              templates globais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comportamentais</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.avgBehavioral}</div>
            <p className="text-xs text-muted-foreground">
              média por framework
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicas (DEF)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.avgTechnical}</div>
            <p className="text-xs text-muted-foreground">
              média por framework
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.avgProcess}</div>
            <p className="text-xs text-muted-foreground">
              média por framework
            </p>
          </CardContent>
        </Card>
      </div>

      <CompetencyFrameworksTable
        frameworks={initialFrameworks}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
      />

      <CompetencyFrameworkForm
        framework={editingFramework}
        workspaceId={workspaceId}
        jobTitles={jobTitles}
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        onCompleted={() => router.refresh()}
      />

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Framework</DialogTitle>
            <DialogDescription>
              Selecione o cargo de destino para duplicar o framework
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Framework de origem</Label>
              <div className="text-sm text-muted-foreground">
                {duplicateSource?.job_titles?.name || 'N/A'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-job-title">Cargo de destino *</Label>
              <Select
                value={duplicateTargetJobTitle}
                onValueChange={setDuplicateTargetJobTitle}
              >
                <SelectTrigger id="target-job-title">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {availableJobTitlesForDuplicate.length > 0 ? (
                    availableJobTitlesForDuplicate.map((jt) => (
                      <SelectItem key={jt.id} value={jt.id}>
                        {jt.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum cargo disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!duplicateTargetJobTitle}
            >
              Duplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
