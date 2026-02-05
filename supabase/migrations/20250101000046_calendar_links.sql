-- Link events to categories and instructors

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES event_categories(id),
  ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES event_instructors(id);

-- Keep legacy category text for now; future cleanup can migrate into category_id

