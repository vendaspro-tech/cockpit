'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth-server"
import { writeAuditLog } from "@/lib/audit"
import { adminCreateCompetencyFrameworkVersion } from "@/lib/admin/competency-frameworks"
import type {
  CompetencyFramework,
  CreateCompetencyFrameworkInput,
  UpdateCompetencyFrameworkInput,
  CompetencyDefinition,
  ScoringRange
} from "@/lib/types/competency"

// Validation Schemas

const CompetencyDefinitionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  description: z.string().optional(),
  levels: z.record(z.string(), z.string()).optional(),
})

const RangeTupleSchema = z.tuple([
  z.number().min(0).max(100),
  z.number().min(0).max(100),
])

const RangeObjectSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
})

const ScoreLevelSchema = z.union([RangeTupleSchema, RangeObjectSchema]).transform((value) => {
  if (Array.isArray(value)) return value as [number, number]
  return [value.min, value.max] as [number, number]
})

const ScoringRangesSchema = z.object({
  behavioral: z.object({
    junior: ScoreLevelSchema,
    pleno: ScoreLevelSchema,
    senior: ScoreLevelSchema,
  }),
  technical_def: z.object({
    junior: ScoreLevelSchema,
    pleno: ScoreLevelSchema,
    senior: ScoreLevelSchema,
  }),
  process: z.object({
    junior: ScoreLevelSchema,
    pleno: ScoreLevelSchema,
    senior: ScoreLevelSchema,
  }),
  global: z.object({
    junior: ScoreLevelSchema,
    pleno: ScoreLevelSchema,
    senior: ScoreLevelSchema,
  }),
})

const WeightsSchema = z
  .object({
    behavioral: z.number().min(0).max(100).default(0.5),
    technical_def: z.number().min(0).max(100).default(0.3),
    process: z.number().min(0).max(100).default(0.2),
  })
  .superRefine((data, ctx) => {
    const sum = data.behavioral + data.technical_def + data.process
    const close = (a: number, b: number) => Math.abs(a - b) < 1e-6

    if (!close(sum, 1) && !close(sum, 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A soma dos pesos deve ser 1.0 (decimais) ou 100 (percentual)",
      })
    }
  })
  .transform((data) => {
    const sum = data.behavioral + data.technical_def + data.process
    const usePercent = sum > 1.5
    return {
      behavioral: usePercent ? data.behavioral / 100 : data.behavioral,
      technical_def: usePercent ? data.technical_def / 100 : data.technical_def,
      process: usePercent ? data.process / 100 : data.process,
    }
  })

const CreateCompetencyFrameworkSchema = z.object({
  workspace_id: z.string().uuid().nullable().optional(),
  job_title_id: z.string().uuid(),
  name: z.string().min(1, "Nome é obrigatório"),
  weights: WeightsSchema,
  behavioral_competencies: z.array(CompetencyDefinitionSchema).min(1, "Pelo menos uma competência comportamental é obrigatória"),
  technical_def_competencies: z.array(CompetencyDefinitionSchema).optional(),
  process_competencies: z.array(CompetencyDefinitionSchema).optional(),
  scoring_ranges: ScoringRangesSchema,
  is_template: z.boolean().default(false),
  parent_framework_id: z.string().uuid().nullable().optional(),
  version: z.number().int().default(1),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().nullable().optional(),
  published_at: z.string().nullable().optional()
})

const UpdateCompetencyFrameworkSchema = CreateCompetencyFrameworkSchema.partial().omit({
  workspace_id: true,
  job_title_id: true
})

// Actions

export async function listCompetencyFrameworks(options?: {
  includeTemplates?: boolean;
  workspaceId?: string;
  job_title_id?: string;
  search?: string;
}) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  let query = supabase
    .from('competency_frameworks')
    .select(`
      *,
      job_titles!inner (
        id,
        name,
        slug,
        hierarchy_level,
        sector
      )
    `)
    .order('created_at', { ascending: false })

  // By default, list only global templates (for admin interface)
  if (options?.includeTemplates !== false) {
    query = query.eq('is_template', true).is('workspace_id', null)
  }

  // If workspaceId provided, list workspace-specific frameworks
  if (options?.workspaceId) {
    query = query.eq('workspace_id', options.workspaceId)
  }

  if (options?.job_title_id) {
    query = query.eq('job_title_id', options.job_title_id)
  }

  if (options?.search) {
    query = query.or(`job_titles.name.ilike.%${options.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching competency frameworks:', error)
    return { error: 'Erro ao buscar frameworks de competência' }
  }

  return { data: data as (CompetencyFramework & { job_titles: any })[] }
}

export async function getCompetencyFramework(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('competency_frameworks')
    .select(`
      *,
      job_titles (
        id,
        name,
        slug,
        hierarchy_level,
        sector,
        allows_seniority
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching competency framework:', error)
    return { error: 'Erro ao buscar framework de competência' }
  }

  return { data: data as CompetencyFramework & { job_titles: any } }
}

export async function getCompetencyFrameworkByJobTitle(jobTitleId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('competency_frameworks')
    .select(`
      *,
      job_titles (
        id,
        name,
        slug,
        hierarchy_level,
        sector,
        allows_seniority
      )
    `)
    .eq('job_title_id', jobTitleId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching competency framework by job title:', error)
    return { error: 'Erro ao buscar framework de competência' }
  }

  return { data: data as (CompetencyFramework & { job_titles: any }) | null }
}

export async function createCompetencyFramework(input: CreateCompetencyFrameworkInput) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = CreateCompetencyFrameworkSchema.safeParse(input)
  if (!validated.success) {
    return { error: 'Dados inválidos', details: validated.error.flatten() }
  }

  const supabase = createAdminClient()

  // Check if template already exists for this job title (only for templates)
  if (validated.data.is_template) {
    const { data: existing } = await supabase
      .from('competency_frameworks')
      .select('id')
      .eq('job_title_id', validated.data.job_title_id)
      .eq('is_template', true)
      .eq('is_active', true)
      .is('workspace_id', null)
      .maybeSingle()

    if (existing) {
      return { error: 'Já existe um template ativo para este cargo' }
    }
  }

  // For workspace-specific frameworks
  if (validated.data.workspace_id && !validated.data.is_template) {
    const { data: existing } = await supabase
      .from('competency_frameworks')
      .select('id')
      .eq('workspace_id', validated.data.workspace_id)
      .eq('job_title_id', validated.data.job_title_id)
      .maybeSingle()

    if (existing) {
      return { error: 'Já existe um framework para este cargo neste workspace' }
    }
  }

  // Add created_by if creating template
  const dataToInsert = {
    ...validated.data,
    created_by: validated.data.is_template ? user.id : validated.data.created_by
  }

  const { data: framework, error } = await supabase
    .from('competency_frameworks')
    .insert(dataToInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating competency framework:', error)
    return { error: 'Erro ao criar framework de competência' }
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: 'competency_framework.created',
    entityType: 'competency_framework',
    entityId: (framework as any)?.id ?? null,
    before: null,
    after: framework,
    metadata: {
      job_title_id: (framework as any)?.job_title_id,
      is_template: (framework as any)?.is_template,
      version: (framework as any)?.version,
      is_active: (framework as any)?.is_active,
    },
    client: supabase,
  })

  revalidatePath('/admin/competency-frameworks')
  return { data: framework as CompetencyFramework }
}

export async function updateCompetencyFramework(id: string, input: UpdateCompetencyFrameworkInput) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = UpdateCompetencyFrameworkSchema.safeParse(input)
  if (!validated.success) {
    return { error: 'Dados inválidos', details: validated.error.flatten() }
  }

  const supabase = createAdminClient()

  const { data: current, error: fetchError } = await supabase
    .from('competency_frameworks')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !current) {
    console.error('Error fetching current competency framework:', fetchError)
    return { error: 'Erro ao buscar framework de competência' }
  }

  const isTemplate = Boolean(current.is_template) && current.workspace_id === null

  // For global templates, updates create a NEW VERSION and publish it.
  if (isTemplate) {
    const merged = {
      name: validated.data.name ?? current.name,
      weights: (validated.data as any).weights ?? current.weights,
      behavioral_competencies: (validated.data as any).behavioral_competencies ?? current.behavioral_competencies,
      technical_def_competencies: (validated.data as any).technical_def_competencies ?? current.technical_def_competencies,
      process_competencies: (validated.data as any).process_competencies ?? current.process_competencies,
      scoring_ranges: (validated.data as any).scoring_ranges ?? current.scoring_ranges,
    }

    const versionResult = await adminCreateCompetencyFrameworkVersion(supabase as any, user.id, {
      job_title_id: current.job_title_id,
      parent_framework_id: current.id,
      name: merged.name,
      weights: merged.weights,
      behavioral_competencies: merged.behavioral_competencies,
      technical_def_competencies: merged.technical_def_competencies,
      process_competencies: merged.process_competencies,
      scoring_ranges: merged.scoring_ranges,
      is_active: true,
      published_at: new Date().toISOString(),
    } as any)

    if ('error' in versionResult) {
      return { error: versionResult.error }
    }

    await writeAuditLog({
      actorUserId: user.id,
      action: 'competency_framework.version_published',
      entityType: 'competency_framework',
      entityId: versionResult.data.id,
      before: versionResult.previous ?? current,
      after: versionResult.data,
      metadata: {
        job_title_id: versionResult.data.job_title_id,
        version: versionResult.data.version,
        parent_framework_id: versionResult.data.parent_framework_id,
      },
      client: supabase,
    })

    revalidatePath('/admin/competency-frameworks')
    revalidatePath(`/admin/competency-frameworks/${id}`)
    return { data: versionResult.data as CompetencyFramework }
  }

  const { data: framework, error } = await supabase
    .from('competency_frameworks')
    .update(validated.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating competency framework:', error)
    return { error: 'Erro ao atualizar framework de competência' }
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: 'competency_framework.updated',
    entityType: 'competency_framework',
    entityId: id,
    before: current,
    after: framework,
    metadata: {
      job_title_id: (framework as any)?.job_title_id,
      is_template: (framework as any)?.is_template,
      version: (framework as any)?.version,
      is_active: (framework as any)?.is_active,
    },
    client: supabase,
  })

  revalidatePath('/admin/competency-frameworks')
  revalidatePath(`/admin/competency-frameworks/${id}`)
  return { data: framework as CompetencyFramework }
}

export async function deleteCompetencyFramework(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data: current, error: fetchError } = await supabase
    .from('competency_frameworks')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching competency framework before delete:', fetchError)
    return { error: 'Erro ao buscar framework de competência' }
  }

  // Check if framework is in use
  const { count: assessmentsCount } = await supabase
    .from('seniority_assessments')
    .select('id', { count: 'exact', head: true })
    .eq('competency_framework_id', id)

  if (assessmentsCount && assessmentsCount > 0) {
    return { error: `Não é possível excluir. Existem ${assessmentsCount} avaliações vinculadas.` }
  }

  const { error } = await supabase
    .from('competency_frameworks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting competency framework:', error)
    return { error: 'Erro ao excluir framework de competência' }
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: 'competency_framework.deleted',
    entityType: 'competency_framework',
    entityId: id,
    before: current,
    after: null,
    metadata: {
      job_title_id: (current as any)?.job_title_id,
      is_template: (current as any)?.is_template,
      version: (current as any)?.version,
      is_active: (current as any)?.is_active,
    },
    client: supabase,
  })

  revalidatePath('/admin/competency-frameworks')
  return { success: true }
}

// Helper functions

export async function getCompetencyFrameworkStats(workspaceId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('competency_frameworks')
    .select(`
      id,
      behavioral_competencies,
      technical_def_competencies,
      process_competencies
    `)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error fetching competency framework stats:', error)
    return { error: 'Erro ao buscar estatísticas' }
  }

  const stats = {
    total: data.length,
    avgBehavioral: 0,
    avgTechnical: 0,
    avgProcess: 0
  }

  if (data.length > 0) {
    const sums = data.reduce((acc, fw) => {
      const behavioral = Array.isArray(fw.behavioral_competencies) ? fw.behavioral_competencies.length : 0
      const technical = Array.isArray(fw.technical_def_competencies) ? fw.technical_def_competencies.length : 0
      const process = Array.isArray(fw.process_competencies) ? fw.process_competencies.length : 0

      return {
        behavioral: acc.behavioral + behavioral,
        technical: acc.technical + technical,
        process: acc.process + process
      }
    }, { behavioral: 0, technical: 0, process: 0 })

    stats.avgBehavioral = Math.round(sums.behavioral / data.length)
    stats.avgTechnical = Math.round(sums.technical / data.length)
    stats.avgProcess = Math.round(sums.process / data.length)
  }

  return { data: stats }
}

export async function duplicateCompetencyFramework(id: string, newJobTitleId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Get original framework
  const { data: original, error: fetchError } = await supabase
    .from('competency_frameworks')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    console.error('Error fetching original framework:', fetchError)
    return { error: 'Erro ao buscar framework original' }
  }

  // Check if framework already exists for target job title
  const { data: existing } = await supabase
    .from('competency_frameworks')
    .select('id')
    .eq('job_title_id', newJobTitleId)
    .maybeSingle()

  if (existing) {
    return { error: 'Já existe um framework de competência para o cargo de destino' }
  }

  // Create duplicate
  const { id: _, created_at, updated_at, ...frameworkData } = original
  const newFramework = {
    ...frameworkData,
    job_title_id: newJobTitleId
  }

  const { data: duplicate, error: createError } = await supabase
    .from('competency_frameworks')
    .insert(newFramework)
    .select()
    .single()

  if (createError) {
    console.error('Error duplicating framework:', createError)
    return { error: 'Erro ao duplicar framework' }
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: 'competency_framework.duplicated',
    entityType: 'competency_framework',
    entityId: (duplicate as any)?.id ?? null,
    before: original,
    after: duplicate,
    metadata: {
      source_framework_id: id,
      target_job_title_id: newJobTitleId,
    },
    client: supabase,
  })

  revalidatePath('/admin/competency-frameworks')
  return { data: duplicate as CompetencyFramework }
}

export async function validateCompetencyWeights(weights: { behavioral: number; technical_def: number; process: number }) {
  const total = weights.behavioral + weights.technical_def + weights.process

  if (total !== 100) {
    return {
      valid: false,
      error: `A soma dos pesos deve ser 100% (atual: ${total}%)`
    }
  }

  return { valid: true }
}
