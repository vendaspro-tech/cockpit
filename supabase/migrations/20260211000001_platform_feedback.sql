-- Migration: 20260211000001_platform_feedback.sql
-- Purpose: collect periodic platform feedback (monthly cadence with dismiss state)

CREATE TABLE IF NOT EXISTS platform_feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_score SMALLINT NOT NULL CHECK (experience_score BETWEEN 0 AND 10),
  recommendation_score SMALLINT NOT NULL CHECK (recommendation_score BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_feedback_prompt_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_dismissed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_responses_user_created
  ON platform_feedback_responses(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_responses_created
  ON platform_feedback_responses(created_at DESC);

DROP TRIGGER IF EXISTS update_platform_feedback_prompt_state_updated_at ON platform_feedback_prompt_state;
CREATE TRIGGER update_platform_feedback_prompt_state_updated_at
  BEFORE UPDATE ON platform_feedback_prompt_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE platform_feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_feedback_prompt_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_feedback_responses_system_owner_all ON platform_feedback_responses;
DROP POLICY IF EXISTS platform_feedback_responses_user_select ON platform_feedback_responses;
DROP POLICY IF EXISTS platform_feedback_responses_user_insert ON platform_feedback_responses;

DROP POLICY IF EXISTS platform_feedback_prompt_state_system_owner_all ON platform_feedback_prompt_state;
DROP POLICY IF EXISTS platform_feedback_prompt_state_user_select ON platform_feedback_prompt_state;
DROP POLICY IF EXISTS platform_feedback_prompt_state_user_insert ON platform_feedback_prompt_state;
DROP POLICY IF EXISTS platform_feedback_prompt_state_user_update ON platform_feedback_prompt_state;

CREATE POLICY platform_feedback_responses_system_owner_all
  ON platform_feedback_responses
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY platform_feedback_responses_user_select
  ON platform_feedback_responses
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY platform_feedback_responses_user_insert
  ON platform_feedback_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY platform_feedback_prompt_state_system_owner_all
  ON platform_feedback_prompt_state
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY platform_feedback_prompt_state_user_select
  ON platform_feedback_prompt_state
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY platform_feedback_prompt_state_user_insert
  ON platform_feedback_prompt_state
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY platform_feedback_prompt_state_user_update
  ON platform_feedback_prompt_state
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

GRANT SELECT, INSERT ON platform_feedback_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON platform_feedback_prompt_state TO authenticated;
