-- Migration: 20260113000005_catalog_rls.sql
-- Purpose: align global catalog RLS with constitution rules (T010)

-- JOB TITLES -----------------------------------------------------------------
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_titles_select_all ON job_titles;
DROP POLICY IF EXISTS job_titles_insert_admin_only ON job_titles;
DROP POLICY IF EXISTS job_titles_update_admin_only ON job_titles;
DROP POLICY IF EXISTS job_titles_delete_admin_only ON job_titles;
DROP POLICY IF EXISTS "System owners can manage job titles" ON job_titles;

CREATE POLICY job_titles_select_authenticated
  ON job_titles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY job_titles_super_admin_write
  ON job_titles
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()))
  WITH CHECK (is_system_owner(auth.uid()));

COMMENT ON POLICY job_titles_select_authenticated ON job_titles IS 'Any authenticated user can read the global job title catalog.';
COMMENT ON POLICY job_titles_super_admin_write ON job_titles IS 'Only super admins (system owners) can create/update/delete job titles.';

-- COMPETENCY FRAMEWORKS -------------------------------------------------------
ALTER TABLE competency_frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System owners full access on competency_frameworks" ON competency_frameworks;
DROP POLICY IF EXISTS "Users can view competency frameworks in workspace" ON competency_frameworks;
DROP POLICY IF EXISTS "Leaders can manage competency frameworks" ON competency_frameworks;

CREATE POLICY competency_frameworks_select_visible
  ON competency_frameworks
  FOR SELECT
  TO authenticated
  USING (
    -- Global templates (workspace_id NULL) are visible to everyone
    workspace_id IS NULL
    OR
    -- Workspace-specific frameworks remain visible to members of that workspace
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY competency_frameworks_super_admin_write
  ON competency_frameworks
  FOR ALL
  TO authenticated
  USING (is_system_owner(auth.uid()))
  WITH CHECK (is_system_owner(auth.uid()));

COMMENT ON POLICY competency_frameworks_select_visible ON competency_frameworks IS 'Authenticated users can read templates and any workspace framework they belong to.';
COMMENT ON POLICY competency_frameworks_super_admin_write ON competency_frameworks IS 'Global competency catalog writes restricted to super admins.';
