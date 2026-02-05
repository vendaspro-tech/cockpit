-- Migration: Fix squads RLS policies to allow proper editing
-- Description: Add WITH CHECK clause to UPDATE policy and ensure proper permissions

-- Drop existing update policy
DROP POLICY IF EXISTS squads_update ON squads;

-- Recreate update policy with both USING and WITH CHECK clauses
-- This allows owners/admins and leaders to update their squads
CREATE POLICY squads_update ON squads
FOR UPDATE
USING (
  -- User can see the squad (using existing SELECT policies logic)
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
)
WITH CHECK (
  -- User can save the updated squad (checking the new values)
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
