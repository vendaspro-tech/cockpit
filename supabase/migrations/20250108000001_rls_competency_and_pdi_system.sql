-- Migration: 20250108000001_rls_competency_and_pdi_system.sql
-- RLS Policies for Competency Framework, Seniority Assessments, DEF Evaluations, and PDIs
-- Based on Hierarchy Levels (PRD Section 2.1)
--
-- IMPORTANT: This migration will DROP and recreate helper functions with CASCADE
-- This may temporarily remove policies from other tables (like job_titles) that depend on these functions
-- All affected policies will be automatically recreated when the functions are recreated

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Drop existing functions if they exist (to avoid parameter name conflicts)
-- CASCADE is needed because these functions may have dependent policies from previous migrations
-- Don't worry: all policies will be recreated by this migration
DROP FUNCTION IF EXISTS get_user_hierarchy_level(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS can_view_user_data(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_leader(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_system_owner(UUID) CASCADE;

-- Function to get user's hierarchy level
CREATE OR REPLACE FUNCTION get_user_hierarchy_level(user_id_param UUID, workspace_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  hierarchy_level INTEGER;
BEGIN
  -- Get hierarchy level from workspace_members -> job_titles
  -- Note: job_title_id is stored in workspace_members, not users table
  SELECT jt.hierarchy_level INTO hierarchy_level
  FROM workspace_members wm
  LEFT JOIN job_titles jt ON wm.job_title_id = jt.id
  WHERE wm.user_id = user_id_param
    AND wm.workspace_id = workspace_id_param;

  -- Default to lowest level (3 - Execution) if no job title assigned
  RETURN COALESCE(hierarchy_level, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view target user's data based on hierarchy
CREATE OR REPLACE FUNCTION can_view_user_data(
  viewer_id UUID,
  target_user_id UUID,
  workspace_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  viewer_level INTEGER;
  target_level INTEGER;
BEGIN
  -- User can always view their own data
  IF viewer_id = target_user_id THEN
    RETURN TRUE;
  END IF;

  -- Get hierarchy levels
  viewer_level := get_user_hierarchy_level(viewer_id, workspace_id_param);
  target_level := get_user_hierarchy_level(target_user_id, workspace_id_param);

  -- Viewer can see data of users with higher hierarchy level (lower privilege)
  -- Level 0 (Strategic) sees all
  -- Level 1 (Tactical) sees 2 and 3
  -- Level 2 (Operational) sees 3
  -- Level 3 (Execution) sees only self
  RETURN viewer_level < target_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a leader (hierarchy level 0, 1, or 2)
CREATE OR REPLACE FUNCTION is_leader(user_id_param UUID, workspace_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_hierarchy_level(user_id_param, workspace_id_param) <= 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is system owner (super admin)
CREATE OR REPLACE FUNCTION is_system_owner(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id_param
    AND is_super_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPETENCY FRAMEWORKS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System owners full access on competency_frameworks" ON competency_frameworks;
DROP POLICY IF EXISTS "Users can view competency frameworks in workspace" ON competency_frameworks;
DROP POLICY IF EXISTS "Leaders can manage competency frameworks" ON competency_frameworks;

-- Enable RLS
ALTER TABLE competency_frameworks ENABLE ROW LEVEL SECURITY;

-- Policy: System owners can do everything
CREATE POLICY "System owners full access on competency_frameworks"
  ON competency_frameworks
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()));

-- Policy: Users can view frameworks in their workspace
CREATE POLICY "Users can view competency frameworks in workspace"
  ON competency_frameworks
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    OR workspace_id IS NULL -- Global templates
  );

-- Policy: Leaders (Level 0-2) can create/update frameworks
CREATE POLICY "Leaders can manage competency frameworks"
  ON competency_frameworks
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND is_leader(auth.uid(), wm.workspace_id)
    )
  );

-- ============================================================================
-- SENIORITY ASSESSMENTS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System owners full access on seniority_assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Users can view own seniority assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Leaders can view subordinates seniority assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Users can create self assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Leaders can create assessments for subordinates" ON seniority_assessments;
DROP POLICY IF EXISTS "Users can update own draft assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Leaders can calibrate assessments" ON seniority_assessments;

-- Enable RLS
ALTER TABLE seniority_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: System owners full access
CREATE POLICY "System owners full access on seniority_assessments"
  ON seniority_assessments
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()));

-- Policy: Users can view their own assessments
CREATE POLICY "Users can view own seniority assessments"
  ON seniority_assessments
  FOR SELECT
  TO authenticated
  USING (
    evaluated_user_id = auth.uid()
    OR evaluator_user_id = auth.uid()
  );

-- Policy: Leaders can view assessments based on hierarchy
CREATE POLICY "Leaders can view subordinates seniority assessments"
  ON seniority_assessments
  FOR SELECT
  TO authenticated
  USING (
    can_view_user_data(auth.uid(), evaluated_user_id, workspace_id)
  );

-- Policy: Users can create self-assessments
CREATE POLICY "Users can create self assessments"
  ON seniority_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluated_user_id = auth.uid()
    AND assessment_type = 'self'
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Leaders can create assessments for subordinates
CREATE POLICY "Leaders can create assessments for subordinates"
  ON seniority_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_type = 'leader'
    AND evaluator_user_id = auth.uid()
    AND can_view_user_data(auth.uid(), evaluated_user_id, workspace_id)
  );

-- Policy: Users can update their own draft assessments
CREATE POLICY "Users can update own draft assessments"
  ON seniority_assessments
  FOR UPDATE
  TO authenticated
  USING (
    (evaluated_user_id = auth.uid() AND assessment_type = 'self' AND status = 'draft')
    OR (evaluator_user_id = auth.uid() AND assessment_type = 'leader')
  );

-- Policy: Leaders can calibrate assessments
CREATE POLICY "Leaders can calibrate assessments"
  ON seniority_assessments
  FOR UPDATE
  TO authenticated
  USING (
    is_leader(auth.uid(), workspace_id)
    AND can_view_user_data(auth.uid(), evaluated_user_id, workspace_id)
    AND status IN ('submitted', 'calibrated')
  );

-- ============================================================================
-- DEF CALL EVALUATIONS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System owners full access on def_evaluations" ON def_call_evaluations;
DROP POLICY IF EXISTS "Users can view own def evaluations" ON def_call_evaluations;
DROP POLICY IF EXISTS "Leaders can view subordinates def evaluations" ON def_call_evaluations;
DROP POLICY IF EXISTS "Users can create own def evaluations" ON def_call_evaluations;
DROP POLICY IF EXISTS "Leaders can create evaluations for subordinates" ON def_call_evaluations;
DROP POLICY IF EXISTS "AI can create evaluations" ON def_call_evaluations;
DROP POLICY IF EXISTS "Evaluators can update own evaluations" ON def_call_evaluations;

-- Enable RLS
ALTER TABLE def_call_evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: System owners full access
CREATE POLICY "System owners full access on def_evaluations"
  ON def_call_evaluations
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()));

-- Policy: Users can view their own evaluations
CREATE POLICY "Users can view own def evaluations"
  ON def_call_evaluations
  FOR SELECT
  TO authenticated
  USING (
    evaluated_user_id = auth.uid()
    OR evaluator_user_id = auth.uid()
  );

-- Policy: Leaders can view subordinates' evaluations
CREATE POLICY "Leaders can view subordinates def evaluations"
  ON def_call_evaluations
  FOR SELECT
  TO authenticated
  USING (
    can_view_user_data(auth.uid(), evaluated_user_id, workspace_id)
  );

-- Policy: Users can create their own evaluations (platform tests, self-assessments)
CREATE POLICY "Users can create own def evaluations"
  ON def_call_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluated_user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Leaders can create evaluations for subordinates (sparrings, real calls)
CREATE POLICY "Leaders can create evaluations for subordinates"
  ON def_call_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_user_id = auth.uid()
    AND can_view_user_data(auth.uid(), evaluated_user_id, workspace_id)
    AND source_type IN ('sparring', 'real_call')
  );

-- Policy: System (AI) can create evaluations (is_ai_evaluation = true)
CREATE POLICY "AI can create evaluations"
  ON def_call_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_ai_evaluation = TRUE
    AND evaluator_user_id IS NULL
  );

-- Policy: Evaluators can update their own evaluations
CREATE POLICY "Evaluators can update own evaluations"
  ON def_call_evaluations
  FOR UPDATE
  TO authenticated
  USING (
    evaluator_user_id = auth.uid()
    OR (evaluated_user_id = auth.uid() AND evaluator_user_id IS NULL)
  );

-- ============================================================================
-- PDIs (Individual Development Plans)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System owners full access on pdis" ON pdis;
DROP POLICY IF EXISTS "Users can view own pdis" ON pdis;
DROP POLICY IF EXISTS "Leaders can view subordinates pdis" ON pdis;
DROP POLICY IF EXISTS "Users can create own pdis" ON pdis;
DROP POLICY IF EXISTS "Leaders can create pdis for subordinates" ON pdis;
DROP POLICY IF EXISTS "Users can update own pdis" ON pdis;
DROP POLICY IF EXISTS "Leaders can update managed pdis" ON pdis;
DROP POLICY IF EXISTS "Users can delete own draft pdis" ON pdis;
DROP POLICY IF EXISTS "Leaders can delete subordinates draft pdis" ON pdis;

-- Enable RLS
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;

-- Policy: System owners full access
CREATE POLICY "System owners full access on pdis"
  ON pdis
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()));

-- Policy: Users can view their own PDIs
CREATE POLICY "Users can view own pdis"
  ON pdis
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR leader_id = auth.uid()
  );

-- Policy: Leaders can view subordinates' PDIs
CREATE POLICY "Leaders can view subordinates pdis"
  ON pdis
  FOR SELECT
  TO authenticated
  USING (
    can_view_user_data(auth.uid(), user_id, workspace_id)
  );

-- Policy: Users can create their own PDIs
CREATE POLICY "Users can create own pdis"
  ON pdis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Leaders can create PDIs for subordinates
CREATE POLICY "Leaders can create pdis for subordinates"
  ON pdis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    leader_id = auth.uid()
    AND can_view_user_data(auth.uid(), user_id, workspace_id)
  );

-- Policy: Users can update their own PDIs (collaborator side)
CREATE POLICY "Users can update own pdis"
  ON pdis
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('draft', 'active')
  );

-- Policy: Leaders can update PDIs they manage
CREATE POLICY "Leaders can update managed pdis"
  ON pdis
  FOR UPDATE
  TO authenticated
  USING (
    leader_id = auth.uid()
    OR can_view_user_data(auth.uid(), user_id, workspace_id)
  );

-- Policy: Users can delete their own draft PDIs
CREATE POLICY "Users can delete own draft pdis"
  ON pdis
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'draft'
  );

-- Policy: Leaders can delete subordinates' draft PDIs
CREATE POLICY "Leaders can delete subordinates draft pdis"
  ON pdis
  FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND can_view_user_data(auth.uid(), user_id, workspace_id)
  );

-- ============================================================================
-- LEADERSHIP STYLE ASSESSMENTS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System owners full access on leadership_style" ON leadership_style_assessments;
DROP POLICY IF EXISTS "Users can view own leadership style" ON leadership_style_assessments;
DROP POLICY IF EXISTS "Leaders can view subordinates leadership style" ON leadership_style_assessments;
DROP POLICY IF EXISTS "Leaders can create own leadership style assessment" ON leadership_style_assessments;
DROP POLICY IF EXISTS "Users can update own leadership style" ON leadership_style_assessments;

-- Enable RLS
ALTER TABLE leadership_style_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: System owners full access
CREATE POLICY "System owners full access on leadership_style"
  ON leadership_style_assessments
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()));

-- Policy: Users can view their own assessments
CREATE POLICY "Users can view own leadership style"
  ON leadership_style_assessments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Leaders can view subordinates' leadership styles
CREATE POLICY "Leaders can view subordinates leadership style"
  ON leadership_style_assessments
  FOR SELECT
  TO authenticated
  USING (
    can_view_user_data(auth.uid(), user_id, workspace_id)
  );

-- Policy: Only leaders can create leadership style assessments
-- (Per PRD Section 2.5: only leadership roles)
CREATE POLICY "Leaders can create own leadership style assessment"
  ON leadership_style_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_leader(auth.uid(), workspace_id)
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own assessments
CREATE POLICY "Users can update own leadership style"
  ON leadership_style_assessments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes to optimize hierarchy checks
-- Index on workspace_members for fast job title lookups
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_workspace
  ON workspace_members(user_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_job_title
  ON workspace_members(job_title_id);

CREATE INDEX IF NOT EXISTS idx_job_titles_hierarchy
  ON job_titles(hierarchy_level);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_hierarchy_level(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_user_data(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_leader(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_system_owner(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_hierarchy_level IS
  'Returns the hierarchy level (0-3) of a user in a workspace. Lower number = higher privilege.';

COMMENT ON FUNCTION can_view_user_data IS
  'Checks if viewer can see target user data based on hierarchy. Rule: User(N) sees User(>N).';

COMMENT ON FUNCTION is_leader IS
  'Returns true if user has leadership role (hierarchy level 0, 1, or 2).';

COMMENT ON FUNCTION is_system_owner IS
  'Returns true if user is system owner (super admin).';

-- ============================================================================
-- RECREATE POLICIES FOR OTHER TABLES (REMOVED BY CASCADE)
-- ============================================================================

-- The DROP CASCADE above may have removed policies from other tables that depend on is_system_owner
-- We need to recreate critical policies here to ensure system owners can still manage the system

-- Job Titles: System owners should have full control
DROP POLICY IF EXISTS "System owners can manage job titles" ON job_titles;
CREATE POLICY "System owners can manage job titles"
  ON job_titles
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()))
  WITH CHECK (is_system_owner(auth.uid()));
