-- Migration: 20250101000102_pdi_and_def.sql

-- 1. DEF Call Evaluations (Multichannel)
CREATE TABLE IF NOT EXISTS def_call_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  evaluated_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Source of the evaluation
  source_type TEXT CHECK (source_type IN ('platform_test', 'sparring', 'real_call')) NOT NULL,
  
  -- Real Call Metadata
  product_id UUID, -- Optional: link to products table if exists, or just ID
  icp_id UUID,     -- Optional: link to ICPs table if exists
  lead_name TEXT,
  recording_url TEXT,
  transcription_text TEXT,
  call_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evaluator (Human or AI)
  evaluator_user_id UUID REFERENCES users(id), -- Null if AI
  is_ai_evaluation BOOLEAN DEFAULT FALSE,
  
  -- Scores (0-3)
  whatsapp_score DECIMAL(3,1) DEFAULT 0,
  discovery_score DECIMAL(3,1) DEFAULT 0,
  enchantment_score DECIMAL(3,1) DEFAULT 0,
  closing_score DECIMAL(3,1) DEFAULT 0,
  objection_score DECIMAL(3,1) DEFAULT 0,
  average_score DECIMAL(3,1) GENERATED ALWAYS AS (
    (whatsapp_score + discovery_score + enchantment_score + closing_score + objection_score) / 5.0
  ) STORED,
  
  -- Detailed Feedback
  feedback_data JSONB DEFAULT '{}', -- Stores checklists, comments per section, AI feedback
  general_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PDIs (Individual Development Plans) - Holistic
CREATE TABLE IF NOT EXISTS pdis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES users(id),
  
  -- Cycle Info
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'archived')) DEFAULT 'draft',
  
  -- Snapshot of context when PDI was created
  context_snapshot JSONB DEFAULT '{}',
  /* Structure: {
    "seniority_gap": "Junior -> Pleno",
    "def_weakness": "Fechamento (Avg 1.2)",
    "kpi_performance": "Conversion 5% (Target 10%)"
  } */
  
  -- Action Plan
  action_plan JSONB DEFAULT '[]',
  /* Structure: [{
    "id": "uuid", "objective": "Improve Closing", "actions": [...], "status": "pending"
  }] */
  
  -- Checkpoints (Monthly)
  checkpoints JSONB DEFAULT '[]',
  
  -- Notes
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
  
  analysis_result TEXT, -- AI or template generated text
  
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
