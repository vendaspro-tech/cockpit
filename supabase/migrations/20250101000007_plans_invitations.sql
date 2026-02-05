-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  max_users INTEGER,
  max_products INTEGER,
  features JSONB DEFAULT '{}',
  price_monthly DECIMAL(10, 2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add plan_id to workspaces
ALTER TABLE workspaces 
ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Create workspace_invitations table (tracks Clerk invitations)
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES users(id),
  clerk_invitation_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email, status)
);

-- Create indexes
CREATE INDEX idx_plans_active ON plans(active);
CREATE INDEX idx_workspaces_plan ON workspaces(plan_id);
CREATE INDEX idx_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_invitations_status ON workspace_invitations(status);

-- Insert default plans
INSERT INTO plans (name, max_users, max_products, features, price_monthly, active)
VALUES 
  (
    'Starter',
    5,
    10,
    '{"assessments": true, "pdi": true, "def_matrix": false, "custom_reports": false}',
    0.00,
    true
  ),
  (
    'Professional',
    20,
    50,
    '{"assessments": true, "pdi": true, "def_matrix": true, "custom_reports": true, "api_access": false}',
    99.00,
    true
  ),
  (
    'Enterprise',
    NULL,
    NULL,
    '{"assessments": true, "pdi": true, "def_matrix": true, "custom_reports": true, "api_access": true, "white_label": true}',
    499.00,
    true
  );

-- Assign Starter plan to existing workspaces
UPDATE workspaces 
SET plan_id = (SELECT id FROM plans WHERE name = 'Starter' LIMIT 1)
WHERE plan_id IS NULL;
