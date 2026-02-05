-- Calendar enhancements: metadata, recurrence, templates

-- Extend events with richer fields
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS location_url TEXT,
  ADD COLUMN IF NOT EXISTS instructor_name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'treinamento',
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT DEFAULT 'none' CHECK (recurrence_frequency IN ('none', 'daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS template_id UUID;

-- Templates table to reuse event configurations
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  target_profiles TEXT[] DEFAULT '{}',
  category TEXT,
  instructor_name TEXT,
  location_url TEXT,
  duration_minutes INTEGER,
  recurrence_frequency TEXT DEFAULT 'none' CHECK (recurrence_frequency IN ('none', 'daily', 'weekly', 'monthly')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_templates_plan_id ON event_templates(plan_id);
