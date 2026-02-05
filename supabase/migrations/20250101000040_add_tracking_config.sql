-- Ensure system_settings exists and has tracking_config

CREATE TABLE IF NOT EXISTS system_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  ai_config JSONB DEFAULT '{}'::jsonb,
  tracking_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT system_settings_singleton CHECK (id)
);

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS tracking_config JSONB DEFAULT '{}'::jsonb;

INSERT INTO system_settings (id, ai_config, tracking_config)
VALUES (TRUE, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS safe to re-run
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Allow read access to authenticated users'
      AND schemaname = 'public'
      AND tablename = 'system_settings'
  ) THEN
    CREATE POLICY "Allow read access to authenticated users"
      ON system_settings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;
