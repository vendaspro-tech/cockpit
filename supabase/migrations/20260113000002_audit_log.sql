-- Migration: 20260113000002_audit_log.sql
-- Purpose: create minimal audit trail table for FR-008 (T007)

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_workspace_created
  ON audit_log(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created
  ON audit_log(actor_user_id, created_at DESC);

COMMENT ON TABLE audit_log IS 'Append-only audit trail for global/admin changes and seniority calibrations.';
COMMENT ON COLUMN audit_log.before_state IS 'Snapshot of the entity before the change (nullable).';
COMMENT ON COLUMN audit_log.after_state IS 'Snapshot of the entity after the change (nullable).';
