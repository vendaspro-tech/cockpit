-- Migration: 20250101000101_competency_system.sql

-- 1. Competency Frameworks
-- Defines the matrix structure for a specific job title
CREATE TABLE IF NOT EXISTS competency_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  job_title_id UUID REFERENCES job_titles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- e.g., "SDR Competency Matrix"
  
  -- Weights configuration
  weights JSONB NOT NULL DEFAULT '{
    "behavioral": 0.50,
    "technical_def": 0.30,
    "process": 0.20
  }',
  
  -- Competency Definitions
  behavioral_competencies JSONB NOT NULL DEFAULT '[]', 
  -- Example: [{"id": 1, "name": "Resiliência", "levels": {"1": "...", "2": "...", "3": "..."}}]
  
  technical_def_competencies JSONB NOT NULL DEFAULT '[]',
  process_competencies JSONB NOT NULL DEFAULT '[]',
  
  -- Scoring Ranges for Seniority Classification
  scoring_ranges JSONB NOT NULL DEFAULT '{
    "behavioral": {"junior": [0,0], "pleno": [0,0], "senior": [0,0]},
    "technical_def": {"junior": [0,0], "pleno": [0,0], "senior": [0,0]},
    "process": {"junior": [0,0], "pleno": [0,0], "senior": [0,0]},
    "global": {"junior": [0,0], "pleno": [0,0], "senior": [0,0]}
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, job_title_id)
);

-- 2. Seniority Assessments
-- Stores the actual evaluation results
CREATE TABLE IF NOT EXISTS seniority_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  evaluated_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  evaluator_user_id UUID REFERENCES users(id), -- Leader who evaluated
  
  job_title_id UUID REFERENCES job_titles(id) NOT NULL,
  competency_framework_id UUID REFERENCES competency_frameworks(id) NOT NULL,
  
  -- Assessment Type & Status
  assessment_type TEXT CHECK (assessment_type IN ('self', 'leader')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'submitted', 'calibrated')) DEFAULT 'draft',
  
  -- Detailed Scores
  behavioral_scores JSONB DEFAULT '{}', -- {"competency_id": score}
  technical_def_scores JSONB DEFAULT '{}',
  process_scores JSONB DEFAULT '{}',
  
  -- Calculated Totals
  behavioral_total DECIMAL(5,2),
  technical_def_total DECIMAL(5,2),
  process_total DECIMAL(5,2),
  global_score DECIMAL(5,2),
  
  -- Resulting Levels (Calculated)
  behavioral_level TEXT CHECK (behavioral_level IN ('junior', 'pleno', 'senior')),
  technical_def_level TEXT CHECK (technical_def_level IN ('junior', 'pleno', 'senior')),
  process_level TEXT CHECK (process_level IN ('junior', 'pleno', 'senior')),
  global_level TEXT CHECK (global_level IN ('junior', 'pleno', 'senior')),
  
  -- Comments
  behavioral_comments TEXT,
  technical_def_comments TEXT,
  process_comments TEXT,
  general_observations TEXT,
  calibration_notes TEXT, -- Filled during calibration (only on leader assessment or separate record)
  
  -- Period/Cycle
  assessment_period TEXT, -- "Q1 2025" or ISO Date
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  calibrated_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competency_frameworks_job ON competency_frameworks(job_title_id);
CREATE INDEX IF NOT EXISTS idx_seniority_assessments_user ON seniority_assessments(evaluated_user_id);
CREATE INDEX IF NOT EXISTS idx_seniority_assessments_period ON seniority_assessments(assessment_period);

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_competency_frameworks') THEN
    CREATE TRIGGER set_updated_at_competency_frameworks
    BEFORE UPDATE ON competency_frameworks
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
  END IF;
END
$$;
