-- Migration: 20260114000001_fix_seniority_rls_user_mapping.sql
-- Purpose: fix RLS policies to properly map auth.uid() → users.id (internal)

-- The seniority_assessments table uses internal user IDs (users.id),
-- and policies must convert auth.uid() to users.id before comparisons.
-- The correct helper function is can_view_user_data (not can_view_user_in_workspace).

ALTER TABLE seniority_assessments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seniority_assessments_system_owners ON seniority_assessments;
DROP POLICY IF EXISTS seniority_assessments_self_read ON seniority_assessments;
DROP POLICY IF EXISTS seniority_assessments_hierarchy_read ON seniority_assessments;
DROP POLICY IF EXISTS seniority_assessments_self_insert ON seniority_assessments;
DROP POLICY IF EXISTS seniority_assessments_self_update ON seniority_assessments;
DROP POLICY IF EXISTS seniority_assessments_leader_insert ON seniority_assessments;
DROP POLICY IF EXISTS seniority_assessments_leader_update ON seniority_assessments;

ALTER TABLE seniority_assessments ENABLE ROW LEVEL SECURITY;

-- Super admin escape hatch (audit/debug scenarios)
CREATE POLICY seniority_assessments_system_owners
  ON seniority_assessments
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

-- Read policies (self + hierarchy visibility)
-- Convert auth.uid() → users.id via supabase_user_id
CREATE POLICY seniority_assessments_self_read
  ON seniority_assessments
  FOR SELECT
  TO authenticated
  USING (
    evaluated_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY seniority_assessments_hierarchy_read
  ON seniority_assessments
  FOR SELECT
  TO authenticated
  USING (
    evaluator_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    OR can_view_user_data(
      (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text),
      evaluated_user_id,
      workspace_id
    )
  );

-- Write policies (self flow)
CREATE POLICY seniority_assessments_self_insert
  ON seniority_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_type = 'self'
    AND evaluated_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    AND workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE u.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY seniority_assessments_self_update
  ON seniority_assessments
  FOR UPDATE
  TO authenticated
  USING (
    assessment_type = 'self'
    AND evaluated_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    AND status = 'draft'
  )
  WITH CHECK (
    assessment_type = 'self'
    AND evaluated_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    AND status IN ('draft', 'self_submitted')
  );

-- Write policies (leader + calibration flow)
CREATE POLICY seniority_assessments_leader_insert
  ON seniority_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_type = 'leader'
    AND evaluator_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    AND can_view_user_data(
      (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text),
      evaluated_user_id,
      workspace_id
    )
  );

CREATE POLICY seniority_assessments_leader_update
  ON seniority_assessments
  FOR UPDATE
  TO authenticated
  USING (
    assessment_type = 'leader'
    AND evaluator_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    AND can_view_user_data(
      (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text),
      evaluated_user_id,
      workspace_id
    )
    AND status IN ('draft', 'leader_submitted')
  )
  WITH CHECK (
    assessment_type = 'leader'
    AND evaluator_user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_user_id = auth.uid()::text
    )
    AND can_view_user_data(
      (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text),
      evaluated_user_id,
      workspace_id
    )
    AND status IN ('draft', 'leader_submitted', 'calibrated')
  );

COMMENT ON POLICY seniority_assessments_hierarchy_read ON seniority_assessments IS 'Leaders can only read assessments for subordinates per hierarchy helper. Maps auth.uid() → users.id via supabase_user_id.';
COMMENT ON POLICY seniority_assessments_leader_update ON seniority_assessments IS 'Leaders own draft/leader_submitted phases and can finalize calibration. Maps auth.uid() → users.id via supabase_user_id.';
