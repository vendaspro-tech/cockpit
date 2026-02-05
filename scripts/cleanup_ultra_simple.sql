-- ============================================
-- LIMPEZA DE DUPLICATAS - VERSÃO ULTRA SIMPLES
-- ============================================
-- Execute cada query em ordem
-- ============================================

-- QUERY 1: Verificar situação atual
-- ============================================
SELECT
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as slugs_unicos
FROM job_titles;

-- Esperado: total_registros > slugs_unicos (ex: 80 total, 10 únicos)


-- QUERY 2: DELETE (versão simplificada)
-- ============================================
DELETE FROM job_titles
WHERE id IN (
  SELECT jt1.id
  FROM job_titles jt1
  INNER JOIN job_titles jt2 ON jt1.slug = jt2.slug
  WHERE jt1.id::text > jt2.id::text
);


-- QUERY 3: Verificar resultado
-- ============================================
SELECT
  COUNT(*) as total_apos,
  COUNT(DISTINCT slug) as slugs_unicos_apos
FROM job_titles;

-- Esperado: total_apos = slugs_unicos_apos (SUCESSO!)


-- QUERY 4: Validar estrutura final
-- ============================================
SELECT
  hierarchy_level,
  CASE hierarchy_level
    WHEN 0 THEN 'Estratégico'
    WHEN 1 THEN 'Tático'
    WHEN 2 THEN 'Operacional'
    WHEN 3 THEN 'Execução'
  END as nivel,
  COUNT(*) as total,
  array_agg(name ORDER BY name) as cargos
FROM job_titles
GROUP BY hierarchy_level
ORDER BY hierarchy_level;

-- Esperado: 4 níveis, 10-15 cargos únicos, sem duplicatas


-- ============================================
-- FIM
-- ============================================
