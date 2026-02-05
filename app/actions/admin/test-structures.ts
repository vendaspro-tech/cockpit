'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth-server"
import type {
  TestStructure,
  TestStructureData,
  TestStructureFilters,
  TestType,
  CreateTestStructureRequest,
  UpdateTestStructureRequest,
  VersionHistoryEntry,
  Category,
  Question,
  QuestionOption,
  ScoringConfig
} from "@/lib/types/test-structure"

// ============================================================================
// Validation Schemas
// ============================================================================

const QuestionOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  order: z.number().int(),
  description: z.string().optional()
})

const QuestionValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().optional()
})

const QuestionMetadataSchema = z.object({
  tooltip: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional()
})

const ScaleDescriptorSchema = z.object({
  value: z.number(),
  label: z.string().min(1),
  description: z.string().optional()
})

const MatrixStatementSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  text: z.string().min(1),
  order: z.number().int()
})

const MatrixRatingConfigSchema = z.object({
  statements: z.array(MatrixStatementSchema).min(2, "Pelo menos 2 afirmações são necessárias"),
  scale: z.object({
    min: z.number(),
    max: z.number(),
    descriptors: z.array(ScaleDescriptorSchema).optional()
  }),
  validation: z.object({
    unique_values: z.boolean().optional()
  }).optional()
})

const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  type: z.enum(['single_choice', 'multiple_choice', 'scale', 'matrix_rating', 'text', 'textarea', 'number']),
  order: z.number().int(),
  required: z.boolean().optional(),
  options: z.array(QuestionOptionSchema).optional(),
  scale_descriptors: z.array(ScaleDescriptorSchema).optional(),
  matrix_config: MatrixRatingConfigSchema.optional(),
  validation: QuestionValidationSchema.optional(),
  metadata: QuestionMetadataSchema.optional()
})

const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int(),
  questions: z.array(QuestionSchema),
  weight: z.number().min(0).max(100).optional()
})

const ScaleConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  labels: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
    middle: z.string().optional()
  }).optional()
})

const ScoringRangeSchema = z.object({
  id: z.string(),
  label: z.string(),
  min: z.number(),
  max: z.number(),
  description: z.string().optional(),
  color: z.string().optional()
})

const SeniorityLevelSchema = z.object({
  label: z.string(),
  min_score: z.number(),
  max_score: z.number(),
  description: z.string().optional()
})

const ResultMappingSchema = z.object({
  range: z.object({
    min: z.number(),
    max: z.number()
  }),
  label: z.string(),
  description: z.string(),
  recommendations: z.array(z.string()).optional()
})

const ScoringConfigSchema = z.object({
  method: z.enum(['sum', 'weighted_sum', 'average', 'weighted_average', 'custom']),
  category_weights: z.record(z.string(), z.number()).optional(),
  scale: ScaleConfigSchema.optional(),
  ranges: z.array(ScoringRangeSchema).optional(),
  seniority_levels: z.array(SeniorityLevelSchema).optional(),
  results: z.array(ResultMappingSchema).optional()
})

const TestMetadataSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  instructions: z.string().optional(),
  applicable_job_titles: z.array(z.string()).optional(),
  estimated_duration_minutes: z.number().int().positive().optional()
})

const TestStructureDataSchema = z.object({
  metadata: TestMetadataSchema,
  categories: z.array(CategorySchema).min(1, "Pelo menos uma categoria é obrigatória"),
  scoring: ScoringConfigSchema
})

const CreateTestStructureSchema = z.object({
  test_type: z.enum(['disc', 'seniority_seller', 'seniority_leader', 'leadership_style', 'def_method', 'values_8d']),
  structure: TestStructureDataSchema,
  changelog: z.string().optional()
})

const UpdateTestStructureSchema = z.object({
  structure: TestStructureDataSchema,
  changelog: z.string().min(1, "Changelog é obrigatório ao criar nova versão")
})

// ============================================================================
// Actions
// ============================================================================

/**
 * List all test structures with optional filters
 */
export async function listTestStructures(filters?: TestStructureFilters) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  let query = supabase
    .from('test_structures')
    .select('*')
    .order('test_type', { ascending: true })
    .order('version', { ascending: false })

  // Apply filters
  if (filters?.test_type) {
    query = query.eq('test_type', filters.test_type)
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by)
  }

  if (filters?.search) {
    // Search in structure->metadata->name using JSONB query
    query = query.or(`structure->>metadata->>name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching test structures:', error)
    return { error: 'Erro ao buscar estruturas de teste' }
  }

  return { data: data as TestStructure[] }
}

/**
 * Get a single test structure by ID
 */
export async function getTestStructure(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('test_structures')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching test structure:', error)
    return { error: 'Erro ao buscar estrutura de teste' }
  }

  return { data: data as TestStructure }
}

/**
 * Get the active test structure for a given test type
 */
export async function getActiveTestStructure(testType: TestType) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('test_structures')
    .select('*')
    .eq('test_type', testType)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active test structure:', error)
    return { error: 'Erro ao buscar estrutura de teste ativa' }
  }

  return { data: data as TestStructure | null }
}

/**
 * Create a new test structure
 */
export async function createTestStructure(input: CreateTestStructureRequest) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = CreateTestStructureSchema.safeParse(input)
  if (!validated.success) {
    return { error: 'Dados inválidos', details: validated.error.flatten() }
  }

  const supabase = createAdminClient()

  // Validate category weights if using weighted scoring
  if (validated.data.structure.scoring.method === 'weighted_sum' ||
      validated.data.structure.scoring.method === 'weighted_average') {
    const weightValidation = validateCategoryWeights(
      validated.data.structure.categories as unknown as Category[],
      validated.data.structure.scoring.category_weights
    )

    if (!weightValidation.valid) {
      return { error: weightValidation.error }
    }
  }

  // Check if an active version already exists for this test_type
  const { data: existing } = await supabase
    .from('test_structures')
    .select('id, version')
    .eq('test_type', validated.data.test_type)
    .eq('is_active', true)
    .maybeSingle()

  // Get next version number
  const { data: latestVersion } = await supabase
    .from('test_structures')
    .select('version')
    .eq('test_type', validated.data.test_type)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = latestVersion ? latestVersion.version + 1 : 1

  // If creating a new version and existing active version found, deactivate it
  if (existing) {
    await supabase
      .from('test_structures')
      .update({ is_active: false })
      .eq('id', existing.id)
  }

  const dataToInsert = {
    test_type: validated.data.test_type,
    structure: validated.data.structure,
    version: nextVersion,
    is_active: true,
    parent_structure_id: existing?.id || null,
    changelog: validated.data.changelog || 'Versão inicial',
    created_by: user.id,
    published_at: new Date().toISOString()
  }

  const { data: testStructure, error } = await supabase
    .from('test_structures')
    .insert(dataToInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating test structure:', error)
    return { error: 'Erro ao criar estrutura de teste' }
  }

  revalidatePath('/admin/test-structures')
  return { data: testStructure as TestStructure }
}

/**
 * Update a test structure (creates a new version)
 */
export async function updateTestStructure(id: string, input: UpdateTestStructureRequest) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = UpdateTestStructureSchema.safeParse(input)
  if (!validated.success) {
    return { error: 'Dados inválidos', details: validated.error.flatten() }
  }

  const supabase = createAdminClient()

  // Get current test structure
  const { data: current, error: fetchError } = await supabase
    .from('test_structures')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    console.error('Error fetching current test structure:', fetchError)
    return { error: 'Erro ao buscar estrutura de teste' }
  }

  // Validate category weights if using weighted scoring
  if (validated.data.structure.scoring.method === 'weighted_sum' ||
      validated.data.structure.scoring.method === 'weighted_average') {
    const weightValidation = validateCategoryWeights(
      validated.data.structure.categories as unknown as Category[],
      validated.data.structure.scoring.category_weights
    )

    if (!weightValidation.valid) {
      return { error: weightValidation.error }
    }
  }

  // Deactivate current active version
  if (current.is_active) {
    await supabase
      .from('test_structures')
      .update({ is_active: false })
      .eq('id', current.id)
  }

  // Create new version
  const newVersion = current.version + 1
  const dataToInsert = {
    test_type: current.test_type,
    structure: validated.data.structure,
    version: newVersion,
    is_active: true,
    parent_structure_id: current.id,
    changelog: validated.data.changelog,
    created_by: user.id,
    published_at: new Date().toISOString()
  }

  const { data: newTestStructure, error } = await supabase
    .from('test_structures')
    .insert(dataToInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating new version:', error)
    return { error: 'Erro ao criar nova versão' }
  }

  revalidatePath('/admin/test-structures')
  revalidatePath(`/admin/test-structures/${id}`)
  return { data: newTestStructure as TestStructure }
}

/**
 * Delete a test structure
 */
export async function deleteTestStructure(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Get the test structure to check if it's active
  const { data: testStructure } = await supabase
    .from('test_structures')
    .select('is_active, test_type, version')
    .eq('id', id)
    .single()

  if (testStructure?.is_active) {
    return { error: 'Não é possível excluir a versão ativa. Ative outra versão primeiro.' }
  }

  // Check if test structure is in use (check assessments)
  const { count: assessmentsCount } = await supabase
    .from('seniority_assessments')
    .select('id', { count: 'exact', head: true })
    .eq('test_structure_id', id)

  if (assessmentsCount && assessmentsCount > 0) {
    return { error: `Não é possível excluir. Existem ${assessmentsCount} avaliações vinculadas.` }
  }

  const { error } = await supabase
    .from('test_structures')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting test structure:', error)
    return { error: 'Erro ao excluir estrutura de teste' }
  }

  revalidatePath('/admin/test-structures')
  return { success: true }
}

/**
 * Get version history for a test type
 */
export async function getVersionHistory(testType: TestType) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('test_structures')
    .select(`
      id,
      version,
      is_active,
      changelog,
      published_at,
      created_by
    `)
    .eq('test_type', testType)
    .order('version', { ascending: false })

  if (error) {
    console.error('Error fetching version history:', error)
    return { error: 'Erro ao buscar histórico de versões' }
  }

  // Optionally, fetch user names for created_by
  const history: VersionHistoryEntry[] = data.map(v => ({
    id: v.id,
    version: v.version,
    is_active: v.is_active,
    changelog: v.changelog,
    published_at: v.published_at,
    created_by: v.created_by
  }))

  return { data: history }
}

/**
 * Activate a specific version
 */
export async function activateVersion(id: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Get the version to activate
  const { data: targetVersion, error: fetchError } = await supabase
    .from('test_structures')
    .select('test_type, is_active')
    .eq('id', id)
    .single()

  if (fetchError || !targetVersion) {
    console.error('Error fetching target version:', fetchError)
    return { error: 'Erro ao buscar versão' }
  }

  if (targetVersion.is_active) {
    return { error: 'Esta versão já está ativa' }
  }

  // Deactivate current active version
  await supabase
    .from('test_structures')
    .update({ is_active: false })
    .eq('test_type', targetVersion.test_type)
    .eq('is_active', true)

  // Activate target version
  const { error } = await supabase
    .from('test_structures')
    .update({
      is_active: true,
      published_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error activating version:', error)
    return { error: 'Erro ao ativar versão' }
  }

  revalidatePath('/admin/test-structures')
  return { success: true }
}

/**
 * Duplicate a test structure to a new test type
 */
export async function duplicateTestStructure(id: string, newTestType: TestType, changelog?: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Get original test structure
  const { data: original, error: fetchError } = await supabase
    .from('test_structures')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    console.error('Error fetching original test structure:', fetchError)
    return { error: 'Erro ao buscar estrutura original' }
  }

  // Check if test type is the same
  if (original.test_type === newTestType) {
    return { error: 'Não é possível duplicar para o mesmo tipo de teste' }
  }

  // Check if active version already exists for new test type
  const { data: existing } = await supabase
    .from('test_structures')
    .select('id')
    .eq('test_type', newTestType)
    .eq('is_active', true)
    .maybeSingle()

  // Deactivate existing active version if found
  if (existing) {
    await supabase
      .from('test_structures')
      .update({ is_active: false })
      .eq('id', existing.id)
  }

  // Create duplicate
  const duplicate = {
    test_type: newTestType,
    structure: original.structure,
    version: 1,
    is_active: true,
    parent_structure_id: null,
    changelog: changelog || `Duplicado de ${original.test_type} v${original.version}`,
    created_by: user.id,
    published_at: new Date().toISOString()
  }

  const { data: newTestStructure, error: createError } = await supabase
    .from('test_structures')
    .insert(duplicate)
    .select()
    .single()

  if (createError) {
    console.error('Error duplicating test structure:', createError)
    return { error: 'Erro ao duplicar estrutura de teste' }
  }

  revalidatePath('/admin/test-structures')
  return { data: newTestStructure as TestStructure }
}

/**
 * Get statistics about test structures
 */
export async function getTestStructureStats() {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('test_structures')
    .select('test_type, is_active')

  if (error) {
    console.error('Error fetching test structure stats:', error)
    return { error: 'Erro ao buscar estatísticas' }
  }

  const stats = {
    total: data.length,
    active: data.filter(t => t.is_active).length,
    draft: data.filter(t => !t.is_active).length,
    by_type: data.reduce((acc, t) => {
      acc[t.test_type as TestType] = (acc[t.test_type as TestType] || 0) + 1
      return acc
    }, {} as Record<TestType, number>)
  }

  return { data: stats }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate that category weights sum to 100%
 */
function validateCategoryWeights(
  categories: Category[],
  weights?: Record<string, number>
): { valid: boolean; error?: string } {
  if (!weights) {
    return { valid: false, error: 'Pesos de categoria não fornecidos' }
  }

  const categoryIds = categories.map(c => c.id)
  const weightKeys = Object.keys(weights)

  // Check if all categories have weights
  const missingWeights = categoryIds.filter(id => !weightKeys.includes(id))
  if (missingWeights.length > 0) {
    return {
      valid: false,
      error: `Pesos faltando para categorias: ${missingWeights.join(', ')}`
    }
  }

  // Check if weights sum to 100
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (Math.abs(total - 100) > 0.01) { // Allow small floating point errors
    return {
      valid: false,
      error: `A soma dos pesos deve ser 100% (atual: ${total.toFixed(2)}%)`
    }
  }

  return { valid: true }
}

/**
 * Validate scoring ranges don't overlap
 */
export async function validateScoringRanges(ranges: Array<{ min: number; max: number }>): Promise<{ valid: boolean; error?: string }> {
  for (let i = 0; i < ranges.length; i++) {
    const current = ranges[i]

    if (current.min >= current.max) {
      return { valid: false, error: `Range ${i + 1}: min deve ser menor que max` }
    }

    for (let j = i + 1; j < ranges.length; j++) {
      const other = ranges[j]

      // Check overlap
      if (
        (current.min >= other.min && current.min <= other.max) ||
        (current.max >= other.min && current.max <= other.max) ||
        (other.min >= current.min && other.min <= current.max) ||
        (other.max >= current.min && other.max <= current.max)
      ) {
        return { valid: false, error: `Ranges ${i + 1} e ${j + 1} se sobrepõem` }
      }
    }
  }

  return { valid: true }
}
