-- =====================================================
-- Ensure Access Level Roles Exist
-- =====================================================
-- Description: Guarantees the 3 system access levels exist
-- Date: 2026-01-09
-- Fixes: Migration 20260108000003 only ensured 'member' existed

-- Insert all 3 system roles (owner, admin, member)
INSERT INTO roles (slug, name, description, is_system_role) VALUES
('owner', 'Proprietário', 'Proprietário do workspace com acesso total', TRUE),
('admin', 'Administrador', 'Administrador com permissões de gerenciamento', TRUE),
('member', 'Membro', 'Membro colaborador do workspace', TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role;

-- Verify: Should have exactly 3 roles
-- SELECT slug, name, description FROM roles ORDER BY slug;
-- Expected:
--  slug   |     name      |                description
-- --------+---------------+-------------------------------------------
--  admin  | Administrador | Administrador com permissões de gerenciamento
--  member | Membro        | Membro colaborador do workspace
--  owner  | Proprietário  | Proprietário do workspace com acesso total
