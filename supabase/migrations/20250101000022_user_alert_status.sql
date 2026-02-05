-- Create User Alert Status Table
CREATE TABLE IF NOT EXISTS user_alert_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES system_alerts(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, alert_id)
);

-- Enable RLS
ALTER TABLE user_alert_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and manage their own status
CREATE POLICY "Users can manage their own alert status"
ON user_alert_status
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
);
