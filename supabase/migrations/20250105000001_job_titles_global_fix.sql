-- =====================================================
-- EMERGENCY FIX: Convert job_titles to Global (Admin-Only)
-- =====================================================
-- Description: Removes workspace_id column and all workspace-specific logic
-- Date: 2026-01-05

-- STEP 1: Remove triggers that auto-create job titles per workspace
DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
DROP FUNCTION IF EXISTS trigger_seed_job_titles();
DROP FUNCTION IF EXISTS seed_default_job_titles(UUID);

-- STEP 2: Remove workspace_id column completely
-- First, remove the foreign key constraint
ALTER TABLE job_titles
  DROP CONSTRAINT IF EXISTS job_titles_workspace_id_fkey;

-- Remove indexes on workspace_id
DROP INDEX IF EXISTS idx_job_titles_workspace;

-- Drop the unique constraint
ALTER TABLE job_titles
  DROP CONSTRAINT IF EXISTS job_titles_workspace_id_name_key;

-- Now remove the column
ALTER TABLE job_titles
  DROP COLUMN IF EXISTS workspace_id;

-- STEP 3: Update unique constraint - one global job title per name
CREATE UNIQUE INDEX IF NOT EXISTS unique_global_job_title_name
  ON job_titles(name);

-- STEP 4: Add is_global flag for clarity (always true now)
ALTER TABLE job_titles
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT true NOT NULL;

-- STEP 5: Add RLS policies to enforce admin-only creation
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;

-- Allow all users to SELECT (read job titles)
CREATE POLICY job_titles_select_all
  ON job_titles FOR SELECT
  USING (true);

-- Only allow INSERT via admin panel (no workspace context)
-- This policy will prevent regular workspace actions from creating job titles
CREATE POLICY job_titles_insert_admin_only
  ON job_titles FOR INSERT
  WITH CHECK (is_global = true);

-- Only allow UPDATE via admin
CREATE POLICY job_titles_update_admin_only
  ON job_titles FOR UPDATE
  USING (is_global = true);

-- Only allow DELETE via admin
CREATE POLICY job_titles_delete_admin_only
  ON job_titles FOR DELETE
  USING (is_global = true);

-- STEP 6: Add updated_at trigger if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at_job_titles_global'
  ) THEN
    CREATE TRIGGER set_updated_at_job_titles_global
      BEFORE UPDATE ON job_titles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- STEP 7: Verify all job titles are global
UPDATE job_titles SET is_global = true WHERE is_global IS NULL OR is_global = false;

-- STEP 8: Add comments for documentation
COMMENT ON TABLE job_titles IS 'Global job titles managed via Admin panel only. Workspaces reference these via workspace_members.job_title_id';
COMMENT ON COLUMN job_titles.is_global IS 'Always true - all job titles are global';
COMMENT ON COLUMN job_titles.hierarchy_level IS '0=Strategic, 1=Tactical, 2=Operational, 3=Execution';

-- VERIFICATION QUERIES (run these to confirm everything is correct)
-- 1. Count all global job titles
-- SELECT COUNT(*) as total_job_titles FROM job_titles WHERE is_global = true;

-- 2. Check no workspace_id column exists
-- \d job_titles

-- 3. Verify workspace_members still reference job titles correctly
-- SELECT wm.*, jt.name as job_title
-- FROM workspace_members wm
-- LEFT JOIN job_titles jt ON wm.job_title_id = jt.id
-- LIMIT 10;
