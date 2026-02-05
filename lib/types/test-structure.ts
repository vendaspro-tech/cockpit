/**
 * Test Structure Types
 *
 * Comprehensive type definitions for the test structures system with versioning support.
 * Test structures define the configuration for assessments (DISC, Seniority, Leadership, etc.)
 */

// ============================================================================
// Core Database Types
// ============================================================================

/**
 * Main test structure interface matching the database schema
 */
export interface TestStructure {
  id: string
  test_type: TestType
  structure: TestStructureData
  version: number
  is_active: boolean
  parent_structure_id?: string
  changelog?: string
  published_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Supported test types in the system
 */
export type TestType =
  | 'disc'
  | 'seniority_seller'
  | 'seniority_leader'
  | 'leadership_style'
  | 'def_method'
  | 'values_8d'

// ============================================================================
// Test Structure Data (JSONB Content)
// ============================================================================

/**
 * The JSONB structure field content
 */
export interface TestStructureData {
  metadata: TestMetadata
  categories: Category[]
  scoring: ScoringConfig
}

/**
 * Metadata about the test
 */
export interface TestMetadata {
  name: string
  description: string
  instructions?: string
  applicable_job_titles?: string[]
  estimated_duration_minutes?: number
}

// ============================================================================
// Category and Question Types
// ============================================================================

/**
 * A category groups related questions together
 */
export interface Category {
  id: string
  name: string
  description?: string
  order: number
  questions: Question[]
  weight?: number // For weighted scoring
}

/**
 * A question within a category
 */
export interface Question {
  id: string
  text: string
  type: QuestionType
  order: number
  required?: boolean
  options?: QuestionOption[] // For single/multiple choice
  scale_descriptors?: ScaleDescriptor[] // For scale questions
  matrix_config?: MatrixRatingConfig // For matrix rating questions (DISC)
  validation?: QuestionValidation
  metadata?: QuestionMetadata
}

/**
 * Question types supported
 */
export type QuestionType =
  | 'single_choice'    // Radio buttons
  | 'multiple_choice'  // Checkboxes
  | 'scale'            // Likert scale (1-5, 1-3, etc.)
  | 'matrix_rating'    // Matrix with multiple statements rated independently (DISC)
  | 'text'             // Free text
  | 'textarea'         // Long text
  | 'number'           // Numeric input

/**
 * Option for single/multiple choice questions
 */
export interface QuestionOption {
  id: string
  label: string
  value: number | string
  order: number
  description?: string
}

/**
 * Descriptor for scale questions (defines what each point means)
 */
export interface ScaleDescriptor {
  value: number
  label: string
  description?: string
}

/**
 * Statement within a matrix rating question
 */
export interface MatrixStatement {
  id: string
  label?: string         // Short label: "A", "B", "C", "D" (optional - for display)
  text: string          // Full statement text
  order: number
  metadata?: {
    profile?: 'D' | 'I' | 'S' | 'C' | string  // Internal profile for scoring (DISC)
    scoring_key?: string                      // Custom grouping key for calculations
    [key: string]: any                         // Extensible metadata
  }
}

/**
 * Configuration for matrix rating questions (e.g., DISC test)
 */
export interface MatrixRatingConfig {
  statements: MatrixStatement[]
  scale: {
    min: number
    max: number
    descriptors?: ScaleDescriptor[]
  }
  validation?: {
    unique_values: boolean  // If true, enforce no repeated scores
  }
}

/**
 * Validation rules for questions
 */
export interface QuestionValidation {
  min?: number
  max?: number
  pattern?: string
  message?: string
}

/**
 * Additional metadata for questions
 */
export interface QuestionMetadata {
  tooltip?: string
  placeholder?: string
  helpText?: string
}

// ============================================================================
// Scoring Configuration
// ============================================================================

/**
 * Scoring configuration for the test
 */
export interface ScoringConfig {
  method: ScoringMethod
  category_weights?: Record<string, number> // Category ID -> weight percentage
  scale?: ScaleConfig
  ranges?: ScoringRange[]
  seniority_levels?: SeniorityLevel[]
  results?: ResultMapping[]
}

/**
 * Scoring calculation methods
 */
export type ScoringMethod =
  | 'sum'              // Simple sum of all answers
  | 'weighted_sum'     // Weighted sum based on category weights
  | 'average'          // Average of all answers
  | 'weighted_average' // Weighted average
  | 'custom'           // Custom calculation logic

/**
 * Configuration for scale-based questions
 */
export interface ScaleConfig {
  min: number
  max: number
  step?: number
  labels?: {
    min?: string
    max?: string
    middle?: string
  }
}

/**
 * A scoring range maps score intervals to categories/levels
 */
export interface ScoringRange {
  id: string
  label: string
  min: number
  max: number
  description?: string
  color?: string
}

/**
 * Seniority levels for career progression assessments
 */
export interface SeniorityLevel {
  label: string
  min_score: number
  max_score: number
  description?: string
}

/**
 * Result mapping for specific test outcomes (e.g., DISC profiles)
 */
export interface ResultMapping {
  range: {
    min: number
    max: number
  }
  label: string
  description: string
  recommendations?: string[]
}

// ============================================================================
// Assessment Results (for reference - used when calculating scores)
// ============================================================================

/**
 * Calculated result for seniority assessments
 */
export interface SeniorityResult {
  score: number
  maxScore: number
  percentage: number
  level: string
  description: string
  items: ScoredItem[]
}

/**
 * Calculated result for leadership style
 */
export interface LeadershipStyleResult {
  score: number
  style: string
  description: string
}

/**
 * Calculated result for DEF method
 */
export interface DefMethodResult {
  globalScore: number
  globalMax: number
  globalPercentage: number
  categories: CategoryScore[]
}

/**
 * Calculated result for 8 Dimensions of Values
 */
export interface Values8DResult {
  dimensions: Record<string, number>
  items: ScoredItem[]
}

/**
 * Individual scored item (question result)
 */
export interface ScoredItem {
  id: string
  name: string
  score: number
  maxScore: number
  category?: string
}

/**
 * Category-level score
 */
export interface CategoryScore {
  name: string
  score: {
    score: number
    maxScore: number
    percentage: number
  }
  items: ScoredItem[]
}

// ============================================================================
// Version Management
// ============================================================================

/**
 * Version comparison result
 */
export interface VersionDiff {
  source_id: string
  target_id: string
  source_version: number
  target_version: number
  changes: VersionChange[]
}

/**
 * Individual change between versions
 */
export interface VersionChange {
  path: string // JSON path to changed field
  type: 'added' | 'removed' | 'modified'
  old_value?: unknown
  new_value?: unknown
}

/**
 * Version history entry
 */
export interface VersionHistoryEntry {
  id: string
  version: number
  is_active: boolean
  changelog?: string
  published_at?: string
  created_by?: string
  created_by_name?: string
  created_at?: string
}

// ============================================================================
// Form/UI State Types
// ============================================================================

/**
 * Filter options for listing test structures
 */
export interface TestStructureFilters {
  test_type?: TestType
  is_active?: boolean
  created_by?: string
  search?: string
}

/**
 * Draft state for auto-save (stored in localStorage)
 */
export interface TestStructureDraft {
  test_structure_id?: string
  test_type: TestType
  structure: TestStructureData
  last_saved_at: string
}

/**
 * Validation error for test structure
 */
export interface ValidationError {
  field: string
  message: string
  path?: string
}

/**
 * Stats for test structures
 */
export interface TestStructureStats {
  total: number
  by_type: Record<TestType, number>
  active: number
  draft: number
}

// ============================================================================
// Type Guards
// ============================================================================

export function isTestType(value: string): value is TestType {
  return [
    'disc',
    'seniority_seller',
    'seniority_leader',
    'leadership_style',
    'def_method',
    'values_8d'
  ].includes(value)
}

export function isScoringMethod(value: string): value is ScoringMethod {
  return ['sum', 'weighted_sum', 'average', 'weighted_average', 'custom'].includes(value)
}

export function isQuestionType(value: string): value is QuestionType {
  return [
    'single_choice',
    'multiple_choice',
    'scale',
    'matrix_rating',
    'text',
    'textarea',
    'number'
  ].includes(value)
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Create request for new test structure
 */
export type CreateTestStructureRequest = Omit<
  TestStructure,
  'id' | 'version' | 'is_active' | 'created_at' | 'updated_at' | 'published_at'
>

/**
 * Update request for test structure (creates new version)
 */
export type UpdateTestStructureRequest = {
  structure: TestStructureData
  changelog?: string
}

/**
 * Partial structure for the legacy format (before versioning)
 */
export interface LegacyTestStructure {
  id: string
  test_type: string
  structure: Record<string, unknown>
  version: string // Was string, now number
  updated_at: string
}
