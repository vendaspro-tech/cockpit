-- Fix RLS policies for strategic_cycles
-- The issue is that the user_workspaces function might not be returning the workspace

-- Drop existing policies
DROP POLICY IF EXISTS strategic_cycles_select_policy ON strategic_cycles;
DROP POLICY IF EXISTS strategic_cycles_insert_policy ON strategic_cycles;
DROP POLICY IF EXISTS strategic_cycles_update_policy ON strategic_cycles;
DROP POLICY IF EXISTS strategic_cycles_delete_policy ON strategic_cycles;

-- Recreate with simpler, more permissive policies based on workspace_members
-- SELECT: User must be a member of the workspace
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

-- INSERT: User must be a member of the workspace
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

-- UPDATE: User must be a member of the workspace
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

-- DELETE: Only owner/admin can delete
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
