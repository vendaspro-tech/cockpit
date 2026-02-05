-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USUÁRIOS E WORKSPACES
-- =============================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  clerk_org_id TEXT UNIQUE,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'leader', 'closer', 'sdr')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- =============================================
-- ESTRUTURAS DE TESTES (JSON fixtures)
-- =============================================

CREATE TABLE test_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_type TEXT UNIQUE NOT NULL CHECK (test_type IN (
    'seniority_seller', 
    'seniority_leader', 
    'def_method', 
    'values_8d', 
    'leadership_style'
  )),
  structure JSONB NOT NULL,
  version TEXT DEFAULT '1.0',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AVALIAÇÕES
-- =============================================

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'seniority_seller', 
    'seniority_leader', 
    'def_method', 
    'values_8d', 
    'leadership_style'
  )),
  evaluated_user_id UUID REFERENCES users(id),
  evaluator_user_id UUID REFERENCES users(id),
  assessment_mode TEXT NOT NULL CHECK (assessment_mode IN ('self', 'manager')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  category_id TEXT,
  value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  classification JSONB,
  divergences JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MATRIZ DEF (POR REUNIÃO)
-- =============================================

CREATE TABLE def_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id),
  evaluator_id UUID REFERENCES users(id),
  meeting_date DATE NOT NULL,
  lead_name TEXT,
  lead_type TEXT CHECK (lead_type IN ('inbound', 'outbound')),
  product TEXT,
  status TEXT CHECK (status IN ('won', 'lost', 'ongoing')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE def_meeting_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES def_meetings(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL CHECK (category_id IN (
    'whatsapp', 
    'descoberta', 
    'encantamento', 
    'fechamento', 
    'objecoes'
  )),
  criterion_id TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE def_meeting_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES def_meetings(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  standard_comments TEXT[],
  free_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PDI (MANUAL)
-- =============================================

CREATE TABLE pdi_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  source_assessment_id UUID REFERENCES assessments(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_completion_date DATE
);

CREATE TABLE pdi_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdi_plan_id UUID REFERENCES pdi_plans(id) ON DELETE CASCADE,
  category_id TEXT,
  category_name TEXT,
  criterion TEXT NOT NULL,
  current_score_self INTEGER,
  current_score_manager INTEGER,
  target_score INTEGER,
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pdi_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdi_item_id UUID REFERENCES pdi_items(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  deadline_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE pdi_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdi_item_id UUID REFERENCES pdi_items(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CUSTOMIZAÇÃO
-- =============================================

CREATE TABLE custom_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  weights JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, test_type)
);

-- =============================================
-- ALERTAS
-- =============================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(role);

CREATE INDEX idx_assessments_workspace ON assessments(workspace_id);
CREATE INDEX idx_assessments_evaluated_user ON assessments(evaluated_user_id);
CREATE INDEX idx_assessments_evaluator ON assessments(evaluator_user_id);
CREATE INDEX idx_assessments_test_type ON assessments(test_type);
CREATE INDEX idx_assessments_status ON assessments(status);

CREATE INDEX idx_pdi_plans_workspace ON pdi_plans(workspace_id);
CREATE INDEX idx_pdi_plans_user ON pdi_plans(user_id);
CREATE INDEX idx_pdi_plans_status ON pdi_plans(status);

CREATE INDEX idx_def_meetings_workspace ON def_meetings(workspace_id);
CREATE INDEX idx_def_meetings_seller ON def_meetings(seller_id);
CREATE INDEX idx_def_meetings_date ON def_meetings(meeting_date);

CREATE INDEX idx_teams_workspace ON teams(workspace_id);
CREATE INDEX idx_teams_leader ON teams(leader_id);

CREATE INDEX idx_alerts_workspace ON alerts(workspace_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
