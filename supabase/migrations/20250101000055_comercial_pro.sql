-- Migration: Create Comercial PRO tables
-- Description: Adds action_plans and consultancies tables

-- =============================================
-- PLANOS DE AÇÃO
-- =============================================

CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  responsible_id UUID REFERENCES users(id),
  deadline DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_action_plans_workspace ON action_plans(workspace_id);
CREATE INDEX idx_action_plans_responsible ON action_plans(responsible_id);
CREATE INDEX idx_action_plans_status ON action_plans(status);

-- =============================================
-- CONSULTORIAS
-- =============================================

CREATE TABLE consultancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mentor_id UUID REFERENCES users(id),
  recording_link TEXT,
  comments TEXT,
  action_plan_id UUID REFERENCES action_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consultancies_workspace ON consultancies(workspace_id);
CREATE INDEX idx_consultancies_mentor ON consultancies(mentor_id);
CREATE INDEX idx_consultancies_date ON consultancies(date);
