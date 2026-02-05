-- ==================================================================================
-- FASE 1 - MIGRAÇÕES CONSOLIDADAS (CORRIGIDO)
-- Execute este arquivo completo no SQL Editor do Supabase Dashboard
-- ==================================================================================

-- ==================================================================================
-- PRÉ-REQUISITO: Criar função handle_updated_at se não existir
-- ==================================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================================
-- MIGRAÇÃO 1: 20250101000100_enrich_job_titles.sql
-- ==================================================================================

-- Add new columns to job_titles table
ALTER TABLE job_titles
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 3, -- 0=Strategic, 1=Tactical, 2=Operational, 3=Execution
  ADD COLUMN IF NOT EXISTS subordination TEXT, -- Text description of who they report to
  ADD COLUMN IF NOT EXISTS allows_seniority BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'Comercial',

  -- Structured Data for Job Description
  ADD COLUMN IF NOT EXISTS remuneration JSONB DEFAULT '{
    "junior": {"fixed": 0, "variable_description": ""},
    "pleno": {"fixed": 0, "variable_description": ""},
    "senior": {"fixed": 0, "variable_description": ""}
  }',

  ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{
    "education": "",
    "mandatory_courses": [],
    "key_competencies": []
  }',

  ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS main_activities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS common_challenges JSONB DEFAULT '[]',

  -- Metadata
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_job_titles_hierarchy ON job_titles(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_job_titles_slug ON job_titles(slug);

-- Add constraint for unique slug per workspace
ALTER TABLE job_titles
  DROP CONSTRAINT IF EXISTS job_titles_workspace_id_slug_key,
  ADD CONSTRAINT job_titles_workspace_id_slug_key UNIQUE (workspace_id, slug);

-- Add triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_job_titles') THEN
    CREATE TRIGGER set_updated_at_job_titles
    BEFORE UPDATE ON job_titles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Helper function for text normalization (used in seeds)
CREATE OR REPLACE FUNCTION normalize_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(REGEXP_REPLACE(text_input, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ==================================================================================
-- MIGRAÇÃO 2: 20250101000101_competency_system.sql
-- ==================================================================================

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
CREATE TABLE IF NOT EXISTS seniority_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  evaluated_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  evaluator_user_id UUID REFERENCES users(id),
  
  job_title_id UUID REFERENCES job_titles(id) NOT NULL,
  competency_framework_id UUID REFERENCES competency_frameworks(id) NOT NULL,
  
  assessment_type TEXT CHECK (assessment_type IN ('self', 'leader')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'submitted', 'calibrated')) DEFAULT 'draft',
  
  behavioral_scores JSONB DEFAULT '{}',
  technical_def_scores JSONB DEFAULT '{}',
  process_scores JSONB DEFAULT '{}',
  
  behavioral_total DECIMAL(5,2),
  technical_def_total DECIMAL(5,2),
  process_total DECIMAL(5,2),
  global_score DECIMAL(5,2),
  
  behavioral_level TEXT CHECK (behavioral_level IN ('junior', 'pleno', 'senior')),
  technical_def_level TEXT CHECK (technical_def_level IN ('junior', 'pleno', 'senior')),
  process_level TEXT CHECK (process_level IN ('junior', 'pleno', 'senior')),
  global_level TEXT CHECK (global_level IN ('junior', 'pleno', 'senior')),
  
  behavioral_comments TEXT,
  technical_def_comments TEXT,
  process_comments TEXT,
  general_observations TEXT,
  calibration_notes TEXT,
  
  assessment_period TEXT,
  
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

-- ==================================================================================
-- MIGRAÇÃO 3: 20250101000102_pdi_and_def.sql
-- ==================================================================================

-- 1. DEF Call Evaluations (Multichannel)
CREATE TABLE IF NOT EXISTS def_call_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  evaluated_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  source_type TEXT CHECK (source_type IN ('platform_test', 'sparring', 'real_call')) NOT NULL,
  
  product_id UUID,
  icp_id UUID,
  lead_name TEXT,
  recording_url TEXT,
  transcription_text TEXT,
  call_date TIMESTAMPTZ DEFAULT NOW(),
  
  evaluator_user_id UUID REFERENCES users(id),
  is_ai_evaluation BOOLEAN DEFAULT FALSE,
  
  whatsapp_score DECIMAL(3,1) DEFAULT 0,
  discovery_score DECIMAL(3,1) DEFAULT 0,
  enchantment_score DECIMAL(3,1) DEFAULT 0,
  closing_score DECIMAL(3,1) DEFAULT 0,
  objection_score DECIMAL(3,1) DEFAULT 0,
  average_score DECIMAL(3,1) GENERATED ALWAYS AS (
    (whatsapp_score + discovery_score + enchantment_score + closing_score + objection_score) / 5.0
  ) STORED,
  
  feedback_data JSONB DEFAULT '{}',
  general_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PDIs (Individual Development Plans) - Holistic
CREATE TABLE IF NOT EXISTS pdis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES users(id),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'archived')) DEFAULT 'draft',
  
  context_snapshot JSONB DEFAULT '{}',
  action_plan JSONB DEFAULT '[]',
  checkpoints JSONB DEFAULT '[]',
  
  leader_notes TEXT,
  collaborator_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Leadership Style Assessments
CREATE TABLE IF NOT EXISTS leadership_style_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  answers JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  leadership_style TEXT CHECK (leadership_style IN ('builder', 'farmer', 'scale')),
  
  analysis_result TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_def_evaluations_user ON def_call_evaluations(evaluated_user_id);
CREATE INDEX IF NOT EXISTS idx_pdis_user_status ON pdis(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pdis_workspace ON pdis(workspace_id);

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_pdis') THEN
    CREATE TRIGGER set_updated_at_pdis
    BEFORE UPDATE ON pdis
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
  END IF;
END
$$;

-- ==================================================================================
-- FIM DAS MIGRAÇÕES - VERIFICAÇÃO
-- ==================================================================================

-- Verificar tabelas criadas
SELECT 
  'competency_frameworks' as table_name,
  COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'competency_frameworks'
UNION ALL
SELECT 'seniority_assessments', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'seniority_assessments'
UNION ALL
SELECT 'def_call_evaluations', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'def_call_evaluations'
UNION ALL
SELECT 'pdis', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'pdis'
UNION ALL
SELECT 'leadership_style_assessments', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'leadership_style_assessments';

