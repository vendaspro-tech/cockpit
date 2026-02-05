-- Add UPDATE policy for workspaces
CREATE POLICY "Enable update for workspace owners and admins" ON workspaces
FOR UPDATE
TO authenticated
USING (
  -- User must be a member of the workspace
  id IN (SELECT public.user_workspaces(auth.uid()))
  AND (
    -- And have owner or admin role
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND workspace_id = workspaces.id
      AND role IN ('owner', 'admin')
    )
    -- OR be a super admin
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_super_admin = true
    )
  )
)
WITH CHECK (
  -- Same conditions for check
  id IN (SELECT public.user_workspaces(auth.uid()))
  AND (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND workspace_id = workspaces.id
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_super_admin = true
    )
  )
);

-- Also update SELECT policy to explicitly include super admins if they are not members (optional but good practice)
-- For now, we assume super admins are added as members or we rely on the existing policy which requires membership.
-- If super admins need access without membership, we would need to update the SELECT policy too.
