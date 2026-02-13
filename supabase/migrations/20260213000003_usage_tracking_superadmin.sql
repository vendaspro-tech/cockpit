-- Migration: 20260213000003_usage_tracking_superadmin.sql
-- Purpose: semantic usage tracking for superadmin dashboard (workspace adoption + core funnels)

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('assessments', 'agents', 'pdi')),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_day DATE GENERATED ALWAYS AS ((occurred_at AT TIME ZONE 'UTC')::date) STORED,
  CONSTRAINT usage_events_event_name_check CHECK (
    event_name IN (
      'assessment_started',
      'assessment_completed',
      'agent_conversation_started',
      'agent_message_sent',
      'pdi_created',
      'pdi_completed'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_usage_events_workspace_occurred
  ON usage_events(workspace_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_event_occurred
  ON usage_events(event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_actor_occurred
  ON usage_events(actor_user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_workspace_day_event
  ON usage_events(workspace_id, event_day, event_name);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_events_system_owner_select ON usage_events;
CREATE POLICY usage_events_system_owner_select
  ON usage_events
  FOR SELECT
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

-- Intentionally no INSERT/UPDATE/DELETE policy for authenticated users.
-- Events are written by DB triggers/functions and by service role contexts only.

GRANT SELECT ON usage_events TO authenticated;

CREATE OR REPLACE FUNCTION log_usage_event(
  p_workspace_id UUID,
  p_actor_user_id UUID,
  p_event_name TEXT,
  p_module TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_workspace_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO usage_events (
    workspace_id,
    actor_user_id,
    event_name,
    module,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    p_workspace_id,
    p_actor_user_id,
    p_event_name,
    p_module,
    p_entity_type,
    p_entity_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION handle_usage_assessments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_usage_event(
      NEW.workspace_id,
      COALESCE(NEW.evaluator_user_id, NEW.evaluated_user_id),
      'assessment_started',
      'assessments',
      'assessment',
      NEW.id,
      jsonb_build_object('test_type', NEW.test_type, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') <> 'completed' AND NEW.status = 'completed' THEN
    PERFORM log_usage_event(
      NEW.workspace_id,
      COALESCE(NEW.evaluator_user_id, NEW.evaluated_user_id),
      'assessment_completed',
      'assessments',
      'assessment',
      NEW.id,
      jsonb_build_object('test_type', NEW.test_type)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usage_assessments ON assessments;
CREATE TRIGGER trg_usage_assessments
AFTER INSERT OR UPDATE ON assessments
FOR EACH ROW
EXECUTE FUNCTION handle_usage_assessments();

CREATE OR REPLACE FUNCTION handle_usage_ai_conversations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_usage_event(
    NEW.workspace_id,
    NEW.user_id,
    'agent_conversation_started',
    'agents',
    'ai_conversation',
    NEW.id,
    jsonb_build_object('agent_id', NEW.agent_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usage_ai_conversations ON ai_conversations;
CREATE TRIGGER trg_usage_ai_conversations
AFTER INSERT ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION handle_usage_ai_conversations();

CREATE OR REPLACE FUNCTION handle_usage_ai_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
  v_agent_id UUID;
BEGIN
  IF NEW.sender <> 'user' THEN
    RETURN NEW;
  END IF;

  SELECT c.workspace_id, c.user_id, c.agent_id
  INTO v_workspace_id, v_user_id, v_agent_id
  FROM ai_conversations c
  WHERE c.id = NEW.conversation_id
  LIMIT 1;

  PERFORM log_usage_event(
    v_workspace_id,
    v_user_id,
    'agent_message_sent',
    'agents',
    'ai_message',
    NEW.id,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'agent_id', v_agent_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usage_ai_messages ON ai_messages;
CREATE TRIGGER trg_usage_ai_messages
AFTER INSERT ON ai_messages
FOR EACH ROW
EXECUTE FUNCTION handle_usage_ai_messages();

CREATE OR REPLACE FUNCTION handle_usage_pdi_plans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_usage_event(
      NEW.workspace_id,
      NEW.user_id,
      'pdi_created',
      'pdi',
      'pdi_plan',
      NEW.id,
      jsonb_build_object('source_assessment_id', NEW.source_assessment_id)
    );
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') <> 'completed' AND NEW.status = 'completed' THEN
    PERFORM log_usage_event(
      NEW.workspace_id,
      NEW.user_id,
      'pdi_completed',
      'pdi',
      'pdi_plan',
      NEW.id,
      jsonb_build_object('source_assessment_id', NEW.source_assessment_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usage_pdi_plans ON pdi_plans;
CREATE TRIGGER trg_usage_pdi_plans
AFTER INSERT OR UPDATE ON pdi_plans
FOR EACH ROW
EXECUTE FUNCTION handle_usage_pdi_plans();

CREATE OR REPLACE FUNCTION admin_usage_workspace_summary(
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  p_workspace_id UUID DEFAULT NULL,
  p_plan TEXT DEFAULT NULL
)
RETURNS TABLE (
  workspace_id UUID,
  workspace_name TEXT,
  plan TEXT,
  members_count BIGINT,
  active_core_users BIGINT,
  activation_rate NUMERIC,
  assessments_started BIGINT,
  assessments_completed BIGINT,
  assessments_completion_rate NUMERIC,
  agent_conversations_started BIGINT,
  agent_messages_sent BIGINT,
  agent_active_users BIGINT,
  pdis_created BIGINT,
  pdis_completed BIGINT,
  last_core_activity_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  WITH filtered_workspaces AS (
    SELECT w.id, w.name, w.plan
    FROM workspaces w
    WHERE (p_workspace_id IS NULL OR w.id = p_workspace_id)
      AND (p_plan IS NULL OR LOWER(w.plan) = LOWER(p_plan))
  ),
  member_counts AS (
    SELECT wm.workspace_id, COUNT(*)::BIGINT AS members_count
    FROM workspace_members wm
    GROUP BY wm.workspace_id
  ),
  event_slice AS (
    SELECT ue.*
    FROM usage_events ue
    JOIN filtered_workspaces fw ON fw.id = ue.workspace_id
    WHERE ue.occurred_at >= date_from
      AND ue.occurred_at < date_to
  ),
  agg AS (
    SELECT
      es.workspace_id,
      COUNT(*) FILTER (WHERE es.event_name = 'assessment_started')::BIGINT AS assessments_started,
      COUNT(*) FILTER (WHERE es.event_name = 'assessment_completed')::BIGINT AS assessments_completed,
      COUNT(*) FILTER (WHERE es.event_name = 'agent_conversation_started')::BIGINT AS agent_conversations_started,
      COUNT(*) FILTER (WHERE es.event_name = 'agent_message_sent')::BIGINT AS agent_messages_sent,
      COUNT(*) FILTER (WHERE es.event_name = 'pdi_created')::BIGINT AS pdis_created,
      COUNT(*) FILTER (WHERE es.event_name = 'pdi_completed')::BIGINT AS pdis_completed,
      COUNT(DISTINCT es.actor_user_id) FILTER (
        WHERE es.event_name IN (
          'assessment_started',
          'assessment_completed',
          'agent_conversation_started',
          'agent_message_sent',
          'pdi_created',
          'pdi_completed'
        )
      )::BIGINT AS active_core_users,
      COUNT(DISTINCT es.actor_user_id) FILTER (
        WHERE es.event_name IN ('agent_conversation_started', 'agent_message_sent')
      )::BIGINT AS agent_active_users,
      MAX(es.occurred_at) AS last_core_activity_at
    FROM event_slice es
    GROUP BY es.workspace_id
  )
  SELECT
    fw.id AS workspace_id,
    fw.name AS workspace_name,
    fw.plan,
    COALESCE(mc.members_count, 0) AS members_count,
    COALESCE(a.active_core_users, 0) AS active_core_users,
    CASE
      WHEN COALESCE(mc.members_count, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(a.active_core_users, 0)::NUMERIC / mc.members_count::NUMERIC), 4)
    END AS activation_rate,
    COALESCE(a.assessments_started, 0) AS assessments_started,
    COALESCE(a.assessments_completed, 0) AS assessments_completed,
    CASE
      WHEN COALESCE(a.assessments_started, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(a.assessments_completed, 0)::NUMERIC / a.assessments_started::NUMERIC), 4)
    END AS assessments_completion_rate,
    COALESCE(a.agent_conversations_started, 0) AS agent_conversations_started,
    COALESCE(a.agent_messages_sent, 0) AS agent_messages_sent,
    COALESCE(a.agent_active_users, 0) AS agent_active_users,
    COALESCE(a.pdis_created, 0) AS pdis_created,
    COALESCE(a.pdis_completed, 0) AS pdis_completed,
    a.last_core_activity_at
  FROM filtered_workspaces fw
  LEFT JOIN member_counts mc ON mc.workspace_id = fw.id
  LEFT JOIN agg a ON a.workspace_id = fw.id
  ORDER BY COALESCE(a.active_core_users, 0) DESC, a.last_core_activity_at DESC NULLS LAST, fw.name ASC;
$$;

CREATE OR REPLACE FUNCTION admin_usage_workspace_user_top(
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  core_actions BIGINT,
  assessments_actions BIGINT,
  agent_actions BIGINT,
  pdi_actions BIGINT
)
LANGUAGE sql
AS $$
  WITH event_slice AS (
    SELECT ue.*
    FROM usage_events ue
    WHERE ue.workspace_id = p_workspace_id
      AND ue.occurred_at >= date_from
      AND ue.occurred_at < date_to
      AND ue.actor_user_id IS NOT NULL
  ),
  agg AS (
    SELECT
      es.actor_user_id AS user_id,
      COUNT(*) FILTER (
        WHERE es.event_name IN (
          'assessment_started',
          'assessment_completed',
          'agent_conversation_started',
          'agent_message_sent',
          'pdi_created',
          'pdi_completed'
        )
      )::BIGINT AS core_actions,
      COUNT(*) FILTER (
        WHERE es.event_name IN ('assessment_started', 'assessment_completed')
      )::BIGINT AS assessments_actions,
      COUNT(*) FILTER (
        WHERE es.event_name IN ('agent_conversation_started', 'agent_message_sent')
      )::BIGINT AS agent_actions,
      COUNT(*) FILTER (
        WHERE es.event_name IN ('pdi_created', 'pdi_completed')
      )::BIGINT AS pdi_actions
    FROM event_slice es
    GROUP BY es.actor_user_id
  )
  SELECT
    a.user_id,
    u.full_name,
    u.email,
    a.core_actions,
    a.assessments_actions,
    a.agent_actions,
    a.pdi_actions
  FROM agg a
  JOIN users u ON u.id = a.user_id
  ORDER BY a.core_actions DESC, a.agent_actions DESC, a.assessments_actions DESC, a.pdi_actions DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
$$;

GRANT EXECUTE ON FUNCTION admin_usage_workspace_summary(TIMESTAMPTZ, TIMESTAMPTZ, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_usage_workspace_user_top(TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER) TO authenticated;

-- Backfill (90d) to avoid empty dashboards after deploy.

INSERT INTO usage_events (workspace_id, actor_user_id, event_name, module, entity_type, entity_id, occurred_at, metadata)
SELECT
  a.workspace_id,
  COALESCE(a.evaluator_user_id, a.evaluated_user_id),
  'assessment_started',
  'assessments',
  'assessment',
  a.id,
  COALESCE(a.started_at, NOW()),
  jsonb_build_object('backfill', true, 'test_type', a.test_type)
FROM assessments a
WHERE COALESCE(a.started_at, NOW()) >= NOW() - INTERVAL '90 days'
  AND NOT EXISTS (
    SELECT 1
    FROM usage_events ue
    WHERE ue.event_name = 'assessment_started'
      AND ue.entity_id = a.id
  );

INSERT INTO usage_events (workspace_id, actor_user_id, event_name, module, entity_type, entity_id, occurred_at, metadata)
SELECT
  a.workspace_id,
  COALESCE(a.evaluator_user_id, a.evaluated_user_id),
  'assessment_completed',
  'assessments',
  'assessment',
  a.id,
  COALESCE(a.completed_at, NOW()),
  jsonb_build_object('backfill', true, 'test_type', a.test_type)
FROM assessments a
WHERE a.status = 'completed'
  AND a.completed_at IS NOT NULL
  AND a.completed_at >= NOW() - INTERVAL '90 days'
  AND NOT EXISTS (
    SELECT 1
    FROM usage_events ue
    WHERE ue.event_name = 'assessment_completed'
      AND ue.entity_id = a.id
  );

INSERT INTO usage_events (workspace_id, actor_user_id, event_name, module, entity_type, entity_id, occurred_at, metadata)
SELECT
  c.workspace_id,
  c.user_id,
  'agent_conversation_started',
  'agents',
  'ai_conversation',
  c.id,
  COALESCE(c.created_at, NOW()),
  jsonb_build_object('backfill', true, 'agent_id', c.agent_id)
FROM ai_conversations c
WHERE COALESCE(c.created_at, NOW()) >= NOW() - INTERVAL '90 days'
  AND NOT EXISTS (
    SELECT 1
    FROM usage_events ue
    WHERE ue.event_name = 'agent_conversation_started'
      AND ue.entity_id = c.id
  );

INSERT INTO usage_events (workspace_id, actor_user_id, event_name, module, entity_type, entity_id, occurred_at, metadata)
SELECT
  c.workspace_id,
  c.user_id,
  'agent_message_sent',
  'agents',
  'ai_message',
  m.id,
  COALESCE(m.created_at, NOW()),
  jsonb_build_object('backfill', true, 'conversation_id', m.conversation_id, 'agent_id', c.agent_id)
FROM ai_messages m
JOIN ai_conversations c ON c.id = m.conversation_id
WHERE m.sender = 'user'
  AND COALESCE(m.created_at, NOW()) >= NOW() - INTERVAL '90 days'
  AND NOT EXISTS (
    SELECT 1
    FROM usage_events ue
    WHERE ue.event_name = 'agent_message_sent'
      AND ue.entity_id = m.id
  );

INSERT INTO usage_events (workspace_id, actor_user_id, event_name, module, entity_type, entity_id, occurred_at, metadata)
SELECT
  p.workspace_id,
  p.user_id,
  'pdi_created',
  'pdi',
  'pdi_plan',
  p.id,
  COALESCE(p.created_at, NOW()),
  jsonb_build_object('backfill', true, 'source_assessment_id', p.source_assessment_id)
FROM pdi_plans p
WHERE COALESCE(p.created_at, NOW()) >= NOW() - INTERVAL '90 days'
  AND NOT EXISTS (
    SELECT 1
    FROM usage_events ue
    WHERE ue.event_name = 'pdi_created'
      AND ue.entity_id = p.id
  );

INSERT INTO usage_events (workspace_id, actor_user_id, event_name, module, entity_type, entity_id, occurred_at, metadata)
SELECT
  p.workspace_id,
  p.user_id,
  'pdi_completed',
  'pdi',
  'pdi_plan',
  p.id,
  COALESCE(p.completion_date::timestamptz, p.approved_at, p.created_at, NOW()),
  jsonb_build_object('backfill', true, 'source_assessment_id', p.source_assessment_id)
FROM pdi_plans p
WHERE p.status = 'completed'
  AND COALESCE(p.completion_date::timestamptz, p.approved_at, p.created_at, NOW()) >= NOW() - INTERVAL '90 days'
  AND NOT EXISTS (
    SELECT 1
    FROM usage_events ue
    WHERE ue.event_name = 'pdi_completed'
      AND ue.entity_id = p.id
  );
