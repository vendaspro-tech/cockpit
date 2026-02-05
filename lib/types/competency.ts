// Competency System Types
// Updated for global templates + seniority v2 foundations

export interface CompetencyWeights {
  behavioral: number; // 0.50
  technical_def: number; // 0.30
  process: number; // 0.20
}

export interface CompetencyDefinition {
  id: string | number;
  name: string;
  description?: string;
  levels?: {
    '1': string;
    '2': string;
    '3': string;
  };
}

export interface CompetencyStructureCompetency {
  id: string;
  name: string;
  weight: number;
  description?: string;
  expectations?: Partial<Record<SeniorityLevel, string>>;
}

export interface CompetencyStructureDimension {
  id: string;
  name: string;
  weight: number;
  competencies: CompetencyStructureCompetency[];
  notes?: string;
}

export interface CompetencyStructure {
  dimensions: CompetencyStructureDimension[];
  rationale?: string;
}

export interface ScoringRange {
  junior: [number, number]; // [min, max]
  pleno: [number, number];
  senior: [number, number];
}

export interface ScoringRanges {
  behavioral: ScoringRange;
  technical_def: ScoringRange;
  process: ScoringRange;
  global: ScoringRange;
}

export interface CompetencyFramework {
  id: string;
  workspace_id: string | null; // Null for global templates
  job_title_id: string;

  name: string; // e.g., "SDR Competency Matrix"

  // Configuration (legacy fields kept optional for backward compatibility)
  weights?: CompetencyWeights;
  behavioral_competencies?: CompetencyDefinition[];
  technical_def_competencies?: CompetencyDefinition[];
  process_competencies?: CompetencyDefinition[];

  // Canonical structure payload
  structure: CompetencyStructure;

  // Scoring ranges for classification
  scoring_ranges: ScoringRanges;

  // Template and versioning fields
  is_template: boolean; // True if this is a global template (admin-created)
  parent_framework_id?: string | null; // Reference to template it was created from
  version: number; // Version number for tracking
  is_active: boolean; // Only one active template per job_title
  is_published?: boolean;
  created_by?: string | null; // User who created it
  published_at?: string | null; // When template was published

  created_at: string;
  updated_at: string;
}

// Seniority Assessment Types

export type AssessmentType = 'self' | 'leader';
export type AssessmentStatus =
  | 'draft'
  | 'self_submitted'
  | 'leader_submitted'
  | 'calibrated'
  | 'cancelled';
export type SeniorityLevel = 'junior' | 'pleno' | 'senior';

export interface CompetencyScores {
  [competencyId: string]: number; // competency_id -> score (1-3)
}

export interface SeniorityAssessment {
  id: string;
  workspace_id: string;

  // Who is being evaluated
  evaluated_user_id: string;
  evaluator_user_id?: string; // Leader who evaluated (null for self-assessment)

  job_title_id: string;
  competency_framework_id: string;

  // Type and status
  assessment_type: AssessmentType;
  status: AssessmentStatus;

  // Detailed scores by dimension
  behavioral_scores: CompetencyScores;
  technical_def_scores: CompetencyScores;
  process_scores: CompetencyScores;

  // Calculated totals
  behavioral_total?: number;
  technical_def_total?: number;
  process_total?: number;
  global_score?: number;

  // Resulting levels (calculated based on scoring_ranges)
  behavioral_level?: SeniorityLevel;
  technical_def_level?: SeniorityLevel;
  process_level?: SeniorityLevel;
  global_level?: SeniorityLevel;

  // Comments
  behavioral_comments?: string;
  technical_def_comments?: string;
  process_comments?: string;
  general_observations?: string;
  calibration_notes?: string; // Filled during calibration

  // Period
  assessment_period?: string; // "Q1 2025" or ISO date

  created_at: string;
  completed_at?: string;
  calibrated_at?: string;
}

export interface SeniorityAssessmentResponse {
  assessment_id: string;
  rater_type: AssessmentType;
  competency_id: string;
  score: number;
  notes?: string;
}

export interface SeniorityCalibration {
  assessment_id: string;
  calibrated_by: string;
  final_level: number;
  final_notes?: string;
  created_at: string;
}

// Helper types

export type CreateSeniorityAssessmentInput = Pick<
  SeniorityAssessment,
  | 'workspace_id'
  | 'evaluated_user_id'
  | 'job_title_id'
  | 'competency_framework_id'
  | 'assessment_type'
  | 'assessment_period'
>;

export type UpdateSeniorityScoresInput = Pick<
  SeniorityAssessment,
  | 'behavioral_scores'
  | 'technical_def_scores'
  | 'process_scores'
  | 'behavioral_comments'
  | 'technical_def_comments'
  | 'process_comments'
>;

export interface SeniorityAssessmentWithUser extends SeniorityAssessment {
  evaluated_user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  evaluator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SeniorityAssessmentWithFramework extends SeniorityAssessment {
  framework: CompetencyFramework;
}

// Creation and Update inputs

export type CreateCompetencyFrameworkInput = Omit<
  CompetencyFramework,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateCompetencyFrameworkInput = Partial<
  Omit<CreateCompetencyFrameworkInput, 'workspace_id' | 'job_title_id' | 'is_template'>
>;
