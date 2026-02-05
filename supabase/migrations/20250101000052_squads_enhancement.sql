-- Migration: Create squads as a separate structure from teams
-- Description: Squads are user groupings with hierarchy and visual positioning

-- =============================================
-- CREATE SQUADS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES users(id),
  parent_squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squads_workspace ON squads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_squads_leader ON squads(leader_id);
CREATE INDEX IF NOT EXISTS idx_squads_parent ON squads(parent_squad_id);

-- =============================================
-- CREATE SQUAD MEMBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS squads_select_owner ON squads;
DROP POLICY IF EXISTS squads_select_leader ON squads;
DROP POLICY IF EXISTS squads_select_member ON squads;
DROP POLICY IF EXISTS squads_insert ON squads;
DROP POLICY IF EXISTS squads_update ON squads;
DROP POLICY IF EXISTS squads_delete ON squads;

-- Owners can see all squads in their workspace
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

-- Leaders can see their squad and child squads
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

-- Members can see their squads
CREATE POLICY squads_select_member ON squads
FOR SELECT USING (
  id IN (
    SELECT sm.squad_id
    FROM squad_members sm
    JOIN users u ON sm.user_id = u.id
    WHERE u.supabase_user_id = auth.uid()::text
  )
);

-- Only owners/admins can create squads
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

-- Owners/admins and leaders can update their squads
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

-- Only owners/admins can delete squads
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

-- Squad members policies
DROP POLICY IF EXISTS squad_members_select ON squad_members;
DROP POLICY IF EXISTS squad_members_insert ON squad_members;
DROP POLICY IF EXISTS squad_members_delete ON squad_members;

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
