-- Fix infinite recursion in workspace_members UPDATE/DELETE RLS policies
-- Root cause: the manage policies queried workspace_members directly, which
-- triggers RLS evaluation on the same relation again.

CREATE OR REPLACE FUNCTION public.can_manage_workspace_members(
  user_uuid UUID,
  target_workspace_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = target_workspace_id
        AND (u.id = user_uuid OR u.supabase_user_id = user_uuid::text)
        AND wm.access_level IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM users u
      WHERE (u.id = user_uuid OR u.supabase_user_id = user_uuid::text)
        AND u.is_super_admin = true
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_workspace_members(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_workspace_members(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS workspace_members_update_manage_policy ON workspace_members;
CREATE POLICY workspace_members_update_manage_policy ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_workspace_members(auth.uid(), workspace_members.workspace_id))
  WITH CHECK (public.can_manage_workspace_members(auth.uid(), workspace_members.workspace_id));

DROP POLICY IF EXISTS workspace_members_delete_manage_policy ON workspace_members;
CREATE POLICY workspace_members_delete_manage_policy ON workspace_members
  FOR DELETE
  TO authenticated
  USING (public.can_manage_workspace_members(auth.uid(), workspace_members.workspace_id));
