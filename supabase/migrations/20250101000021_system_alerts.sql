-- Migration: Create System Alerts Table
-- Description: Stores global system alerts to be displayed to users

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  target_role TEXT DEFAULT 'all', -- 'all' or specific role slug
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view active alerts within date range
CREATE POLICY "Active system alerts are visible to authenticated users"
ON system_alerts FOR SELECT
TO authenticated
USING (
  is_active = TRUE 
  AND NOW() >= start_date 
  AND NOW() <= end_date
);

-- Policy: System owner can manage all alerts
CREATE POLICY "System owner can manage system alerts"
ON system_alerts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    AND u.is_super_admin = TRUE
  )
);
