-- Create system_settings table for global configuration
CREATE TABLE system_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  ai_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT system_settings_singleton CHECK (id)
);

-- Insert default row
INSERT INTO system_settings (id, ai_config)
VALUES (TRUE, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/edit system settings
-- (Assuming we have a way to check super admin in RLS, or we rely on application logic/service role for now)
-- For now, let's allow authenticated read, but restrict write to service role or super admin if possible.
-- Since we use server actions with isSystemOwner check, we can use service role client there.

CREATE POLICY "Allow read access to authenticated users"
ON system_settings FOR SELECT
TO authenticated
USING (true);

-- No update policy for public/authenticated, updates must happen via admin functions
