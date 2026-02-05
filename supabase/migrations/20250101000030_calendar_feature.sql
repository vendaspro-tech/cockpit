-- Add color column to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
  target_profiles text[] DEFAULT '{}',
  created_by text NOT NULL, -- Storing Clerk User ID as text
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create google_calendar_integrations table
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
  user_id text PRIMARY KEY, -- Clerk User ID
  access_token text NOT NULL,
  refresh_token text,
  expires_at bigint,
  sync_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_plan_id ON events(plan_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
