-- Calendar taxonomy and multi-plan support

-- Link table for events that apply to multiple plans
CREATE TABLE IF NOT EXISTS event_plans (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, plan_id)
);

-- Backfill existing events into event_plans using current plan_id
INSERT INTO event_plans (event_id, plan_id)
SELECT id, plan_id FROM events
WHERE plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM event_plans ep
    WHERE ep.event_id = events.id
    AND ep.plan_id = events.plan_id
  );

CREATE INDEX IF NOT EXISTS idx_event_plans_plan_id ON event_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_event_plans_event_id ON event_plans(event_id);

-- Event categories
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some basic categories if table is empty
INSERT INTO event_categories (name, color)
SELECT * FROM (VALUES
  ('Treinamento', '#3b82f6'),
  ('Onboarding', '#22c55e'),
  ('Office Hours', '#eab308'),
  ('Webinar', '#a855f7'),
  ('Reunião interna', '#f97316'),
  ('Sucesso do Cliente', '#06b6d4'),
  ('Outro', '#9ca3af')
) AS seed(name, color)
WHERE NOT EXISTS (SELECT 1 FROM event_categories);

-- Event instructors registry
CREATE TABLE IF NOT EXISTS event_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

