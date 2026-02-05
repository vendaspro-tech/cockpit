-- Update policies to use supabase_user_id and drop legacy clerk_user_id

-- KPIs policy
DROP POLICY IF EXISTS "Apenas super admin pode gerenciar KPIs" ON kpis;
CREATE POLICY "Apenas super admin pode gerenciar KPIs"
ON kpis FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.supabase_user_id = auth.jwt() ->> 'sub'
    AND users.is_super_admin = TRUE
  )
);

-- Roles policy
DROP POLICY IF EXISTS "Apenas system_owner pode gerenciar roles" ON roles;
CREATE POLICY "Apenas system_owner pode gerenciar roles"
ON roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.supabase_user_id = auth.jwt() ->> 'sub'
    AND u.is_super_admin = TRUE
  )
);

-- System alerts policy
DROP POLICY IF EXISTS "System owner can manage system alerts" ON system_alerts;
CREATE POLICY "System owner can manage system alerts"
ON system_alerts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.supabase_user_id = auth.jwt() ->> 'sub'
    AND u.is_super_admin = TRUE
  )
);

-- User alert status policy
DROP POLICY IF EXISTS "Users can manage their own alert status" ON user_alert_status;
CREATE POLICY "Users can manage their own alert status"
ON user_alert_status
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE supabase_user_id = auth.jwt() ->> 'sub'
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE supabase_user_id = auth.jwt() ->> 'sub'
  )
);

-- Drop legacy column
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_clerk_user_id_key;
ALTER TABLE public.users DROP COLUMN IF EXISTS clerk_user_id;
