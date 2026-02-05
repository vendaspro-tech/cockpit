-- Create job_titles table
CREATE TABLE job_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- Add job_title_id to workspace_members
ALTER TABLE workspace_members 
ADD COLUMN job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_job_titles_workspace ON job_titles(workspace_id);
CREATE INDEX idx_workspace_members_job_title ON workspace_members(job_title_id);

-- Insert default job titles for existing workspaces
-- This is a bit complex in SQL only without a specific workspace_id, 
-- so we might need to handle seeding in the application or a separate script.
-- However, we can try to insert for all workspaces if needed, or just leave it empty.
-- Let's create a function to seed default titles for a workspace
CREATE OR REPLACE FUNCTION seed_default_job_titles(target_workspace_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO job_titles (workspace_id, name)
  VALUES 
    (target_workspace_id, 'Closer'),
    (target_workspace_id, 'Líder Comercial'),
    (target_workspace_id, 'BDR'),
    (target_workspace_id, 'SDR'),
    (target_workspace_id, 'Social Seller')
  ON CONFLICT (workspace_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically seed job titles when a workspace is created
CREATE OR REPLACE FUNCTION trigger_seed_job_titles()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_job_titles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_job_titles();

-- Backfill for existing workspaces
DO $$
DECLARE
  w RECORD;
BEGIN
  FOR w IN SELECT id FROM workspaces LOOP
    PERFORM seed_default_job_titles(w.id);
  END LOOP;
END $$;
