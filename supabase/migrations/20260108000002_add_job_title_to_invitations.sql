-- Migration: Add job_title_id and squad_id to workspace_invitations
-- This allows invitations to specify the job title (cargo) and squad for new members
-- According to PRD Section 2.2: Users must be created with job_title_id and seniority_level=null

-- Add job_title_id column to workspace_invitations
ALTER TABLE workspace_invitations
ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL;

-- Add squad_id column to workspace_invitations (optional)
ALTER TABLE workspace_invitations
ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES squads(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_job_title
  ON workspace_invitations(job_title_id);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_squad
  ON workspace_invitations(squad_id);

-- Add comment
COMMENT ON COLUMN workspace_invitations.job_title_id IS
  'Job title (cargo) that will be assigned to the user when they accept the invitation';

COMMENT ON COLUMN workspace_invitations.squad_id IS
  'Squad that the user will be assigned to when they accept the invitation (optional)';
