-- Migration: Add role column to workspace_invitations
-- Description: Stores the intended role for the invited user

-- Ensure 'member' role exists as a fallback
INSERT INTO roles (slug, name, description, is_system_role) VALUES
('member', 'Membro', 'Colaborador sem função específica definida', TRUE)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE workspace_invitations
ADD COLUMN role TEXT REFERENCES roles(slug) DEFAULT 'member';

-- Update existing invitations
UPDATE workspace_invitations SET role = 'member' WHERE role IS NULL;
