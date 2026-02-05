-- Migration: 20250101000100_enrich_job_titles.sql

-- Add new columns to job_titles table
ALTER TABLE job_titles
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 3, -- 0=Strategic, 1=Tactical, 2=Operational, 3=Execution
  ADD COLUMN IF NOT EXISTS subordination TEXT, -- Text description of who they report to
  ADD COLUMN IF NOT EXISTS allows_seniority BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'Comercial',
  
  -- Structured Data for Job Description
  ADD COLUMN IF NOT EXISTS remuneration JSONB DEFAULT '{
    "junior": {"fixed": 0, "variable_description": ""},
    "pleno": {"fixed": 0, "variable_description": ""},
    "senior": {"fixed": 0, "variable_description": ""}
  }',
  
  ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{
    "education": "",
    "mandatory_courses": [],
    "key_competencies": []
  }',
  
  ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS main_activities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS common_challenges JSONB DEFAULT '[]',
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_job_titles_hierarchy ON job_titles(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_job_titles_slug ON job_titles(slug);

-- Add constraint for unique slug per workspace
ALTER TABLE job_titles 
  DROP CONSTRAINT IF EXISTS job_titles_workspace_id_slug_key,
  ADD CONSTRAINT job_titles_workspace_id_slug_key UNIQUE (workspace_id, slug);

-- Add triggers for updated_at if they don't exist (assuming handle_updated_at function exists from base migrations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_job_titles') THEN
    CREATE TRIGGER set_updated_at_job_titles
    BEFORE UPDATE ON job_titles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
  END IF;
END
$$;
