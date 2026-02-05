-- Add status to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned'));

-- Add status and cancelled_at to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
