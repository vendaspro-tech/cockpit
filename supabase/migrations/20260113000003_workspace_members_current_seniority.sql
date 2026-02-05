-- Migration: 20260113000003_workspace_members_current_seniority.sql
-- Purpose: add "current seniority" snapshot columns per T008

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS current_seniority_level INTEGER,
  ADD COLUMN IF NOT EXISTS seniority_last_calibrated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seniority_last_assessment_id UUID REFERENCES seniority_assessments(id) ON DELETE SET NULL;

ALTER TABLE workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_current_seniority_level_check,
  ADD CONSTRAINT workspace_members_current_seniority_level_check
    CHECK (
      current_seniority_level IS NULL
      OR current_seniority_level BETWEEN 0 AND 3
    );

CREATE INDEX IF NOT EXISTS idx_workspace_members_current_seniority
  ON workspace_members(current_seniority_level)
  WHERE current_seniority_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_last_assessment
  ON workspace_members(seniority_last_assessment_id)
  WHERE seniority_last_assessment_id IS NOT NULL;

COMMENT ON COLUMN workspace_members.current_seniority_level IS 'Derived only from calibrated seniority v2 assessments (0–3).';
COMMENT ON COLUMN workspace_members.seniority_last_calibrated_at IS 'Timestamp of the last calibration that defined current_seniority_level.';
COMMENT ON COLUMN workspace_members.seniority_last_assessment_id IS 'Assessment that produced the current seniority snapshot.';
