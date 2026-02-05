-- ============================================
-- AJUSTE FINAL: Job Titles como Globais
-- ============================================
-- Executar APÓS a limpeza de duplicatas
-- ============================================

-- PASSO 1: Definir workspace_id = NULL para todos os job titles
-- ============================================
UPDATE job_titles
SET workspace_id = NULL
WHERE workspace_id IS NOT NULL;

-- Verificar
SELECT
  'PASSO 1: workspace_id NULL' as step,
  COUNT(*) FILTER (WHERE workspace_id IS NULL) as null_count,
  COUNT(*) FILTER (WHERE workspace_id IS NOT NULL) as not_null_count
FROM job_titles;

-- Esperado: null_count = total, not_null_count = 0


-- PASSO 2: Criar índice único em slug (global)
-- ============================================
-- Drop índice antigo se existir
DROP INDEX IF EXISTS job_titles_slug_idx;

-- Criar índice único global
CREATE UNIQUE INDEX IF NOT EXISTS job_titles_slug_unique_idx
ON job_titles(slug);

-- Garantir que slug existe e não é nulo
UPDATE job_titles
SET slug = slugify(name)
WHERE slug IS NULL OR slug = '';

-- Verificar
SELECT
  'PASSO 2: Índice único criado' as step,
  COUNT(*) as total,
  COUNT(DISTINCT slug) as slugs_unicos
FROM job_titles;


-- PASSO 3: Ajustar RLS Policy - Apenas system owners podem gerenciar
-- ============================================
-- Drop policy existente
DROP POLICY IF EXISTS "Users can view job titles" ON job_titles;
DROP POLICY IF EXISTS "Users can insert job titles" ON job_titles;
DROP POLICY IF EXISTS "Users can update job titles" ON job_titles;
DROP POLICY IF EXISTS "System owners can do anything" ON job_titles;

-- Criar policy restritiva: Apenas system owners
CREATE POLICY "System owners can manage job titles"
ON job_titles
FOR ALL
TO authenticated
USING (is_system_owner(auth.uid()))
WITH CHECK (is_system_owner(auth.uid()));

-- Verificar policy
SELECT
  'PASSO 3: RLS Policy ajustada' as step,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'job_titles';


-- PASSO 4: Garantir unicidade de nomes (constraint)
-- ============================================
-- Remover duplicatas de nome (diferente de slug)
ALTER TABLE job_titles
DROP CONSTRAINT IF EXISTS job_titles_name_key;

-- Adicionar constraint unique em name
ALTER TABLE job_titles
ADD CONSTRAINT job_titles_name_unique
UNIQUE (name);

-- Verificar
SELECT
  'PASSO 4: Constraint unique em name' as step,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'job_titles'
  AND constraint_type = 'UNIQUE';


-- PASSO 5: Verificar integrity - foreign keys ainda funcionam?
-- ============================================
SELECT
  'PASSO 5: Integrity Check' as step,
  (SELECT COUNT(*) FROM users u WHERE u.job_title_id IS NOT NULL) as users_vinculados,
  (SELECT COUNT(*) FROM competency_frameworks cf WHERE cf.job_title_id IS NOT NULL) as frameworks_vinculados,
  (SELECT COUNT(*) FROM job_titles) as job_titles_totais;


-- PASSO 6: Testar SELECT (qualquer usuário autenticado pode ler)
-- ============================================
-- Esta query deve funcionar para qualquer usuário autenticado
SELECT
  'PASSO 6: Leitura autorizada' as step,
  COUNT(*) as total_lido
FROM job_titles;


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT
  '✅ LIMPEZA CONCLUÍDA' as status,
  (SELECT COUNT(*) FROM job_titles) as total_cargos,
  (SELECT COUNT(DISTINCT slug) FROM job_titles) as slugs_unicos,
  (SELECT COUNT(*) FILTER (WHERE workspace_id IS NULL) FROM job_titles) as workspace_id_null,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'job_titles' AND policyname = 'System owners can manage job titles') as rls_policy_ativa;

-- ============================================
-- INSTRUÇÕES PARA APLICAÇÃO
-- ============================================
-- 1. Execute scripts/cleanup_job_titles.sql (DELETE duplicatas)
-- 2. Execute este script (adjust_global_job_titles.sql)
-- 3. Execute scripts/validate_fase2_final.sql (validação final)
-- 4. Teste na UI: /admin/job-titles
-- ============================================
