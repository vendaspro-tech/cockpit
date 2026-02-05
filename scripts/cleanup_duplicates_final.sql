-- ============================================
-- LIMPEZA DE DUPLICATAS - VERSÃO FINAL SIMPLES
-- ============================================
-- Execute cada query EM ORDEM no Supabase Dashboard
-- ============================================

-- QUERY 1: Diagnóstico
-- ============================================
SELECT
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(*) - COUNT(DISTINCT slug) as duplicatas_para_deletar
FROM job_titles;

-- Esperado: total > slugs_unicos (ex: 80 total, 10 únicos)


-- QUERY 2: Verificar quais duplicatas existem
-- ============================================
SELECT
  slug,
  COUNT(*) as copias,
  array_agg(id ORDER BY id) as ids,
  array_agg(workspace_id ORDER BY id) as workspace_ids
FROM job_titles
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY copias DESC
LIMIT 5;

-- Mostra até 5 slugs com duplicatas e seus IDs


-- QUERY 3: DELETE simples - Usando EXISTS
-- ============================================
-- Esta é a forma mais segura com UUID
DELETE FROM job_titles jt1
WHERE EXISTS (
  SELECT 1
  FROM job_titles jt2
  WHERE jt1.slug = jt2.slug
    AND jt1.id::text > jt2.id::text
);

-- Resultado esperado: Deleta 70 registros (mantém 10)


-- QUERY 4: Verificar resultado
-- ============================================
SELECT
  COUNT(*) as total_apos,
  COUNT(DISTINCT slug) as slugs_unicos_apos,
  COUNT(*) FILTER (WHERE workspace_id IS NULL) as workspace_null,
  COUNT(*) FILTER (WHERE workspace_id IS NOT NULL) as workspace_not_null
FROM job_titles;

-- Esperado: total_apos = slugs_unicos_apos (10-15 registros)


-- QUERY 5: Estrutura final (validação)
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

-- Esperado: 4 níveis, 10-15 cargos, sem duplicatas


-- ============================================
-- FIM DA LIMPEZA
-- ============================================
-- Se QUERY 4 mostra: total_apos = slugs_unicos_apos
-- então a limpeza foi SUCESSO! ✅
-- ============================================
