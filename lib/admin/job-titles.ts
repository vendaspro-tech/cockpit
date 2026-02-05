import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"

import type { JobTitle, CreateJobTitleInput, UpdateJobTitleInput } from "@/lib/types/job-title"

export type AdminSupabaseClient = SupabaseClient

export type JobTitleFilters = {
  hierarchy_level?: number
  sector?: string
  search?: string
}

const FixedCompensationSchema = z.union([
  z.number().min(0),
  z.object({
    type: z.literal("value"),
    value: z.number().min(0).nullable().optional(),
  }),
  z.object({
    type: z.literal("range"),
    min: z.number().min(0).nullable().optional(),
    max: z.number().min(0).nullable().optional(),
  }),
])

const RemunerationSchema = z.object({
  junior: z.object({
    fixed: FixedCompensationSchema,
    variable_description: z.string(),
  }),
  pleno: z.object({
    fixed: FixedCompensationSchema,
    variable_description: z.string(),
  }),
  senior: z.object({
    fixed: FixedCompensationSchema,
    variable_description: z.string(),
  }),
})

const RequirementsSchema = z.object({
  education: z.string(),
  mandatory_courses: z.array(z.string()),
  key_competencies: z.array(z.string()),
})

const SlugSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value
    const trimmed = value.trim()
    if (trimmed.length === 0) return undefined
    const normalized = slugify(trimmed)
    return normalized.length === 0 ? undefined : normalized
  },
  z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífen")
    .optional()
)

export const CreateJobTitleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: SlugSchema,
  hierarchy_level: z.number().int().min(0).max(3).default(3),
  subordination: z.string().optional(),
  allows_seniority: z.boolean().default(true),
  mission: z.string().optional(),
  sector: z.string().default("Vendas"),
  remuneration: RemunerationSchema.default({
    junior: { fixed: { type: "value", value: 0 }, variable_description: "" },
    pleno: { fixed: { type: "value", value: 0 }, variable_description: "" },
    senior: { fixed: { type: "value", value: 0 }, variable_description: "" },
  }),
  requirements: RequirementsSchema.default({
    education: "",
    mandatory_courses: [],
    key_competencies: [],
  }),
  kpis: z.array(z.string()).default([]),
  main_activities: z.array(z.string()).default([]),
  common_challenges: z.array(z.string()).default([]),
})

export const UpdateJobTitleSchema = CreateJobTitleSchema.partial()

const JOB_TITLES_TABLE = "job_titles"

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function adminListJobTitles(client: AdminSupabaseClient, filters?: JobTitleFilters) {
  let query = client
    .from(JOB_TITLES_TABLE)
    .select("*")
    .order("hierarchy_level", { ascending: true })
    .order("name", { ascending: true })

  if (filters?.hierarchy_level !== undefined) {
    query = query.eq("hierarchy_level", filters.hierarchy_level)
  }

  if (filters?.sector) {
    query = query.eq("sector", filters.sector)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,mission.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching job titles:", error)
    return { error: "Erro ao buscar cargos" }
  }

  return { data: (data as JobTitle[]) || [] }
}

export async function adminGetJobTitle(client: AdminSupabaseClient, id: string) {
  const { data, error } = await client
    .from(JOB_TITLES_TABLE)
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching job title:", error)
    return { error: "Erro ao buscar cargo" }
  }

  return { data: data as JobTitle }
}

export async function adminCreateJobTitle(client: AdminSupabaseClient, input: CreateJobTitleInput) {
  const validated = CreateJobTitleSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Dados inválidos", details: validated.error.flatten() }
  }

  const data = { ...validated.data }
  if (!data.slug) {
    data.slug = slugify(data.name)
  }

  const { data: existing } = await client
    .from(JOB_TITLES_TABLE)
    .select("id")
    .eq("slug", data.slug)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: "Já existe um cargo com este slug no sistema" }
  }

  const payload = {
    ...data,
    workspace_id: null,
    is_global: true,
  }

  const { data: jobTitle, error } = await client
    .from(JOB_TITLES_TABLE)
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    console.error("Error creating job title:", error)
    if (error.code === "23505") {
      return { error: "Já existe um cargo com este nome no sistema" }
    }
    return { error: "Erro ao criar cargo" }
  }

  return { data: jobTitle as JobTitle }
}

export async function adminUpdateJobTitle(
  client: AdminSupabaseClient,
  id: string,
  input: UpdateJobTitleInput
) {
  const validated = UpdateJobTitleSchema.safeParse(input)
  if (!validated.success) {
    return { error: "Dados inválidos", details: validated.error.flatten() }
  }

  const { data: current, error: fetchError } = await client
    .from(JOB_TITLES_TABLE)
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !current) {
    console.error("Error fetching current job title:", fetchError)
    return { error: "Erro ao buscar cargo" }
  }

  const updatePayload = {
    ...validated.data,
    slug: validated.data.slug || current.slug || slugify(validated.data.name || current.name),
  }

  if (updatePayload.slug && updatePayload.slug !== current.slug) {
    const { data: existing } = await client
      .from(JOB_TITLES_TABLE)
      .select("id")
      .eq("slug", updatePayload.slug)
      .neq("id", id)
      .limit(1)

    if (existing && existing.length > 0) {
      return { error: "Já existe um cargo com este slug no sistema" }
    }
  }

  const { error: updateError } = await client
    .from(JOB_TITLES_TABLE)
    .update(updatePayload)
    .eq("id", id)

  if (updateError) {
    console.error("Error updating job title:", updateError)
    if (updateError.code === "23505") {
      return { error: "Já existe um cargo com este slug no sistema" }
    }
    return { error: "Erro ao atualizar cargo" }
  }

  const { data: jobTitle } = await client
    .from(JOB_TITLES_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle()

  return jobTitle ? { data: jobTitle as JobTitle, previous: current as JobTitle } : { success: true }
}

export async function adminDeleteJobTitle(client: AdminSupabaseClient, id: string) {
  const { data: jobTitle, error: fetchError } = await client
    .from(JOB_TITLES_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching job title before delete:", fetchError)
    return { error: "Erro ao buscar cargo" }
  }

  if (!jobTitle) {
    return { error: "Cargo não encontrado" }
  }

  const { count: usersCount } = await client
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("job_title_id", id)

  if (usersCount && usersCount > 0) {
    return { error: `Não é possível excluir. Existem ${usersCount} usuários com este cargo.` }
  }

  const { count: frameworksCount } = await client
    .from("competency_frameworks")
    .select("id", { count: "exact", head: true })
    .eq("job_title_id", id)

  if (frameworksCount && frameworksCount > 0) {
    return { error: `Não é possível excluir. Existem ${frameworksCount} frameworks de competência vinculados.` }
  }

  const { error } = await client
    .from(JOB_TITLES_TABLE)
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting job title:", error)
    return { error: "Erro ao excluir cargo" }
  }

  return { success: true, deleted: jobTitle as JobTitle }
}

export async function adminGetJobTitleHierarchy(client: AdminSupabaseClient) {
  const { data, error } = await client
    .from(JOB_TITLES_TABLE)
    .select("*")
    .order("hierarchy_level", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching job title hierarchy:", error)
    return { error: "Erro ao buscar hierarquia" }
  }

  const rows = (data as JobTitle[]) || []
  const hierarchy = rows.reduce((acc, jobTitle) => {
    const level = jobTitle.hierarchy_level
    if (!acc[level]) acc[level] = []
    acc[level].push(jobTitle)
    return acc
  }, {} as Record<number, JobTitle[]>)

  return { data: hierarchy }
}

export async function adminGetJobTitleStats(client: AdminSupabaseClient) {
  const { data, error } = await client.from(JOB_TITLES_TABLE).select("hierarchy_level")

  if (error) {
    console.error("Error fetching job title stats:", error)
    return { error: "Erro ao buscar estatísticas" }
  }

  const stats = (data as JobTitle[]).reduce((acc, jt) => {
    const level = jt.hierarchy_level
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return { data: stats }
}
