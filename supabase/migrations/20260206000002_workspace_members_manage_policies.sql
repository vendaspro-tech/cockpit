-- Allow owners/admins (and system owners) to update/delete workspace members
CREATE POLICY workspace_members_update_manage_policy ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.access_level IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM users u
      WHERE (u.id = auth.uid() OR u.supabase_user_id = auth.uid())
        AND u.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.access_level IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM users u
      WHERE (u.id = auth.uid() OR u.supabase_user_id = auth.uid())
        AND u.is_super_admin = true
    )
  );

CREATE POLICY workspace_members_delete_manage_policy ON workspace_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.access_level IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM users u
      WHERE (u.id = auth.uid() OR u.supabase_user_id = auth.uid())
        AND u.is_super_admin = true
    )
  );
