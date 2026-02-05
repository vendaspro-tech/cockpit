-- Migration: Refactor Access Levels and Profiles
-- Description: Separates Access Level (Owner/Admin/Member) from Functional Profile (Role)

-- 1. Add access_level column to workspace_members
ALTER TABLE workspace_members 
ADD COLUMN access_level TEXT CHECK (access_level IN ('owner', 'admin', 'member'));

-- 2. Migrate data based on existing roles
UPDATE workspace_members 
SET access_level = CASE 
  WHEN role = 'owner' THEN 'owner'
  WHEN role IN ('admin', 'leader') THEN 'admin'
  ELSE 'member'
END;

-- 3. Make access_level NOT NULL after population
ALTER TABLE workspace_members 
ALTER COLUMN access_level SET NOT NULL;

-- 4. Handle the 'role' column (which is now 'profile')
-- We want to keep 'role' as the column name for the FK to roles table, but it represents the Profile.
-- We need to clear 'owner', 'admin', 'leader' from this column as they are no longer profiles.
-- But first, we need to make the column nullable because Owners/Admins might not have a specific functional profile.

ALTER TABLE workspace_members 
ALTER COLUMN role DROP NOT NULL;

UPDATE workspace_members 
SET role = NULL 
WHERE role IN ('owner', 'admin', 'leader');

-- 5. Clean up roles table
-- Remove the access level roles from the roles table
DELETE FROM roles 
WHERE slug IN ('owner', 'admin', 'leader');

-- 6. Add index for access_level
CREATE INDEX idx_workspace_members_access_level ON workspace_members(access_level);
