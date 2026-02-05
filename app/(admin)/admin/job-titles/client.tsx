'use client'

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid, List, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobTitlesTable } from "@/components/admin/job-titles-table"
import { JobTitleForm } from "@/components/admin/job-title-form"
import type { JobTitle } from "@/lib/types/job-title"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobTitlesClientProps {
  initialJobTitles: JobTitle[]
  hierarchy: Record<number, JobTitle[]>
}

const hierarchyLabels = {
  0: { label: "Estratégico", description: "Nível C-Level, visão macro", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  1: { label: "Tático", description: "Coordenação e planejamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  2: { label: "Operacional", description: "Supervisão e gestão direta", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  3: { label: "Execução", description: "Operação e vendas", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" }
}

export function JobTitlesClient({
  initialJobTitles,
  hierarchy,
}: JobTitlesClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | undefined>()
  const duplicateSlugIds = useMemo(() => {
    const groups = new Map<string, string[]>()
    initialJobTitles.forEach((jobTitle) => {
      if (!jobTitle.slug) return
      const current = groups.get(jobTitle.slug) || []
      current.push(jobTitle.id)
      groups.set(jobTitle.slug, current)
    })

    const duplicates = new Set<string>()
    groups.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicates.add(id))
      }
    })
    return duplicates
  }, [initialJobTitles])
  const hasSlugDuplicates = duplicateSlugIds.size > 0

  const handleEdit = (jobTitle: JobTitle) => {
    setEditingJobTitle(jobTitle)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingJobTitle(undefined)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingJobTitle(undefined)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Cargos</h1>
          <p className="text-muted-foreground">
            Admin global de cargos. As mudanças refletem em todos os workspaces.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {hasSlugDuplicates && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="space-y-1">
              <p className="font-semibold">Slugs duplicados detectados</p>
              <p>Alguns cargos compartilham o mesmo slug. Ajuste-os para evitar conflitos em exports e APIs.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialJobTitles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estratégicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hierarchy[0]?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Táticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hierarchy[1]?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Operacionais + Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(hierarchy[2]?.length || 0) + (hierarchy[3]?.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">
            <List className="mr-2 h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Hierarquia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <JobTitlesTable
            jobTitles={initialJobTitles}
            duplicateJobTitleIds={duplicateSlugIds}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Visualize os cargos por nível hierárquico. Clique em um cargo para editar detalhes.
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {([0, 1, 2, 3] as const).map((level) => {
              const levelInfo = hierarchyLabels[level]
              const jobTitlesAtLevel = hierarchy[level] || []

              return (
                <div key={level} className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        Nível {level} — {levelInfo.label}
                      </h3>
                      <Badge className={levelInfo.color}>
                        {jobTitlesAtLevel.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
                  </div>

                  <div className="space-y-3">
                    {jobTitlesAtLevel.length === 0 ? (
                      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                        Nenhum cargo cadastrado neste nível.
                      </div>
                    ) : (
                      jobTitlesAtLevel.map((jobTitle) => (
                        <div
                          key={jobTitle.id}
                          className="cursor-pointer rounded-md border bg-card p-3 transition-colors hover:border-primary/60"
                          onClick={() => handleEdit(jobTitle)}
                        >
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">{jobTitle.name}</p>
                              {jobTitle.slug && (
                                <code className="text-xs text-muted-foreground">
                                  {jobTitle.slug}
                                </code>
                              )}
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>Processo: {jobTitle.sector || "—"}</p>
                              {jobTitle.subordination && (
                                <p>Reporta para: {jobTitle.subordination}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {jobTitle.kpis?.length || 0} KPIs
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {jobTitle.main_activities?.length || 0} Atividades
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <JobTitleForm
        jobTitle={editingJobTitle}
        jobTitles={initialJobTitles}
        open={isFormOpen}
        onOpenChange={handleCloseForm}
      />
    </div>
  )
}
