-- ============================================
-- VALIDAÇÃO FASE 2 - SCRIPT FINAL CORRIGIDO
-- ============================================
-- Execute no Supabase Dashboard SQL Editor
-- Todas as queries foram testadas e estão funcionando
-- ============================================

-- 1. Verificar Job Titles por Nível Hierárquico
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

-- ✅ Esperado: 4 níveis (0-3), 10+ cargos no total


-- 2. Verificar Detalhes do Job Title SDR
-- ============================================
SELECT
  name,
  slug,
  hierarchy_level,
  LEFT(mission, 80) as mission_preview,
  sector,
  allows_seniority,
  jsonb_array_length(kpis) as kpis_count,
  jsonb_array_length(main_activities) as activities_count
FROM job_titles
WHERE slug = 'sdr'
LIMIT 1;

-- ✅ Esperado: slug='sdr', level=3, kpis_count>0, activities_count>0


-- 3. Verificar Competency Frameworks Templates
-- ============================================
SELECT
  fw.name,
  CASE fw.is_template WHEN true THEN 'Template Global' ELSE 'Workspace' END as type,
  fw.version,
  fw.is_active,
  jt.name as job_title,
  ROUND((fw.weights->>'behavioral')::numeric * 100) as beh_percent,
  ROUND((fw.weights->>'technical_def')::numeric * 100) as tech_percent,
  ROUND((fw.weights->>'process')::numeric * 100) as proc_percent,
  jsonb_array_length(fw.behavioral_competencies) as beh_comp_count,
  jsonb_array_length(fw.technical_def_competencies) as tech_comp_count
FROM competency_frameworks fw
LEFT JOIN job_titles jt ON fw.job_title_id = jt.id
WHERE fw.is_template = true
ORDER BY fw.created_at;

-- ✅ Esperado: 2+ templates (SDR, Closer), pesos 50/30/20


-- 4. Verificar Test Structures (resumido por tipo)
-- ============================================
SELECT
  test_type,
  MAX(version) as latest_version,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count,
  COUNT(*) as total_versions,
  MAX(structure->'metadata'->>'name') as test_name,
  MAX(jsonb_array_length(structure->'categories')) as categories_count
FROM test_structures
GROUP BY test_type
ORDER BY test_type;

-- ✅ Esperado: 6 tipos, DISC com 3 versões, 1 ativa por tipo


-- 5. Verificar Estrutura DISC v3
-- ============================================
SELECT
  test_type,
  version,
  is_active,
  structure->'metadata'->>'name' as test_name,
  jsonb_array_length(structure->'categories') as total_categories,
  (
    SELECT SUM(jsonb_array_length(cat->'questions'))
    FROM jsonb_array_elements(structure->'categories') cat
  ) as total_questions,
  structure->'scoring'->'scale'->>'min' as scale_min,
  structure->'scoring'->'scale'->>'max' as scale_max
FROM test_structures
WHERE test_type = 'disc'
  AND version = 3
  AND is_active = true;

-- ✅ Esperado: 24 categorias, 24 questões, escala 1-4, is_active=true


-- 6. Total de Registros (Fase 2)
-- ============================================
SELECT 'job_titles' as table_name, COUNT(*) as count FROM job_titles
UNION ALL
SELECT 'competency_frameworks', COUNT(*) FROM competency_frameworks
UNION ALL
SELECT 'test_structures', COUNT(*) FROM test_structures
UNION ALL
SELECT 'seniority_assessments', COUNT(*) FROM seniority_assessments
ORDER BY table_name;

-- ✅ Esperado: job_titles>0, competency_frameworks>0, test_structures>0, seniority_assessments=0


-- 7. Verificar Estrutura de um Framework
-- ============================================
SELECT
  name,
  is_template,
  jsonb_array_length(behavioral_competencies) as beh_count,
  jsonb_array_length(technical_def_competencies) as tech_count,
  jsonb_array_length(process_competencies) as proc_count,
  behavioral_competencies->0->>'name' as first_beh_comp,
  scoring_ranges->'behavioral'->>'junior' as junior_beh_range
FROM competency_frameworks
WHERE is_template = true
LIMIT 1;

-- ✅ Esperado: beh_count>0, first_beh_comp preenchido, ranges configurados


-- 8. Verificar integrity: Job Titles sem frameworks
-- ============================================
SELECT
  jt.name,
  jt.slug,
  COALESCE(u.user_count, 0) as users_count,
  COALESCE(fw.framework_count, 0) as frameworks_count
FROM job_titles jt
LEFT JOIN (
  SELECT job_title_id, COUNT(*) as user_count
  FROM users
  WHERE job_title_id IS NOT NULL
  GROUP BY job_title_id
) u ON u.job_title_id = jt.id
LEFT JOIN (
  SELECT job_title_id, COUNT(*) as framework_count
  FROM competency_frameworks
  GROUP BY job_title_id
) fw ON fw.job_title_id = jt.id
ORDER BY users_count DESC, frameworks_count DESC
LIMIT 10;

-- ✅ Esperado: job_titles com 0+ users, 0-1 frameworks


-- ============================================
-- FIM DA VALIDAÇÃO
-- ============================================
-- Se todas as queries retornaram resultados esperados,
-- a Fase 2 está VALIDADA no banco de dados! ✅
-- ============================================
