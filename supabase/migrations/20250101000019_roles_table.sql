-- Migration: Create Roles Table and Update Workspace Members
-- Description: Creates dynamic roles table and links workspace_members to it

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default system roles
INSERT INTO roles (slug, name, description, is_system_role) VALUES
('owner', 'Dono', 'Acesso total ao workspace', TRUE),
('admin', 'Administrador', 'Gestão de usuários e configurações', TRUE),
('leader', 'Líder', 'Gestão de times e visualização de relatórios', TRUE),
('closer', 'Closer', 'Vendedor focado em fechamento', TRUE),
('sdr', 'SDR', 'Pré-vendedor focado em qualificação', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 3. Update workspace_members table
-- First, drop the existing check constraint
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;

-- Add foreign key constraint
-- Note: We assume all existing roles in workspace_members are valid slugs in the new roles table.
-- If there are invalid roles, this might fail. But since we had a check constraint before, they should be valid.
ALTER TABLE workspace_members 
ADD CONSTRAINT fk_workspace_members_role 
FOREIGN KEY (role) REFERENCES roles(slug)
ON UPDATE CASCADE;

-- 4. Enable RLS on roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view roles
CREATE POLICY "Roles visíveis para todos autenticados"
ON roles FOR SELECT
TO authenticated
USING (true);

-- Policy: Only system_owner can manage roles
CREATE POLICY "Apenas system_owner pode gerenciar roles"
ON roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    AND u.is_super_admin = TRUE
  )
);
