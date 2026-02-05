-- ============================================
-- DIAGNÓSTICO: Duplicatas de Job Titles
-- ============================================

-- 1. Verificar quantos workspaces existem
-- ============================================
SELECT COUNT(*) as total_workspaces FROM workspaces;

-- Se retornar 8, explica por que cada cargo aparece 8 vezes


-- 2. Verificar job titles agrupados por workspace
-- ============================================
SELECT
  workspace_id,
  hierarchy_level,
  COUNT(*) as job_titles_count,
  array_agg(DISTINCT name ORDER BY name) as unique_names
FROM job_titles
GROUP BY workspace_id, hierarchy_level
ORDER BY workspace_id, hierarchy_level
LIMIT 20;


-- 3. Verificar duplicatas por slug
-- ============================================
SELECT
  slug,
  name,
  hierarchy_level,
  COUNT(*) as total_copies,
  array_agg(DISTINCT workspace_id ORDER BY workspace_id) as workspace_ids
FROM job_titles
GROUP BY slug, name, hierarchy_level
HAVING COUNT(*) > 1
ORDER BY total_copies DESC
LIMIT 10;


-- 4. Verificar estrutura dos job titles únicos (ignorando workspace)
-- ============================================
SELECT DISTINCT
  slug,
  name,
  hierarchy_level,
  sector,
  allows_seniority
FROM job_titles
ORDER BY hierarchy_level, name
LIMIT 20;


-- ============================================
-- SOLUÇÃO: Manter apenas 1 cópia de cada cargo (workspace_id = NULL)
-- ============================================

-- Opção A: Deletar duplicatas, mantendo apenas workspace_id = NULL (se houver)
-- DELETE FROM job_titles
-- WHERE workspace_id IS NOT NULL
-- AND slug IN (
--   SELECT slug FROM job_titles WHERE workspace_id IS NULL
-- );

-- Opção B: Se não há workspace_id = NULL, escolher um workspace para manter
-- DELETE FROM job_titles
-- WHERE id NOT IN (
--   SELECT MIN(id)
--   FROM job_titles
--   GROUP BY slug, hierarchy_level
-- );
