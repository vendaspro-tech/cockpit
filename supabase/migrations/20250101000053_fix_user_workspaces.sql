-- Align user_workspaces() with supabase_user_id mapping
-- Ensure pgcrypto is available for gen_random_uuid usage
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.user_workspaces(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT wm.workspace_id
  FROM workspace_members wm
  JOIN users u ON wm.user_id = u.id
  WHERE u.supabase_user_id = user_uuid::text
     OR u.id = user_uuid
$$;

-- Recreate strategic_cycles policies with supabase_user_id mapping
DROP POLICY IF EXISTS strategic_cycles_select_policy ON strategic_cycles;
DROP POLICY IF EXISTS strategic_cycles_insert_policy ON strategic_cycles;
DROP POLICY IF EXISTS strategic_cycles_update_policy ON strategic_cycles;
DROP POLICY IF EXISTS strategic_cycles_delete_policy ON strategic_cycles;

CREATE POLICY strategic_cycles_select_policy ON strategic_cycles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = strategic_cycles.workspace_id
      AND u.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY strategic_cycles_insert_policy ON strategic_cycles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = strategic_cycles.workspace_id
      AND u.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY strategic_cycles_update_policy ON strategic_cycles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = strategic_cycles.workspace_id
      AND u.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY strategic_cycles_delete_policy ON strategic_cycles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = strategic_cycles.workspace_id
      AND u.supabase_user_id = auth.uid()::text
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Clean up legacy team policies and recreate squads policies with casts
DROP POLICY IF EXISTS teams_select_policy ON squads;
DROP POLICY IF EXISTS teams_insert_policy ON squads;
DROP POLICY IF EXISTS team_members_select_policy ON squad_members;

DROP POLICY IF EXISTS squads_select_owner ON squads;
DROP POLICY IF EXISTS squads_select_leader ON squads;
DROP POLICY IF EXISTS squads_select_member ON squads;
DROP POLICY IF EXISTS squads_insert ON squads;
DROP POLICY IF EXISTS squads_update ON squads;
DROP POLICY IF EXISTS squads_delete ON squads;

DROP POLICY IF EXISTS squad_members_select ON squad_members;
DROP POLICY IF EXISTS squad_members_insert ON squad_members;
DROP POLICY IF EXISTS squad_members_delete ON squad_members;

CREATE POLICY squads_select_owner ON squads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = squads.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND wm.role = 'owner'
  )
);

CREATE POLICY squads_select_leader ON squads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = squads.leader_id
    AND u.supabase_user_id = auth.uid()::text
  )
  OR parent_squad_id IN (
    SELECT s2.id FROM squads s2
    JOIN users u ON s2.leader_id = u.id
    WHERE u.supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY squads_select_member ON squads
FOR SELECT USING (
  id IN (
    SELECT sm.squad_id
    FROM squad_members sm
    JOIN users u ON sm.user_id = u.id
    WHERE u.supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY squads_insert ON squads
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = squads.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY squads_update ON squads
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = squads.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND wm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = squads.leader_id
    AND u.supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY squads_delete ON squads
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = squads.workspace_id
    AND u.supabase_user_id = auth.uid()::text
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY squad_members_select ON squad_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM squads s
    JOIN workspace_members wm ON s.workspace_id = wm.workspace_id
    JOIN users u ON wm.user_id = u.id
    WHERE s.id = squad_members.squad_id
    AND u.supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY squad_members_insert ON squad_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM squads s
    JOIN workspace_members wm ON s.workspace_id = wm.workspace_id
    JOIN users u ON wm.user_id = u.id
    WHERE s.id = squad_members.squad_id
    AND u.supabase_user_id = auth.uid()::text
    AND wm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM squads s
    JOIN users u ON s.leader_id = u.id
    WHERE s.id = squad_members.squad_id
    AND u.supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY squad_members_delete ON squad_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM squads s
    JOIN workspace_members wm ON s.workspace_id = wm.workspace_id
    JOIN users u ON wm.user_id = u.id
    WHERE s.id = squad_members.squad_id
    AND u.supabase_user_id = auth.uid()::text
    AND wm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM squads s
    JOIN users u ON s.leader_id = u.id
    WHERE s.id = squad_members.squad_id
    AND u.supabase_user_id = auth.uid()::text
  )
);
