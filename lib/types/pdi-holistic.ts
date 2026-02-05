// PDI Holistic Types
// Based on migration: 20250101000102_pdi_and_def.sql (pdis table)

export type PDIStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'archived';
export type PDIActionStatus = 'pending' | 'in_progress' | 'done';

// Context Snapshot - captures the state when PDI was created
export interface PDIContextSnapshot {
  seniority_gap?: string; // e.g., "Junior -> Pleno"
  def_weakness?: string; // e.g., "Fechamento (Avg 1.2)"
  kpi_performance?: string; // e.g., "Conversion 5% (Target 10%)"
  behavioral_gaps?: string[];
  technical_gaps?: string[];
  process_gaps?: string[];
  custom_context?: Record<string, any>;
}

// Action within an objective
export interface PDIAction {
  id: string;
  description: string;
  deadline: string; // ISO date
  status: PDIActionStatus;
  completed_at?: string;
  notes?: string;
}

// Objective with multiple actions
export interface PDIObjective {
  id: string;
  objective: string; // e.g., "Melhorar Fechamento"
  rationale?: string; // Why this objective matters
  actions: PDIAction[];
  status: PDIActionStatus; // Overall status based on actions
  priority?: number; // 1 = highest
}

// Monthly checkpoint for tracking progress
export interface PDICheckpoint {
  id: string;
  date: string; // ISO date
  notes: string;
  progress_percentage: number; // 0-100
  next_steps?: string[];
  blockers?: string[];
  leader_feedback?: string;
}

export interface PDI {
  id: string;
  workspace_id: string;

  // Owner and approver
  user_id: string;
  leader_id?: string;

  // Cycle info
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: PDIStatus;

  // Context when created
  context_snapshot: PDIContextSnapshot;

  // Action plan (array of objectives)
  action_plan: PDIObjective[];

  // Monthly checkpoints
  checkpoints: PDICheckpoint[];

  // Notes
  leader_notes?: string;
  collaborator_notes?: string;

  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Helper types

export type CreatePDIInput = Pick<
  PDI,
  | 'workspace_id'
  | 'user_id'
  | 'leader_id'
  | 'start_date'
  | 'end_date'
  | 'context_snapshot'
  | 'action_plan'
>;

export type UpdatePDIInput = Partial<
  Pick<
    PDI,
    | 'action_plan'
    | 'checkpoints'
    | 'status'
    | 'leader_notes'
    | 'collaborator_notes'
  >
>;

export interface PDIWithRelations extends PDI {
  user: {
    id: string;
    name: string;
    email: string;
    job_title?: {
      id: string;
      name: string;
      hierarchy_level: number;
    };
  };
  leader?: {
    id: string;
    name: string;
    email: string;
  };
}

// PDI Analytics

export interface PDIProgress {
  pdi_id: string;
  total_objectives: number;
  completed_objectives: number;
  total_actions: number;
  completed_actions: number;
  overall_progress: number; // 0-100
  days_remaining: number;
  is_on_track: boolean;
}

export interface PDISuggestion {
  objective: string;
  rationale: string;
  suggested_actions: Array<{
    description: string;
    estimated_duration?: string;
  }>;
  based_on: 'seniority_gap' | 'def_weakness' | 'kpi_performance' | 'custom';
  priority: number;
}

// Leadership Style Assessment (also in this migration)

export type LeadershipStyle = 'builder' | 'farmer' | 'scale';

export interface LeadershipStyleAssessment {
  id: string;
  workspace_id: string;
  user_id: string;

  answers: Record<string, any>; // Question ID -> Answer
  total_score: number;
  leadership_style: LeadershipStyle;

  analysis_result?: string; // AI or template-generated analysis

  created_at: string;
}
