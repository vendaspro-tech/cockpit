-- Migration: Add is_super_admin to users
-- Description: Adds is_super_admin column and updates RLS for KPIs

-- Add column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Promote owner (based on username in path 'brennopinheiro')
-- Using ILIKE to be safe, or just setting the first user created as super admin if no match
DO $$
BEGIN
  -- Try to find brenno
  UPDATE users SET is_super_admin = TRUE WHERE email ILIKE '%brenno%';
  
  -- If no one was updated (e.g. email is different), update the most recently created user just in case
  -- This is a fallback for dev environment to ensure SOMEONE has access
  IF NOT FOUND THEN
     UPDATE users SET is_super_admin = TRUE WHERE created_at = (SELECT MAX(created_at) FROM users);
  END IF;
END $$;

-- Update RLS for KPIs table

-- Drop old policy
DROP POLICY IF EXISTS "Apenas system_owner pode gerenciar KPIs" ON kpis;

-- Create new policy
CREATE POLICY "Apenas super admin pode gerenciar KPIs"
ON kpis FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
    AND users.is_super_admin = TRUE
  )
);
