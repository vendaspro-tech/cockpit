-- Migration: 20260113000006_seniority_assessments_rls.sql
-- Purpose: align seniority assessment workflow + policies with FR-002 (T011)

-- Extend status enum to cover self/leader calibration phases
ALTER TABLE seniority_assessments
  DROP CONSTRAINT IF EXISTS seniority_assessments_status_check;

ALTER TABLE seniority_assessments
  ADD CONSTRAINT seniority_assessments_status_check
    CHECK (
      status IN (
        'draft',
        'self_submitted',
        'leader_submitted',
        'calibrated',
        'cancelled'
      )
    );

ALTER TABLE seniority_assessments
  ALTER COLUMN status SET DEFAULT 'draft';

-- Refresh policies -----------------------------------------------------------
ALTER TABLE seniority_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System owners full access on seniority_assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Users can view own seniority assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Leaders can view subordinates seniority assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Users can create self assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Leaders can create assessments for subordinates" ON seniority_assessments;
DROP POLICY IF EXISTS "Users can update own draft assessments" ON seniority_assessments;
DROP POLICY IF EXISTS "Leaders can calibrate assessments" ON seniority_assessments;

-- Super admin escape hatch (audit/debug scenarios)
CREATE POLICY seniority_assessments_system_owners
  ON seniority_assessments
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()))
  WITH CHECK (is_system_owner(auth.uid()));

-- Read policies (self + hierarchy visibility)
CREATE POLICY seniority_assessments_self_read
  ON seniority_assessments
  FOR SELECT
  TO authenticated
  USING (evaluated_user_id = auth.uid());

CREATE POLICY seniority_assessments_hierarchy_read
  ON seniority_assessments
  FOR SELECT
  TO authenticated
  USING (
    evaluator_user_id = auth.uid()
    OR can_view_user_in_workspace(auth.uid(), evaluated_user_id, workspace_id)
  );

-- Write policies (self flow)
CREATE POLICY seniority_assessments_self_insert
  ON seniority_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_type = 'self'
    AND evaluated_user_id = auth.uid()
    AND workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY seniority_assessments_self_update
  ON seniority_assessments
  FOR UPDATE
  TO authenticated
  USING (
    assessment_type = 'self'
    AND evaluated_user_id = auth.uid()
    AND status = 'draft'
  )
  WITH CHECK (
    assessment_type = 'self'
    AND evaluated_user_id = auth.uid()
    AND status IN ('draft', 'self_submitted')
  );

-- Write policies (leader + calibration flow)
CREATE POLICY seniority_assessments_leader_insert
  ON seniority_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_type = 'leader'
    AND evaluator_user_id = auth.uid()
    AND can_view_user_in_workspace(auth.uid(), evaluated_user_id, workspace_id)
  );

CREATE POLICY seniority_assessments_leader_update
  ON seniority_assessments
  FOR UPDATE
  TO authenticated
  USING (
    assessment_type = 'leader'
    AND evaluator_user_id = auth.uid()
    AND can_view_user_in_workspace(auth.uid(), evaluated_user_id, workspace_id)
    AND status IN ('draft', 'leader_submitted')
  )
  WITH CHECK (
    assessment_type = 'leader'
    AND evaluator_user_id = auth.uid()
    AND can_view_user_in_workspace(auth.uid(), evaluated_user_id, workspace_id)
    AND status IN ('draft', 'leader_submitted', 'calibrated')
  );

COMMENT ON POLICY seniority_assessments_hierarchy_read ON seniority_assessments IS 'Leaders can only read assessments for subordinates per hierarchy helper.';
COMMENT ON POLICY seniority_assessments_leader_update ON seniority_assessments IS 'Leaders own draft/leader_submitted phases and can finalize calibration.';
