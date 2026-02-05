-- =====================================================
-- COMMERCIAL PLANS CORE SCHEMA
-- =====================================================
-- Description: Core tables for commercial planning with audit trail
-- Version: 2.1
-- Date: 2026-01-04

-- =====================================================
-- 1. COMMERCIAL PLANS (Main Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS commercial_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  global_target NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Squad configuration
  use_squads BOOLEAN DEFAULT false,
  
  -- Marketing/Commercial split
  marketing_share NUMERIC CHECK (marketing_share >= 0 AND marketing_share <= 1),
  commercial_share NUMERIC CHECK (commercial_share >= 0 AND commercial_share <= 1),
  
  -- Days configuration
  days_mode TEXT DEFAULT 'business' CHECK (days_mode IN ('business', 'calendar')),
  business_days_config JSONB, -- {"jan": 22, "feb": 20, ...}
  
  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'revision', 'approved', 'active', 'archived')),
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Admin/Mentor fields
  internal_notes TEXT,
  mentor_feedback TEXT,
  
  CONSTRAINT valid_shares CHECK (
    (marketing_share IS NULL AND commercial_share IS NULL) OR 
    (marketing_share + commercial_share = 1)
  )
);

CREATE INDEX idx_commercial_plans_workspace ON commercial_plans(workspace_id);
CREATE INDEX idx_commercial_plans_year ON commercial_plans(year);
CREATE INDEX idx_commercial_plans_status ON commercial_plans(status);
CREATE INDEX idx_commercial_plans_created_by ON commercial_plans(created_by);

-- =====================================================
-- 2. PLAN SQUAD CONFIG (Links to existing squads table)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_squad_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  
  share_commercial NUMERIC CHECK (share_commercial >= 0 AND share_commercial <= 1),
  default_strategy TEXT DEFAULT 'perpetuo' CHECK (default_strategy IN ('perpetuo', 'lancamento', 'custom')),
  
  -- Perpetuo strategy params
  conversion_perpetuo NUMERIC DEFAULT 0.06,
  productivity_perpetuo INTEGER DEFAULT 20,
  days_perpetuo INTEGER DEFAULT 22,
  
  -- Lancamento strategy params
  conversion_lancamento NUMERIC DEFAULT 0.15,
  productivity_lancamento INTEGER DEFAULT 40,
  days_lancamento INTEGER DEFAULT 10,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id, squad_id)
);

CREATE INDEX idx_plan_squad_config_plan ON plan_squad_config(plan_id);
CREATE INDEX idx_plan_squad_config_squad ON plan_squad_config(squad_id);

-- =====================================================
-- 3. PLAN PRODUCTS (Links to existing products table)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES squads(id) ON DELETE SET NULL, -- Nullable if not using squads
  
  share_target NUMERIC CHECK (share_target >= 0 AND share_target <= 1),
  
  -- TMR Configuration
  gross_ticket NUMERIC NOT NULL,
  
  -- Payment methods (percentages and receivable rates)
  payment_avista_pct NUMERIC DEFAULT 0.40 CHECK (payment_avista_pct >= 0 AND payment_avista_pct <= 1),
  payment_avista_recebimento NUMERIC DEFAULT 1.0 CHECK (payment_avista_recebimento >= 0 AND payment_avista_recebimento <= 1),
  
  payment_parcelado_pct NUMERIC DEFAULT 0.50 CHECK (payment_parcelado_pct >= 0 AND payment_parcelado_pct <= 1),
  payment_parcelado_recebimento NUMERIC DEFAULT 0.85 CHECK (payment_parcelado_recebimento >= 0 AND payment_parcelado_recebimento <= 1),
  
  payment_recorrente_pct NUMERIC DEFAULT 0.10 CHECK (payment_recorrente_pct >= 0 AND payment_recorrente_pct <= 1),
  payment_recorrente_recebimento NUMERIC DEFAULT 1.0 CHECK (payment_recorrente_recebimento >= 0 AND payment_recorrente_recebimento <= 1),
  
  -- Adjustments
  refund_rate NUMERIC DEFAULT 0.05 CHECK (refund_rate >= 0 AND refund_rate <= 1),
  chargeback_rate NUMERIC DEFAULT 0.02 CHECK (chargeback_rate >= 0 AND chargeback_rate <= 1),
  default_rate NUMERIC DEFAULT 0.03 CHECK (default_rate >= 0 AND default_rate <= 1),
  
  -- Calculated TMR (stored for performance)
  tmr_calculated NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_payment_pcts CHECK (
    payment_avista_pct + payment_parcelado_pct + payment_recorrente_pct = 1
  )
);

CREATE INDEX idx_plan_products_plan ON plan_products(plan_id);
CREATE INDEX idx_plan_products_product ON plan_products(product_id);
CREATE INDEX idx_plan_products_squad ON plan_products(squad_id);

-- =====================================================
-- 4. PLAN PRODUCT MONTH STRATEGIES (KEY CHANGE FROM V1!)
-- Each month can have MULTIPLE strategy rows with % share
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_product_month_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_product_id UUID NOT NULL REFERENCES plan_products(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  strategy TEXT NOT NULL CHECK (strategy IN ('perpetuo', 'lancamento', 'custom')),
  share_month NUMERIC NOT NULL CHECK (share_month >= 0 AND share_month <= 1),
  
  -- Strategy-specific params (can override defaults)
  conversion_rate NUMERIC,
  productivity_per_day INTEGER,
  working_days INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_month_strategies_product ON plan_product_month_strategies(plan_product_id);
CREATE INDEX idx_plan_month_strategies_month ON plan_product_month_strategies(month);

-- Ensure share_month per product/month sums to 1.0
CREATE UNIQUE INDEX idx_plan_month_strategies_unique ON plan_product_month_strategies(plan_product_id, month, strategy);

-- =====================================================
-- 5. PLAN OTE CONFIGURATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_ote_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  job_title_id UUID NOT NULL REFERENCES job_titles(id) ON DELETE CASCADE,
  seniority TEXT NOT NULL CHECK (seniority IN ('junior', 'pleno', 'senior')),
  
  base_salary NUMERIC,
  commission_rate NUMERIC,
  bonus_on_target NUMERIC,
  productivity_per_day INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id, job_title_id, seniority)
);

CREATE INDEX idx_plan_ote_plan ON plan_ote_configurations(plan_id);
CREATE INDEX idx_plan_ote_job_title ON plan_ote_configurations(job_title_id);

-- =====================================================
-- 6. PLAN TEAM STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_team_structure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  
  seller_per_supervisor INTEGER DEFAULT 5,
  supervisor_per_coordinator INTEGER DEFAULT 3,
  
  -- Seniority distribution by job role
  seniority_distribution JSONB, -- {"sdr": {"junior": 0.5, "pleno": 0.3, "senior": 0.2}}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id)
);

CREATE INDEX idx_plan_team_structure_plan ON plan_team_structure(plan_id);

-- =====================================================
-- 7. PLAN MARKETING CONFIG
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_marketing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  
  monthly_investment NUMERIC,
  cpl NUMERIC, -- Cost Per Lead (MQL)
  mql_to_sql_rate NUMERIC DEFAULT 0.25 CHECK (mql_to_sql_rate >= 0 AND mql_to_sql_rate <= 1),
  expected_roas NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id)
);

CREATE INDEX idx_plan_marketing_config_plan ON plan_marketing_config(plan_id);

-- =====================================================
-- 8. PLAN PRODUCT STRATEGY RESULTS (Cache - Level 4)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_product_strategy_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_product_id UUID NOT NULL REFERENCES plan_products(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  strategy TEXT NOT NULL,
  multiplier NUMERIC DEFAULT 1.0, -- 0.5, 0.7, 1.0, 1.2, 1.4
  
  -- Funnel metrics
  mqls INTEGER,
  sqls INTEGER,
  conversion_mql_sql NUMERIC,
  sales INTEGER,
  conversion_sql_sale NUMERIC,
  
  -- Financial metrics
  revenue NUMERIC,
  investment NUMERIC,
  cac NUMERIC,
  roas NUMERIC,
  roi NUMERIC,
  contribution_margin NUMERIC,
  
  -- Team
  team_breakdown JSONB, -- {"sdr": {"junior": 2, "pleno": 1}, ...}
  payroll_total NUMERIC,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_product_results_product ON plan_product_strategy_results(plan_product_id);
CREATE INDEX idx_plan_product_results_month ON plan_product_strategy_results(month);

-- =====================================================
-- 9. PLAN SQUAD MONTH SUMMARY (Cache - Level 2)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_squad_month_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  total_mqls INTEGER,
  total_sqls INTEGER,
  total_sales INTEGER,
  total_revenue NUMERIC,
  total_investment NUMERIC,
  avg_cac NUMERIC,
  avg_roas NUMERIC,
  avg_roi NUMERIC,
  total_margin NUMERIC,
  
  team_summary JSONB,
  total_headcount INTEGER,
  payroll_total NUMERIC,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id, squad_id, month)
);

CREATE INDEX idx_plan_squad_summary_plan ON plan_squad_month_summary(plan_id);
CREATE INDEX idx_plan_squad_summary_squad ON plan_squad_month_summary(squad_id);

-- =====================================================
-- 10. PLAN ANNUAL SUMMARY (Cache - Level 1)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_annual_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  
  total_mqls INTEGER,
  total_sqls INTEGER,
  total_sales INTEGER,
  total_revenue NUMERIC,
  total_investment NUMERIC,
  avg_cac NUMERIC,
  avg_roas NUMERIC,
  avg_roi NUMERIC,
  total_margin NUMERIC,
  ebitda_projected NUMERIC,
  
  team_max_by_role JSONB,
  total_max_headcount INTEGER,
  payroll_annual NUMERIC,
  marketing_annual NUMERIC,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id)
);

CREATE INDEX idx_plan_annual_summary_plan ON plan_annual_summary(plan_id);

-- =====================================================
-- 11. PLAN SCENARIOS (What-If Simulations)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES commercial_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  adjustments JSONB, -- What changed from base plan
  results JSONB,     -- Calculated results
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_scenarios_plan ON plan_scenarios(plan_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE commercial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_squad_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_product_month_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_ote_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_team_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_marketing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_product_strategy_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_squad_month_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_annual_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_scenarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMERCIAL PLANS RLS
-- =====================================================

-- Only users with hierarchy_level <= 1 can access
CREATE POLICY commercial_plans_select ON commercial_plans
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    JOIN job_titles jt ON wm.job_title_id = jt.id
    WHERE wm.workspace_id = commercial_plans.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND jt.hierarchy_level <= 1
  )
);

CREATE POLICY commercial_plans_insert ON commercial_plans
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    JOIN job_titles jt ON wm.job_title_id = jt.id
    WHERE wm.workspace_id = commercial_plans.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND jt.hierarchy_level <= 1
  )
);

CREATE POLICY commercial_plans_update ON commercial_plans
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    JOIN job_titles jt ON wm.job_title_id = jt.id
    WHERE wm.workspace_id = commercial_plans.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND jt.hierarchy_level <= 1
  )
);

CREATE POLICY commercial_plans_delete ON commercial_plans
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    JOIN job_titles jt ON wm.job_title_id = jt.id
    WHERE wm.workspace_id = commercial_plans.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND jt.hierarchy_level = 0 -- Only strategic level can delete
  )
);

-- =====================================================
-- RLS FOR CHILD TABLES (inherit from commercial_plans)
-- =====================================================

-- Plan Squad Config
CREATE POLICY plan_squad_config_select ON plan_squad_config
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_squad_config.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

CREATE POLICY plan_squad_config_all ON plan_squad_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_squad_config.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- Plan Products
CREATE POLICY plan_products_all ON plan_products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_products.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- Plan Product Month Strategies
CREATE POLICY plan_month_strategies_all ON plan_product_month_strategies
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM plan_products pp
    JOIN commercial_plans cp ON cp.id = pp.plan_id
    WHERE pp.id = plan_product_month_strategies.plan_product_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- Plan OTE Configurations
CREATE POLICY plan_ote_all ON plan_ote_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_ote_configurations.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- Plan Team Structure
CREATE POLICY plan_team_structure_all ON plan_team_structure
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_team_structure.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- Plan Marketing Config
CREATE POLICY plan_marketing_config_all ON plan_marketing_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_marketing_config.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- Results tables (read-only for most)
CREATE POLICY plan_product_results_all ON plan_product_strategy_results
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM plan_products pp
    JOIN commercial_plans cp ON cp.id = pp.plan_id
    WHERE pp.id = plan_product_strategy_results.plan_product_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

CREATE POLICY plan_squad_summary_all ON plan_squad_month_summary
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_squad_month_summary.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

CREATE POLICY plan_annual_summary_all ON plan_annual_summary
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_annual_summary.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

CREATE POLICY plan_scenarios_all ON plan_scenarios
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM commercial_plans cp
    WHERE cp.id = plan_scenarios.plan_id
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      JOIN job_titles jt ON wm.job_title_id = jt.id
      WHERE wm.workspace_id = cp.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND jt.hierarchy_level <= 1
    )
  )
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate TMR
CREATE OR REPLACE FUNCTION calculate_tmr(
  p_gross_ticket NUMERIC,
  p_avista_pct NUMERIC,
  p_avista_rec NUMERIC,
  p_parcelado_pct NUMERIC,
  p_parcelado_rec NUMERIC,
  p_recorrente_pct NUMERIC,
  p_recorrente_rec NUMERIC,
  p_refund NUMERIC,
  p_chargeback NUMERIC,
  p_default NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_fator_recebimento NUMERIC;
  v_tmr NUMERIC;
BEGIN
  -- Calculate receivable factor
  v_fator_recebimento := 
    (p_avista_pct * p_avista_rec) +
    (p_parcelado_pct * p_parcelado_rec) +
    (p_recorrente_pct * p_recorrente_rec);
  
  -- Calculate TMR
  v_tmr := p_gross_ticket * v_fator_recebimento * (1 - p_refund - p_chargeback - p_default);
  
  RETURN v_tmr;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate TMR on plan_products
CREATE OR REPLACE FUNCTION update_plan_product_tmr()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tmr_calculated := calculate_tmr(
    NEW.gross_ticket,
    NEW.payment_avista_pct,
    NEW.payment_avista_recebimento,
    NEW.payment_parcelado_pct,
    NEW.payment_parcelado_recebimento,
    NEW.payment_recorrente_pct,
    NEW.payment_recorrente_recebimento,
    NEW.refund_rate,
    NEW.chargeback_rate,
    NEW.default_rate
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_tmr
  BEFORE INSERT OR UPDATE ON plan_products
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_product_tmr();

-- Trigger to auto-update updated_at on commercial_plans
CREATE OR REPLACE FUNCTION update_commercial_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commercial_plan_timestamp
  BEFORE UPDATE ON commercial_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_plan_timestamp();
