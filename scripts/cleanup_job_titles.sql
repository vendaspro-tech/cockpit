-- ============================================
-- LIMPEZA: Job Titles Globais
-- ============================================
-- Objetivo: Remover duplicatas, manter apenas 1 cópia global de cada cargo
-- Executar PASSO A PASSO em ordem!
-- ============================================

-- PASSO 1: Backup de segurança (SELECT antes de DELETE)
-- ============================================
SELECT
  'PASSO 1: Backup' as step,
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as cargos_unicos,
  array_agg(DISTINCT workspace_id) as workspaces_encontrados
FROM job_titles;

-- Esperado: total_registros > cargos_unicos (indica duplicatas)


-- PASSO 2: Verificar quais cargos estão em uso (vínculos)
-- ============================================
SELECT
  'PASSO 2: Vínculos' as step,
  (SELECT COUNT(*) FROM users WHERE job_title_id IS NOT NULL) as users_com_cargo,
  (SELECT COUNT(DISTINCT job_title_id) FROM competency_frameworks) as frameworks_com_cargo,
  (SELECT COUNT(*) FROM seniority_assessments) as seniority_assessments;


-- PASSO 3: Identificar duplicatas por slug
-- ============================================
SELECT
  'PASSO 3: Duplicatas' as step,
  slug,
  name,
  COUNT(*) as copias,
  array_agg(id ORDER BY id) as ids,
  array_agg(workspace_id ORDER BY workspace_id) as workspace_ids
FROM job_titles
GROUP BY slug, name
HAVING COUNT(*) > 1
ORDER BY copias DESC
LIMIT 10;


-- PASSO 4: Verificar workspace_id = NULL vs com workspace
-- ============================================
SELECT
  'PASSO 4: Workspace Analysis' as step,
  CASE
    WHEN workspace_id IS NULL THEN 'NULL (Global)'
    ELSE 'Com Workspace'
  END as tipo,
  COUNT(*) as total
FROM job_titles
GROUP BY tipo;


-- PASSO 5: Manter apenas a PRIMEIRA cópia de cada slug (MIN(id))
-- ============================================
-- ANTES DE EXECUTAR: Verificar o resultado do SELECT abaixo

-- SELECT para PREVIEW do que será deletado:
SELECT
  'PASSO 5: PREVIEW - O que será DELETADO' as step,
  jt.id as deletar_id,
  jt.slug,
  jt.name,
  jt.workspace_id,
  MIN(jt2.id) as manter_id
FROM job_titles jt
INNER JOIN job_titles jt2 ON jt.slug = jt2.slug AND jt.id::text > jt2.id::text
GROUP BY jt.id, jt.slug, jt.name, jt.workspace_id
LIMIT 20;


-- PASSO 6: EXECUTAR LIMPEZA (DELETE seguro)
-- ============================================
-- Descomente APÓS verificar o PASSO 5

-- DELETE FROM job_titles
-- WHERE id IN (
--   SELECT jt.id
--   FROM job_titles jt
--   INNER JOIN job_titles jt2 ON jt.slug = jt2.slug AND jt.id::text > jt2.id::text
--   WHERE jt2.id = (
--     SELECT MIN(jt3.id)
--     FROM job_titles jt3
--     WHERE jt3.slug = jt.slug
--   )
-- );

-- Resultado esperado: Mantém apenas 1 registro por slug (o menor id)


-- PASSO 7: Verificar resultado após limpeza
-- ============================================
SELECT
  'PASSO 7: Após Limpeza' as step,
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as cargos_unicos
FROM job_titles;

-- Esperado: total_registros = cargos_unicos (sem duplicatas)


-- PASSO 8: Verificar estrutura final
-- ============================================
SELECT
  hierarchy_level,
  CASE hierarchy_level
    WHEN 0 THEN 'Estratégico (C-Level)'
    WHEN 1 THEN 'Tático (Coordenação)'
    WHEN 2 THEN 'Operacional (Supervisão)'
    WHEN 3 THEN 'Execução (Vendas)'
  END as level_name,
  COUNT(*) as total,
  array_agg(name ORDER BY name) as job_titles
FROM job_titles
GROUP BY hierarchy_level
ORDER BY hierarchy_level;

-- Esperado: 4 níveis, 10 cargos únicos totais


-- ============================================
-- FIM DA LIMPEZA
-- ============================================
-- Após executar PASSO 6, vá para o script:
-- scripts/adjust_global_job_titles.sql
-- ============================================
