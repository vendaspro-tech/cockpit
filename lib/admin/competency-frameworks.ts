import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"

import type {
  CompetencyFramework,
  CompetencyWeights,
  CompetencyDefinition,
  ScoringRanges,
} from "@/lib/types/competency"

export type AdminSupabaseClient = SupabaseClient

const COMPETENCY_FRAMEWORKS_TABLE = "competency_frameworks"

const CompetencyDefinitionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  description: z.string().optional(),
  levels: z.record(z.string(), z.string()).optional(),
})

const WeightsSchema = z
  .object({
    behavioral: z.number().min(0).max(1),
    technical_def: z.number().min(0).max(1),
    process: z.number().min(0).max(1),
  })
  .refine(
    (data) => {
      const sum = data.behavioral + data.technical_def + data.process
      return Math.abs(sum - 1) < 1e-6
    },
    { message: "A soma dos pesos deve ser 1.0" }
  )

const ScoringRangeSchema = z.tuple([
  z.number().min(0).max(100),
  z.number().min(0).max(100),
])

const ScoringRangesSchema: z.ZodType<ScoringRanges> = z.object({
  behavioral: z.object({
    junior: ScoringRangeSchema,
    pleno: ScoringRangeSchema,
    senior: ScoringRangeSchema,
  }),
  technical_def: z.object({
    junior: ScoringRangeSchema,
    pleno: ScoringRangeSchema,
    senior: ScoringRangeSchema,
  }),
  process: z.object({
    junior: ScoringRangeSchema,
    pleno: ScoringRangeSchema,
    senior: ScoringRangeSchema,
  }),
  global: z.object({
    junior: ScoringRangeSchema,
    pleno: ScoringRangeSchema,
    senior: ScoringRangeSchema,
  }),
})

export const CreateFrameworkVersionSchema = z.object({
  job_title_id: z.string().uuid(),
  parent_framework_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).optional(),
  weights: WeightsSchema.optional(),
  behavioral_competencies: z.array(CompetencyDefinitionSchema).optional(),
  technical_def_competencies: z.array(CompetencyDefinitionSchema).optional(),
  process_competencies: z.array(CompetencyDefinitionSchema).optional(),
  scoring_ranges: ScoringRangesSchema.optional(),
  is_active: z.boolean().optional(),
  published_at: z.string().datetime().optional(),
  // Contract mentions "structure"; we accept it but map it to legacy fields when possible.
  structure: z
    .object({
      dimensions: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          weight: z.number(),
          competencies: z
            .array(
              z.object({
                id: z.string().optional(),
                name: z.string(),
                weight: z.number().optional(),
                description: z.string().optional(),
              })
            )
            .default([]),
        })
      ),
    })
    .optional(),
})

export async function adminListCompetencyFrameworks(
  client: AdminSupabaseClient,
  filters?: {
    job_title_id?: string
    search?: string
    includeInactive?: boolean
  }
) {
  let query = client
    .from(COMPETENCY_FRAMEWORKS_TABLE)
    .select(
      `
      *,
      job_titles!inner (
        id,
        name,
        slug,
        hierarchy_level,
        sector
      )
    `
    )
    .eq("is_template", true)
    .is("workspace_id", null)
    .order("created_at", { ascending: false })

  if (filters?.job_title_id) {
    query = query.eq("job_title_id", filters.job_title_id)
  }

  if (!filters?.includeInactive) {
    query = query.eq("is_active", true)
  }

  if (filters?.search) {
    query = query.or(`job_titles.name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching competency frameworks:", error)
    return { error: "Erro ao buscar frameworks de competência" }
  }

  return { data: (data as (CompetencyFramework & { job_titles: any })[]) || [] }
}

type CreateTemplatePayload = {
  job_title_id: string
  name: string
  weights: CompetencyWeights
  behavioral_competencies: CompetencyDefinition[]
  technical_def_competencies: CompetencyDefinition[]
  process_competencies: CompetencyDefinition[]
  scoring_ranges: ScoringRanges
  created_by: string
  published_at: string
}

function normalizeWeightsFromStructure(structure: z.infer<typeof CreateFrameworkVersionSchema>[
  "structure"
]): CompetencyWeights | null {
  if (!structure?.dimensions?.length) return null

  const normalizeWeight = (value: number) => {
    if (value <= 1) return value
    return value / 100
  }

  const byKey: Partial<Record<keyof CompetencyWeights, number>> = {}

  for (const dim of structure.dimensions) {
    const dimKey = `${dim.id ?? ""} ${dim.name ?? ""}`.toLowerCase()

    if (dimKey.includes("behav") || dimKey.includes("comport")) {
      byKey.behavioral = normalizeWeight(dim.weight)
    } else if (dimKey.includes("tech") || dimKey.includes("def")) {
      byKey.technical_def = normalizeWeight(dim.weight)
    } else if (dimKey.includes("process") || dimKey.includes("processo")) {
      byKey.process = normalizeWeight(dim.weight)
    }
  }

  if (
    byKey.behavioral === undefined ||
    byKey.technical_def === undefined ||
    byKey.process === undefined
  ) {
    return null
  }

  return {
    behavioral: byKey.behavioral,
    technical_def: byKey.technical_def,
    process: byKey.process,
  }
}

function normalizeCompetenciesFromStructure(
  structure: z.infer<typeof CreateFrameworkVersionSchema>["structure"]
): {
  behavioral_competencies: CompetencyDefinition[]
  technical_def_competencies: CompetencyDefinition[]
  process_competencies: CompetencyDefinition[]
} | null {
  if (!structure?.dimensions?.length) return null

  const empty = {
    behavioral_competencies: [] as CompetencyDefinition[],
    technical_def_competencies: [] as CompetencyDefinition[],
    process_competencies: [] as CompetencyDefinition[],
  }

  const toLegacy = (items: { id?: string; name: string; description?: string }[]) =>
    items.map((c, index) => {
      const asNumber = c.id ? Number(c.id) : NaN
      return {
        id: Number.isFinite(asNumber) ? asNumber : index + 1,
        name: c.name,
        description: c.description,
      } satisfies CompetencyDefinition
    })

  for (const dim of structure.dimensions) {
    const dimKey = `${dim.id ?? ""} ${dim.name ?? ""}`.toLowerCase()
    const comps = toLegacy(dim.competencies)

    if (dimKey.includes("behav") || dimKey.includes("comport")) {
      empty.behavioral_competencies = comps
    } else if (dimKey.includes("tech") || dimKey.includes("def")) {
      empty.technical_def_competencies = comps
    } else if (dimKey.includes("process") || dimKey.includes("processo")) {
      empty.process_competencies = comps
    }
  }

  return empty
}

function defaultScoringRanges(): ScoringRanges {
  const junior: [number, number] = [0, 60]
  const pleno: [number, number] = [61, 80]
  const senior: [number, number] = [81, 100]

  return {
    behavioral: { junior, pleno, senior },
    technical_def: { junior, pleno, senior },
    process: { junior, pleno, senior },
    global: { junior, pleno, senior },
  }
}

async function setOtherTemplatesInactive(client: AdminSupabaseClient, jobTitleId: string, keepId?: string) {
  let query = client
    .from(COMPETENCY_FRAMEWORKS_TABLE)
    .update({ is_active: false })
    .eq("job_title_id", jobTitleId)
    .eq("is_template", true)
    .is("workspace_id", null)
    .eq("is_active", true)

  if (keepId) {
    query = query.neq("id", keepId)
  }

  const { error } = await query
  if (error) {
    console.error("Error deactivating previous templates:", error)
    return { error: "Erro ao desativar template anterior" }
  }

  return { success: true }
}

export async function adminCreateCompetencyFrameworkVersion(
  client: AdminSupabaseClient,
  actorUserId: string,
  input: z.infer<typeof CreateFrameworkVersionSchema>
) {
  const validated = CreateFrameworkVersionSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Dados inválidos", details: validated.error.flatten() }
  }

  const nowIso = new Date().toISOString()

  // Determine active template (for deactivation) and optional explicit parent.
  const { data: currentActive } = await client
    .from(COMPETENCY_FRAMEWORKS_TABLE)
    .select("*")
    .eq("job_title_id", validated.data.job_title_id)
    .eq("is_template", true)
    .is("workspace_id", null)
    .eq("is_active", true)
    .maybeSingle()

  const active = (currentActive as CompetencyFramework | null) ?? null

  let parent: CompetencyFramework | null = null
  if (validated.data.parent_framework_id) {
    const { data: parentRow } = await client
      .from(COMPETENCY_FRAMEWORKS_TABLE)
      .select("*")
      .eq("id", validated.data.parent_framework_id)
      .eq("job_title_id", validated.data.job_title_id)
      .eq("is_template", true)
      .is("workspace_id", null)
      .maybeSingle()

    parent = (parentRow as CompetencyFramework | null) ?? null
  }

  const previous = parent ?? active

  const derivedWeights = normalizeWeightsFromStructure(validated.data.structure) ?? null
  const derivedCompetencies = normalizeCompetenciesFromStructure(validated.data.structure) ?? null

  const payload: CreateTemplatePayload = {
    job_title_id: validated.data.job_title_id,
    name: validated.data.name ?? previous?.name ?? "Framework de Competências",
    weights: (validated.data.weights ?? derivedWeights ?? previous?.weights ?? {
      behavioral: 0.5,
      technical_def: 0.3,
      process: 0.2,
    }) as CompetencyWeights,
    behavioral_competencies:
      (validated.data.behavioral_competencies ??
        derivedCompetencies?.behavioral_competencies ??
        previous?.behavioral_competencies ??
        []) as CompetencyDefinition[],
    technical_def_competencies:
      (validated.data.technical_def_competencies ??
        derivedCompetencies?.technical_def_competencies ??
        previous?.technical_def_competencies ??
        []) as CompetencyDefinition[],
    process_competencies:
      (validated.data.process_competencies ??
        derivedCompetencies?.process_competencies ??
        previous?.process_competencies ??
        []) as CompetencyDefinition[],
    scoring_ranges: (validated.data.scoring_ranges ?? previous?.scoring_ranges ?? defaultScoringRanges()) as ScoringRanges,
    created_by: actorUserId,
    published_at: validated.data.published_at ?? nowIso,
  }

  // Next version = max(version) + 1 for this job title.
  const { data: latest } = await client
    .from(COMPETENCY_FRAMEWORKS_TABLE)
    .select("version")
    .eq("job_title_id", validated.data.job_title_id)
    .eq("is_template", true)
    .is("workspace_id", null)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestVersion = typeof (latest as any)?.version === "number" ? (latest as any).version : 0
  const nextVersion = latestVersion + 1

  // Deactivate current active template first; if insertion fails, try to restore.
  if (active?.id) {
    const { error: deactivateError } = await client
      .from(COMPETENCY_FRAMEWORKS_TABLE)
      .update({ is_active: false })
      .eq("id", active.id)

    if (deactivateError) {
      console.error("Error deactivating current template:", deactivateError)
      return { error: "Erro ao desativar template anterior" }
    }
  }

  const toInsert = {
    workspace_id: null,
    job_title_id: payload.job_title_id,
    name: payload.name,
    weights: payload.weights,
    behavioral_competencies: payload.behavioral_competencies,
    technical_def_competencies: payload.technical_def_competencies,
    process_competencies: payload.process_competencies,
    scoring_ranges: payload.scoring_ranges,
    is_template: true,
    parent_framework_id: previous?.id ?? null,
    version: nextVersion,
    is_active: true,
    created_by: payload.created_by,
    published_at: payload.published_at,
  }

  const { data: created, error: insertError } = await client
    .from(COMPETENCY_FRAMEWORKS_TABLE)
    .insert(toInsert)
    .select("*")
    .single()

  if (insertError) {
    console.error("Error creating competency framework version:", insertError)

    if (active?.id) {
      await client
        .from(COMPETENCY_FRAMEWORKS_TABLE)
        .update({ is_active: true })
        .eq("id", active.id)
    }

    return { error: "Erro ao criar nova versão do framework" }
  }

  // Ensure no other templates remain active (best-effort)
  await setOtherTemplatesInactive(client, payload.job_title_id, created.id)

  return { data: created as CompetencyFramework, previous }
}
