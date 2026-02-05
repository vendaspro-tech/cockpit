import { getJobTitle } from "@/app/actions/admin/job-titles"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { JobTitlePrintActions } from "@/components/admin/job-title-print-actions"
import { JobTitlePrintLayout } from "@/components/admin/job-title-print-layout"

export const dynamic = "force-dynamic"

const hierarchyLabels: Record<number, string> = {
  0: "Estratégico",
  1: "Tático",
  2: "Operacional",
  3: "Execução",
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

function formatFixed(
  fixed:
    | number
    | { type?: string; value?: number | null; min?: number | null; max?: number | null }
) {
  if (typeof fixed === "number") {
    return currencyFormatter.format(fixed)
  }

  if (fixed?.type === "range") {
    const min = fixed.min != null ? currencyFormatter.format(fixed.min) : ""
    const max = fixed.max != null ? currencyFormatter.format(fixed.max) : ""
    if (min && max) return `${min} — ${max}`
    return min || max || "-"
  }

  if (fixed?.type === "value" && fixed.value != null) {
    return currencyFormatter.format(fixed.value)
  }

  if (fixed && (fixed.min != null || fixed.max != null)) {
    const min = fixed.min != null ? currencyFormatter.format(fixed.min) : ""
    const max = fixed.max != null ? currencyFormatter.format(fixed.max) : ""
    if (min && max) return `${min} — ${max}`
    return min || max || "-"
  }

  if (fixed && fixed.value != null) {
    return currencyFormatter.format(fixed.value)
  }

  return "-"
}

export default async function JobTitlePrintPage({
  params,
}: {
  params: Promise<{ jobTitleId: string }>
}) {
  const { jobTitleId } = await params
  const jobTitleResult = await getJobTitle(jobTitleId)

  if ("error" in jobTitleResult || !jobTitleResult.data) {
    redirect("/admin/job-titles")
  }

  const jobTitle = jobTitleResult.data

  return (
    <JobTitlePrintLayout>
      <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8 print:p-0">
          <JobTitlePrintActions />

        <header className="page-break-avoid space-y-4 border-b-2 border-gray-900 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900">{jobTitle.name}</h1>
            {jobTitle.slug && (
              <Badge variant="secondary" className="text-xs">
                {jobTitle.slug}
              </Badge>
            )}
            {jobTitle.allows_seniority && (
              <Badge variant="outline" className="text-xs">
                Permite senioridade
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="font-medium">Nível {jobTitle.hierarchy_level}</span>
            <span>•</span>
            <span>{hierarchyLabels[jobTitle.hierarchy_level] || "—"}</span>
            <span>•</span>
            <span>Processo: {jobTitle.sector || "—"}</span>
          </div>
          {jobTitle.subordination && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Reporta para:</span> {jobTitle.subordination}
            </p>
          )}
        </header>

        {jobTitle.mission && (
          <section className="page-break-avoid space-y-3 rounded-lg bg-gray-50 p-6 print:bg-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Missão do Cargo</h2>
            <p className="text-base leading-relaxed text-gray-700">{jobTitle.mission}</p>
          </section>
        )}

        <section className="page-break-avoid space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Remuneração</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(["junior", "pleno", "senior"] as const).map((level) => (
              <div key={level} className="rounded-lg border-2 border-gray-300 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-gray-500">{level}</p>
                <p className="mt-2 text-xs text-gray-500">Salário fixo</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatFixed(jobTitle.remuneration[level].fixed)}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm italic text-gray-600">
            * Variável calculada por OTEs conforme share do comercial e ticket médio dos produtos.
          </p>
        </section>

        <section className="page-break-avoid grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Requisitos</h2>
            {jobTitle.requirements.education && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Educação:</span> {jobTitle.requirements.education}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Cursos obrigatórios</p>
              {jobTitle.requirements.mandatory_courses.length === 0 ? (
                <p className="text-sm italic text-gray-500">Nenhum curso informado.</p>
              ) : (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                  {jobTitle.requirements.mandatory_courses.map((course) => (
                    <li key={course}>{course}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Competências-chave</p>
              {jobTitle.requirements.key_competencies.length === 0 ? (
                <p className="text-sm italic text-gray-500">Nenhuma competência informada.</p>
              ) : (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                  {jobTitle.requirements.key_competencies.map((competency) => (
                    <li key={competency}>{competency}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">KPIs</h2>
            {jobTitle.kpis.length === 0 ? (
              <p className="text-sm italic text-gray-500">Nenhum KPI informado.</p>
            ) : (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                {jobTitle.kpis.map((kpi) => (
                  <li key={kpi}>{kpi}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Atividades Principais</h2>
            {jobTitle.main_activities.length === 0 ? (
              <p className="text-sm italic text-gray-500">Nenhuma atividade informada.</p>
            ) : (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                {jobTitle.main_activities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Desafios Comuns</h2>
            {jobTitle.common_challenges.length === 0 ? (
              <p className="text-sm italic text-gray-500">Nenhum desafio informado.</p>
            ) : (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                {jobTitle.common_challenges.map((challenge) => (
                  <li key={challenge}>{challenge}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="mt-8 border-t pt-4 text-center text-xs text-gray-500 print:mt-12">
          <p>Cockpit Comercial — Descrição de Cargo</p>
          <p className="mt-1">Gerado em {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}</p>
        </footer>
      </div>
    </div>
    </JobTitlePrintLayout>
  )
}
