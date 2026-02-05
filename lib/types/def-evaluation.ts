// DEF Call Evaluation Types
// Based on migration: 20250101000102_pdi_and_def.sql (def_call_evaluations)

export type DEFSourceType = 'platform_test' | 'sparring' | 'real_call';

export interface DEFFeedbackData {
  // Structured feedback per section
  whatsapp?: {
    checklist?: string[];
    comments?: string;
  };
  discovery?: {
    checklist?: string[];
    comments?: string;
  };
  enchantment?: {
    checklist?: string[];
    comments?: string;
  };
  closing?: {
    checklist?: string[];
    comments?: string;
  };
  objection?: {
    checklist?: string[];
    comments?: string;
  };
  // AI-specific feedback
  ai_insights?: {
    strengths?: string[];
    improvements?: string[];
    examples?: string[];
  };
}

export interface DEFCallEvaluation {
  id: string;
  workspace_id: string;

  // Who is being evaluated
  evaluated_user_id: string;

  // Source of the evaluation
  source_type: DEFSourceType;

  // Real Call Metadata (optional, only for sparring/real_call)
  product_id?: string;
  icp_id?: string;
  lead_name?: string;
  recording_url?: string;
  transcription_text?: string;
  call_date?: string;

  // Evaluator (Human or AI)
  evaluator_user_id?: string; // null if AI
  is_ai_evaluation: boolean;

  // Scores (0-3, decimal allowed)
  whatsapp_score: number;
  discovery_score: number;
  enchantment_score: number;
  closing_score: number;
  objection_score: number;
  average_score: number; // Calculated: (sum of 5 scores) / 5

  // Detailed feedback
  feedback_data: DEFFeedbackData;
  general_feedback?: string;

  created_at: string;
}

// Helper types

export type CreateDEFEvaluationInput = Pick<
  DEFCallEvaluation,
  | 'workspace_id'
  | 'evaluated_user_id'
  | 'source_type'
  | 'is_ai_evaluation'
> &
  Partial<
    Pick<
      DEFCallEvaluation,
      | 'product_id'
      | 'icp_id'
      | 'lead_name'
      | 'recording_url'
      | 'transcription_text'
      | 'evaluator_user_id'
    >
  >;

export type UpdateDEFScoresInput = Pick<
  DEFCallEvaluation,
  | 'whatsapp_score'
  | 'discovery_score'
  | 'enchantment_score'
  | 'closing_score'
  | 'objection_score'
  | 'feedback_data'
  | 'general_feedback'
>;

export interface DEFEvaluationWithRelations extends DEFCallEvaluation {
  evaluated_user: {
    id: string;
    name: string;
    email: string;
  };
  evaluator?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
  };
  icp?: {
    id: string;
    name: string;
  };
}

// DEF Analytics Types

export interface DEFScoresByCategory {
  whatsapp: number;
  discovery: number;
  enchantment: number;
  closing: number;
  objection: number;
  average: number;
}

export interface DEFEvaluationSummary {
  user_id: string;
  total_evaluations: number;
  by_source: {
    platform_test: number;
    sparring: number;
    real_call: number;
  };
  average_scores: DEFScoresByCategory;
  latest_evaluation_date?: string;
  trend: 'improving' | 'stable' | 'declining';
}
