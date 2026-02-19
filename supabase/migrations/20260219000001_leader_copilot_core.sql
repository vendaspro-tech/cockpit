-- Migration: 20260219000001_leader_copilot_core.sql
-- Purpose: Leader Copilot feature flag, pending actions, in-app notifications and secure helper functions

CREATE TABLE IF NOT EXISTS workspace_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  leader_copilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id)
);

CREATE TABLE IF NOT EXISTS workspace_user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_pending_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_task', 'update_task', 'send_notification')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'executed')),
  executed_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspace_user_notifications_user_created
  ON workspace_user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_conversation_status_created
  ON ai_pending_actions(conversation_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_features_workspace
  ON workspace_features(workspace_id);

DROP TRIGGER IF EXISTS update_workspace_features_updated_at ON workspace_features;
CREATE TRIGGER update_workspace_features_updated_at
  BEFORE UPDATE ON workspace_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE workspace_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pending_actions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_leader_copilot_enabled(workspace_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT leader_copilot_enabled
    FROM workspace_features
    WHERE workspace_id = workspace_id_param
    LIMIT 1
  ), FALSE);
$$;

CREATE OR REPLACE FUNCTION is_leader_copilot_eligible_user(user_id_param UUID, workspace_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    LEFT JOIN job_titles jt ON jt.id = wm.job_title_id
    WHERE wm.workspace_id = workspace_id_param
      AND wm.user_id = user_id_param
      AND (
        COALESCE(jt.slug, '') IN ('supervisor-comercial', 'coordenador-comercial', 'gerente-comercial')
        OR LOWER(COALESCE(jt.name, '')) IN ('supervisor comercial', 'coordenador comercial', 'gerente comercial')
      )
  );
$$;

CREATE OR REPLACE FUNCTION can_leader_copilot_target_user(
  actor_user_id_param UUID,
  target_user_id_param UUID,
  workspace_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_same_user BOOLEAN;
  is_enabled BOOLEAN;
  is_actor_eligible BOOLEAN;
  is_target_in_workspace BOOLEAN;
  is_target_in_actor_squads BOOLEAN;
  has_hierarchy_access BOOLEAN;
BEGIN
  is_same_user := actor_user_id_param = target_user_id_param;
  is_enabled := is_leader_copilot_enabled(workspace_id_param);

  IF NOT is_enabled THEN
    RETURN FALSE;
  END IF;

  is_actor_eligible := is_leader_copilot_eligible_user(actor_user_id_param, workspace_id_param);

  IF NOT is_actor_eligible THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    WHERE wm.workspace_id = workspace_id_param
      AND wm.user_id = target_user_id_param
  ) INTO is_target_in_workspace;

  IF NOT is_target_in_workspace THEN
    RETURN FALSE;
  END IF;

  IF is_same_user THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM squads s
    JOIN squad_members sm ON sm.squad_id = s.id
    WHERE s.workspace_id = workspace_id_param
      AND s.leader_id = actor_user_id_param
      AND sm.user_id = target_user_id_param
  ) INTO is_target_in_actor_squads;

  IF NOT is_target_in_actor_squads THEN
    RETURN FALSE;
  END IF;

  SELECT can_view_user_in_workspace(actor_user_id_param, target_user_id_param, workspace_id_param)
    INTO has_hierarchy_access;

  RETURN COALESCE(has_hierarchy_access, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION can_insert_leader_copilot_notification(
  workspace_id_param UUID,
  target_user_id_param UUID,
  created_by_user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_user_id UUID;
BEGIN
  SELECT id INTO actor_user_id
  FROM users
  WHERE supabase_user_id = auth.uid()::text
  LIMIT 1;

  IF actor_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF actor_user_id <> created_by_user_id_param THEN
    RETURN FALSE;
  END IF;

  RETURN can_leader_copilot_target_user(actor_user_id, target_user_id_param, workspace_id_param);
END;
$$;

CREATE OR REPLACE FUNCTION leader_copilot_create_task(
  workspace_id_param UUID,
  target_user_id_param UUID,
  title_param TEXT,
  description_param TEXT,
  priority_param TEXT,
  due_date_param TIMESTAMPTZ,
  status_param TEXT DEFAULT 'todo'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_user_id UUID;
  target_auth_user_id UUID;
  inserted_task_id UUID;
BEGIN
  SELECT id INTO actor_user_id
  FROM users
  WHERE supabase_user_id = auth.uid()::text
  LIMIT 1;

  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT can_leader_copilot_target_user(actor_user_id, target_user_id_param, workspace_id_param) THEN
    RAISE EXCEPTION 'Sem permissão para criar tarefa para este usuário';
  END IF;

  SELECT supabase_user_id::UUID INTO target_auth_user_id
  FROM users
  WHERE id = target_user_id_param
  LIMIT 1;

  IF target_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo inválido';
  END IF;

  INSERT INTO tasks (
    workspace_id,
    user_id,
    title,
    description,
    priority,
    due_date,
    status
  ) VALUES (
    workspace_id_param,
    target_auth_user_id,
    title_param,
    description_param,
    priority_param,
    due_date_param,
    COALESCE(status_param, 'todo')
  )
  RETURNING id INTO inserted_task_id;

  RETURN inserted_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION leader_copilot_update_task(
  workspace_id_param UUID,
  target_user_id_param UUID,
  task_id_param UUID,
  title_param TEXT,
  description_param TEXT,
  priority_param TEXT,
  due_date_param TIMESTAMPTZ,
  status_param TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_user_id UUID;
  target_auth_user_id UUID;
  updated_task_id UUID;
BEGIN
  SELECT id INTO actor_user_id
  FROM users
  WHERE supabase_user_id = auth.uid()::text
  LIMIT 1;

  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT can_leader_copilot_target_user(actor_user_id, target_user_id_param, workspace_id_param) THEN
    RAISE EXCEPTION 'Sem permissão para editar tarefa deste usuário';
  END IF;

  SELECT supabase_user_id::UUID INTO target_auth_user_id
  FROM users
  WHERE id = target_user_id_param
  LIMIT 1;

  IF target_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo inválido';
  END IF;

  UPDATE tasks
  SET
    title = COALESCE(title_param, title),
    description = COALESCE(description_param, description),
    priority = COALESCE(priority_param, priority),
    due_date = COALESCE(due_date_param, due_date),
    status = COALESCE(status_param, status),
    updated_at = NOW()
  WHERE id = task_id_param
    AND workspace_id = workspace_id_param
    AND user_id = target_auth_user_id
  RETURNING id INTO updated_task_id;

  IF updated_task_id IS NULL THEN
    RAISE EXCEPTION 'Tarefa não encontrada para este usuário';
  END IF;

  RETURN updated_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION leader_copilot_send_notification(
  workspace_id_param UUID,
  target_user_id_param UUID,
  title_param TEXT,
  message_param TEXT,
  type_param TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_user_id UUID;
  inserted_notification_id UUID;
BEGIN
  SELECT id INTO actor_user_id
  FROM users
  WHERE supabase_user_id = auth.uid()::text
  LIMIT 1;

  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT can_leader_copilot_target_user(actor_user_id, target_user_id_param, workspace_id_param) THEN
    RAISE EXCEPTION 'Sem permissão para notificar este usuário';
  END IF;

  INSERT INTO workspace_user_notifications (
    workspace_id,
    user_id,
    title,
    message,
    type,
    created_by_user_id
  ) VALUES (
    workspace_id_param,
    target_user_id_param,
    title_param,
    message_param,
    COALESCE(type_param, 'info'),
    actor_user_id
  )
  RETURNING id INTO inserted_notification_id;

  RETURN inserted_notification_id;
END;
$$;

DROP POLICY IF EXISTS workspace_features_select_manage_policy ON workspace_features;
DROP POLICY IF EXISTS workspace_features_insert_manage_policy ON workspace_features;
DROP POLICY IF EXISTS workspace_features_update_manage_policy ON workspace_features;

CREATE POLICY workspace_features_select_manage_policy
  ON workspace_features
  FOR SELECT
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_features.workspace_id
        AND u.supabase_user_id = auth.uid()::text
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspace_features_insert_manage_policy
  ON workspace_features
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_features.workspace_id
        AND u.supabase_user_id = auth.uid()::text
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspace_features_update_manage_policy
  ON workspace_features
  FOR UPDATE
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_features.workspace_id
        AND u.supabase_user_id = auth.uid()::text
        AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_features.workspace_id
        AND u.supabase_user_id = auth.uid()::text
        AND wm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS workspace_user_notifications_user_select_policy ON workspace_user_notifications;
DROP POLICY IF EXISTS workspace_user_notifications_user_update_policy ON workspace_user_notifications;
DROP POLICY IF EXISTS workspace_user_notifications_insert_admin_policy ON workspace_user_notifications;
DROP POLICY IF EXISTS workspace_user_notifications_insert_copilot_policy ON workspace_user_notifications;

CREATE POLICY workspace_user_notifications_user_select_policy
  ON workspace_user_notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY workspace_user_notifications_user_update_policy
  ON workspace_user_notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY workspace_user_notifications_insert_admin_policy
  ON workspace_user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_user_notifications.workspace_id
        AND u.supabase_user_id = auth.uid()::text
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspace_user_notifications_insert_copilot_policy
  ON workspace_user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    can_insert_leader_copilot_notification(
      workspace_user_notifications.workspace_id,
      workspace_user_notifications.user_id,
      workspace_user_notifications.created_by_user_id
    )
  );

DROP POLICY IF EXISTS ai_pending_actions_select_actor_policy ON ai_pending_actions;
DROP POLICY IF EXISTS ai_pending_actions_insert_actor_policy ON ai_pending_actions;
DROP POLICY IF EXISTS ai_pending_actions_update_actor_policy ON ai_pending_actions;

CREATE POLICY ai_pending_actions_select_actor_policy
  ON ai_pending_actions
  FOR SELECT
  TO authenticated
  USING (
    actor_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM ai_conversations c
      WHERE c.id = ai_pending_actions.conversation_id
        AND c.user_id = actor_user_id
    )
  );

CREATE POLICY ai_pending_actions_insert_actor_policy
  ON ai_pending_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM ai_conversations c
      WHERE c.id = ai_pending_actions.conversation_id
        AND c.user_id = actor_user_id
        AND c.workspace_id = ai_pending_actions.workspace_id
    )
  );

CREATE POLICY ai_pending_actions_update_actor_policy
  ON ai_pending_actions
  FOR UPDATE
  TO authenticated
  USING (
    actor_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM ai_conversations c
      WHERE c.id = ai_pending_actions.conversation_id
        AND c.user_id = actor_user_id
        AND c.workspace_id = ai_pending_actions.workspace_id
    )
  )
  WITH CHECK (
    actor_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM ai_conversations c
      WHERE c.id = ai_pending_actions.conversation_id
        AND c.user_id = actor_user_id
        AND c.workspace_id = ai_pending_actions.workspace_id
    )
  );

GRANT SELECT, INSERT, UPDATE ON workspace_features TO authenticated;
GRANT SELECT, INSERT, UPDATE ON workspace_user_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_pending_actions TO authenticated;

GRANT EXECUTE ON FUNCTION is_leader_copilot_enabled(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_leader_copilot_eligible_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_leader_copilot_target_user(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_insert_leader_copilot_notification(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION leader_copilot_create_task(UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION leader_copilot_update_task(UUID, UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION leader_copilot_send_notification(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

INSERT INTO ai_agents (
  name,
  description,
  system_prompt,
  model,
  temperature,
  status
)
SELECT
  'Copiloto do Líder',
  'Agente dedicado para líderes com leitura de progresso e propostas de ação.',
  'Agente interno para o fluxo de Copiloto do Líder.',
  'gpt-4o-mini',
  0.2,
  'inactive'
WHERE NOT EXISTS (
  SELECT 1
  FROM ai_agents
  WHERE name = 'Copiloto do Líder'
);
