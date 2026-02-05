-- Migration: 20250101000103_global_competency_frameworks.sql
-- Transforms competency frameworks from workspace-specific to global templates with propagation

-- 1. Drop the existing constraint
ALTER TABLE competency_frameworks
DROP CONSTRAINT IF EXISTS competency_frameworks_workspace_id_job_title_id_key;

-- 2. Make workspace_id nullable (for global templates)
ALTER TABLE competency_frameworks
ALTER COLUMN workspace_id DROP NOT NULL;

-- 3. Add new fields for template system and versioning
ALTER TABLE competency_frameworks
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_framework_id UUID REFERENCES competency_frameworks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 4. Add conditional unique constraints
-- For templates: only one template per job_title
CREATE UNIQUE INDEX IF NOT EXISTS unique_template_per_job_title
ON competency_frameworks(job_title_id)
WHERE is_template = true AND is_active = true;

-- For workspace frameworks: one per workspace + job_title
CREATE UNIQUE INDEX IF NOT EXISTS unique_workspace_framework
ON competency_frameworks(workspace_id, job_title_id)
WHERE is_template = false AND workspace_id IS NOT NULL;

-- 5. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_competency_frameworks_template ON competency_frameworks(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_competency_frameworks_parent ON competency_frameworks(parent_framework_id) WHERE parent_framework_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_competency_frameworks_version ON competency_frameworks(job_title_id, version, is_template);

-- 6. Add comment documentation
COMMENT ON COLUMN competency_frameworks.is_template IS 'True if this is a global template created in admin, false if workspace-specific';
COMMENT ON COLUMN competency_frameworks.parent_framework_id IS 'References the template this framework was created from (for workspace propagation)';
COMMENT ON COLUMN competency_frameworks.version IS 'Version number for template evolution and tracking';
COMMENT ON COLUMN competency_frameworks.is_active IS 'Only one active template per job_title should exist';
COMMENT ON COLUMN competency_frameworks.workspace_id IS 'NULL for global templates, set for workspace-specific frameworks';

-- 7. Update existing frameworks to be templates (if any exist)
-- This assumes current frameworks should become templates
UPDATE competency_frameworks
SET
  is_template = true,
  is_active = true,
  published_at = NOW()
WHERE workspace_id IS NOT NULL;

-- Then clear workspace_id to make them global
UPDATE competency_frameworks
SET workspace_id = NULL
WHERE is_template = true;
