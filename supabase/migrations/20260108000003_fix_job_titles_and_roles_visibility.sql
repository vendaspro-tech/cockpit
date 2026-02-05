-- Migration: Clean Roles Table
-- Problema: Tabela roles mistura permissões (owner/admin/member) com cargos (closer/sdr/bdr/cs/social_seller)
-- Solução: Remover TODOS os job titles da tabela roles, manter apenas permission levels

-- Note: Job titles SELECT policy already exists from migration 20250105000001
-- No need to recreate it here

-- ============================================================================
-- CLEAN ROLES TABLE - REMOVE ALL JOB TITLES FROM ROLES
-- ============================================================================

-- Roles should only contain permission levels (owner, admin, member)
-- NOT job titles (closer, sdr, leader, bdr, cs, social_seller, inside_sales, etc.)

-- First, migrate any workspace_members using job title roles to 'member'
UPDATE workspace_members
SET role = 'member'
WHERE role NOT IN ('owner', 'admin', 'member') AND role IS NOT NULL;

-- Now delete ALL job titles from roles table
-- Keep only: owner, admin, member
DELETE FROM roles
WHERE slug NOT IN ('owner', 'admin', 'member');

-- Ensure 'member' role exists
INSERT INTO roles (slug, name, description, is_system_role) VALUES
('member', 'Membro', 'Membro padrão do workspace', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Update roles descriptions for clarity
UPDATE roles
SET description = 'Proprietário do workspace com acesso total'
WHERE slug = 'owner';

UPDATE roles
SET description = 'Administrador com permissões de gerenciamento'
WHERE slug = 'admin';

UPDATE roles
SET description = 'Membro colaborador do workspace'
WHERE slug = 'member';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration:
-- - roles table contains ONLY: owner, admin, member
-- - Job titles (SDR, Closer, BDR, CS, Social Seller, etc.) remain in job_titles table
-- - workspace_members.role contains only permission levels (not job titles)
-- - workspace_members.job_title_id points to job_titles table

-- Expected result:
-- SELECT slug, name FROM roles ORDER BY slug;
--  slug   |      name
-- --------+-----------------
--  admin  | Administrador
--  member | Membro
--  owner  | Proprietário
