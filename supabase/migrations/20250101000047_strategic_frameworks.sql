-- =============================================
-- STRATEGIC FRAMEWORKS MODULE - MVP SCHEMA
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. STRATEGIC CYCLES - Core table for quarterly planning
-- =============================================
CREATE TABLE IF NOT EXISTS strategic_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quarter TEXT NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'executing', 'reviewing', 'completed')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategic_cycles_workspace ON strategic_cycles(workspace_id);
CREATE INDEX idx_strategic_cycles_status ON strategic_cycles(status);

COMMENT ON TABLE strategic_cycles IS 'Quarterly strategic planning cycles';
COMMENT ON COLUMN strategic_cycles.quarter IS 'Quarter identifier (Q1, Q2, Q3, Q4)';
COMMENT ON COLUMN strategic_cycles.status IS 'Cycle status: planning, executing, reviewing, completed';

-- =============================================
-- 2. SWOT ITEMS - SWOT Analysis entries
-- =============================================
CREATE TABLE IF NOT EXISTS swot_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  quadrant TEXT NOT NULL CHECK (quadrant IN ('strength', 'weakness', 'opportunity', 'threat')),
  title TEXT NOT NULL,
  description TEXT,
  evidence TEXT,
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
  priority_rank INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_swot_items_cycle ON swot_items(cycle_id);
CREATE INDEX idx_swot_items_quadrant ON swot_items(quadrant);

COMMENT ON TABLE swot_items IS 'SWOT analysis items (Strengths, Weaknesses, Opportunities, Threats)';
COMMENT ON COLUMN swot_items.quadrant IS 'SWOT quadrant: strength, weakness, opportunity, threat';

-- =============================================
-- 3. EXECUTION ACTIONS - Strategic action items
-- =============================================
CREATE TABLE IF NOT EXISTS execution_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pillar TEXT CHECK (pillar IN ('penetration', 'product', 'market', 'diversification', 'general')),
  
  -- Assignment
  owner_id UUID REFERENCES users(id),
  
  -- Dates
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  priority TEXT CHECK (priority IN ('P1', 'P2', 'P3')),
  
  -- KPIs
  success_metric TEXT,
  target_value TEXT,
  current_value TEXT,
  
  -- Blockers
  blocker_description TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_actions_cycle ON execution_actions(cycle_id);
CREATE INDEX idx_execution_actions_status ON execution_actions(status);
CREATE INDEX idx_execution_actions_owner ON execution_actions(owner_id);
CREATE INDEX idx_execution_actions_due_date ON execution_actions(due_date);

COMMENT ON TABLE execution_actions IS 'Strategic execution actions linked to cycles';
COMMENT ON COLUMN execution_actions.pillar IS 'Ansoff strategy pillar: penetration, product, market, diversification, general';

-- =============================================
-- 4. CYCLE METRICS - KPIs for cycles
-- =============================================
CREATE TABLE IF NOT EXISTS cycle_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('revenue', 'leads', 'conversion', 'cac', 'ltv', 'nps', 'churn', 'custom')),
  
  -- Values
  baseline_value DECIMAL,
  target_value DECIMAL,
  current_value DECIMAL,
  
  -- Config
  measurement_frequency TEXT DEFAULT 'weekly' CHECK (measurement_frequency IN ('daily', 'weekly', 'monthly')),
  unit TEXT, -- 'R$', '%', 'count', etc.
  higher_is_better BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cycle_metrics_cycle ON cycle_metrics(cycle_id);

COMMENT ON TABLE cycle_metrics IS 'KPIs and metrics for strategic cycles';

-- =============================================
-- 5. METRIC SNAPSHOTS - Time-series for metrics
-- =============================================
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES cycle_metrics(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  recorded_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metric_snapshots_metric ON metric_snapshots(metric_id);
CREATE INDEX idx_metric_snapshots_date ON metric_snapshots(recorded_at);

COMMENT ON TABLE metric_snapshots IS 'Historical snapshots of metric values';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE strategic_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;

-- Strategic Cycles: Members can view/modify their workspace cycles
CREATE POLICY strategic_cycles_select_policy ON strategic_cycles
  FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.user_workspaces(auth.uid())));

CREATE POLICY strategic_cycles_insert_policy ON strategic_cycles
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.user_workspaces(auth.uid())));

CREATE POLICY strategic_cycles_update_policy ON strategic_cycles
  FOR UPDATE TO authenticated
  USING (workspace_id IN (SELECT public.user_workspaces(auth.uid())));

CREATE POLICY strategic_cycles_delete_policy ON strategic_cycles
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND workspace_id = strategic_cycles.workspace_id
      AND role IN ('owner', 'admin')
    )
  );

-- SWOT Items: Follow cycle access
CREATE POLICY swot_items_select_policy ON swot_items
  FOR SELECT TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY swot_items_insert_policy ON swot_items
  FOR INSERT TO authenticated
  WITH CHECK (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY swot_items_update_policy ON swot_items
  FOR UPDATE TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY swot_items_delete_policy ON swot_items
  FOR DELETE TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

-- Execution Actions: Follow cycle access
CREATE POLICY execution_actions_select_policy ON execution_actions
  FOR SELECT TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY execution_actions_insert_policy ON execution_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY execution_actions_update_policy ON execution_actions
  FOR UPDATE TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY execution_actions_delete_policy ON execution_actions
  FOR DELETE TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

-- Cycle Metrics: Follow cycle access
CREATE POLICY cycle_metrics_select_policy ON cycle_metrics
  FOR SELECT TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY cycle_metrics_all_policy ON cycle_metrics
  FOR ALL TO authenticated
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

-- Metric Snapshots: Follow metric/cycle access
CREATE POLICY metric_snapshots_select_policy ON metric_snapshots
  FOR SELECT TO authenticated
  USING (
    metric_id IN (
      SELECT id FROM cycle_metrics
      WHERE cycle_id IN (
        SELECT id FROM strategic_cycles
        WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
      )
    )
  );

CREATE POLICY metric_snapshots_all_policy ON metric_snapshots
  FOR ALL TO authenticated
  USING (
    metric_id IN (
      SELECT id FROM cycle_metrics
      WHERE cycle_id IN (
        SELECT id FROM strategic_cycles
        WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
      )
    )
  );

-- =============================================
-- TRIGGERS for updated_at
-- =============================================

-- Update trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_strategic_cycles_updated_at ON strategic_cycles;
CREATE TRIGGER update_strategic_cycles_updated_at
    BEFORE UPDATE ON strategic_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_swot_items_updated_at ON swot_items;
CREATE TRIGGER update_swot_items_updated_at
    BEFORE UPDATE ON swot_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_execution_actions_updated_at ON execution_actions;
CREATE TRIGGER update_execution_actions_updated_at
    BEFORE UPDATE ON execution_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cycle_metrics_updated_at ON cycle_metrics;
CREATE TRIGGER update_cycle_metrics_updated_at
    BEFORE UPDATE ON cycle_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
