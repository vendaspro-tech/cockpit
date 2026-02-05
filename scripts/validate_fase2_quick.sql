-- ============================================
-- VALIDAÇÃO FASE 2 - VERSÃO SIMPLIFICADA
-- ============================================
-- Execute as queries abaixo em sequência no Supabase Dashboard
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


-- 4. Verificar Test Structures (versões ativas)
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


-- 5. Verificar Estrutura DISC v3 (Detalhada)
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
  (structure->'categories'->0->'questions'->0->>'text') as first_question_preview
FROM test_structures
WHERE test_type = 'disc'
ORDER BY version DESC
LIMIT 1;


-- 6. Total de Registros por Tabela Principal
-- ============================================
SELECT 'job_titles' as table_name, COUNT(*) as count FROM job_titles
UNION ALL
SELECT 'competency_frameworks', COUNT(*) FROM competency_frameworks
UNION ALL
SELECT 'test_structures', COUNT(*) FROM test_structures
UNION ALL
SELECT 'seniority_assessments', COUNT(*) FROM seniority_assessments
ORDER BY table_name;


-- ============================================
-- FIM DA VALIDAÇÃO
-- ============================================
-- Resultados esperados:
-- 1. Job Titles: 4 níveis (0-3), com 10+ cargos
-- 2. SDR: slug='sdr', hierarchy_level=3, kpis_count>0
-- 3. Frameworks: 2 templates (SDR, Closer), pesos 50/30/20
-- 4. Test Structures: 6 tipos, DISC tem 3 versões
-- 5. DISC v3: 24 categorias, 24 questões, is_active=true
-- 6. Totais: job_titles>0, competency_frameworks>0, test_structures>0
-- ============================================
