-- Migration: Remove parent_squad_id from squads table
-- Description: Squads no longer need hierarchy, making them flat structures

-- Drop the RLS policy that depends on parent_squad_id
DROP POLICY IF EXISTS squads_select_leader ON squads;

-- Drop the foreign key constraint
ALTER TABLE squads DROP CONSTRAINT IF EXISTS squads_parent_squad_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_squads_parent;

-- Drop the column
ALTER TABLE squads DROP COLUMN IF EXISTS parent_squad_id;

-- Recreate the squads_select_leader policy without parent_squad_id reference
CREATE POLICY squads_select_leader ON squads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = squads.leader_id
    AND u.supabase_user_id = auth.uid()::text
  )
);
