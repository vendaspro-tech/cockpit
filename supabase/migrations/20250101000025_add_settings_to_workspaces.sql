-- Add settings jsonb column to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create index for faster jsonb queries if needed (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_workspaces_settings ON workspaces USING gin (settings);
