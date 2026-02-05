-- Migration: 20260113000001_job_titles_hierarchy_checks.sql
-- Purpose: enforce hierarchy guardrails for global job titles per spec T006

-- Ensure hierarchy_level cannot be NULL and stays within 0-3 (Strategic -> Execution)
UPDATE job_titles
SET hierarchy_level = 3
WHERE hierarchy_level IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_titles_hierarchy_level_check'
  ) THEN
    ALTER TABLE job_titles
      ADD CONSTRAINT job_titles_hierarchy_level_check
      CHECK (hierarchy_level BETWEEN 0 AND 3);
  END IF;
END $$;

ALTER TABLE job_titles
  ALTER COLUMN hierarchy_level SET DEFAULT 3,
  ALTER COLUMN hierarchy_level SET NOT NULL;

-- Slug safety: drop legacy per-workspace constraint remnants if they still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'job_titles_workspace_id_slug_key'
  ) THEN
    ALTER TABLE job_titles
      DROP CONSTRAINT job_titles_workspace_id_slug_key;
  END IF;
END $$;

-- Slug must be unique globally (when provided) and non-empty
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_titles_slug_unique
  ON job_titles(slug)
  WHERE slug IS NOT NULL;

ALTER TABLE job_titles
  DROP CONSTRAINT IF EXISTS job_titles_slug_not_empty,
  ADD CONSTRAINT job_titles_slug_not_empty
    CHECK (slug IS NULL OR length(trim(slug)) > 0);

-- Recreate hierarchy index (no-op if it already exists) for policy performance
CREATE INDEX IF NOT EXISTS idx_job_titles_hierarchy_level
  ON job_titles(hierarchy_level);

COMMENT ON CONSTRAINT job_titles_hierarchy_level_check IS 'Validates hierarchy_level range (0 Strategic … 3 Execution).';
COMMENT ON CONSTRAINT job_titles_slug_not_empty IS 'Prevents blank slugs on global job titles.';
