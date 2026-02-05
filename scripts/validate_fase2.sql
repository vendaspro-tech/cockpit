-- ============================================
-- VALIDAÇÃO FASE 2: Admin & Job Titles
-- ============================================
-- Execute este script no Supabase Dashboard SQL Editor
-- ou via psql com sua connection string do Supabase
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

-- Esperado:
-- Nível 0: 0-1 cargos (ex: CEO, Diretor)
-- Nível 1: 1-3 cargos (ex: Gerente, Coordenador)
-- Nível 2: 3-6 cargos (ex: Supervisor, Líder)
-- Nível 3: 6-10 cargos (ex: SDR, Closer, SDR Pleno)


-- 2. Verificar Detalhes de um Job Title (SDR)
-- ============================================
SELECT
  name,
  slug,
  hierarchy_level,
  mission,
  sector,
  allows_seniority,
  jsonb_array_length(kpis) as kpis_count,
  jsonb_array_length(main_activities) as activities_count
FROM job_titles
WHERE slug = 'sdr' OR name ILIKE '%sdr%'
LIMIT 1;


-- 3. Verificar Competency Frameworks
-- ============================================
SELECT
  fw.id,
  fw.name,
  CASE fw.is_template WHEN true THEN 'Global Template' ELSE 'Workspace-Specific' END as type,
  fw.version,
  fw.is_active,
  jt.name as job_title,
  ROUND((fw.weights->>'behavioral')::numeric * 100) as beh_weight,
  ROUND((fw.weights->>'technical_def')::numeric * 100) as tech_weight,
  ROUND((fw.weights->>'process')::numeric * 100) as proc_weight,
  ROUND(((fw.weights->>'behavioral')::numeric +
        (fw.weights->>'technical_def')::numeric +
        (fw.weights->>'process')::numeric) * 100) as total_weight
FROM competency_frameworks fw
LEFT JOIN job_titles jt ON fw.job_title_id = jt.id
ORDER BY fw.created_at DESC
LIMIT 10;

-- Esperado:
-- 2+ frameworks templates (SDR, Closer)
-- Pesos somam 100


-- 4. Verificar Competências de um Framework
-- ============================================
SELECT
  name,
  is_template,
  jsonb_array_length(behavioral_competencies) as beh_count,
  jsonb_array_length(technical_def_competencies) as tech_count,
  jsonb_array_length(process_competencies) as proc_count,
  behavioral_competencies->0->>'name' as first_beh_competency,
  scoring_ranges->'behavioral'->>'junior' as junior_beh_range
FROM competency_frameworks
WHERE is_template = true
LIMIT 1;

-- Esperado:
-- behavioral_competencies: array não vazio
-- technical_def_competencies: array pode ser vazio
-- process_competencies: array pode ser vazio


-- 5. Verificar Test Structures
-- ============================================
SELECT
  test_type,
  version,
  is_active,
  jsonb_array_length(structure->'categories') as categories_count,
  structure->'metadata'->>'name' as test_name,
  structure->'scoring'->>'method' as scoring_method,
  updated_at
FROM test_structures
ORDER BY test_type, version DESC
LIMIT 15;

-- Esperado:
-- disc: 3 versões (v3 ativa)
-- seniority_seller: 1 versão
-- seniority_leader: 1 versão
-- def_method: 1 versão
-- values_8d: 1 versão
-- leadership_style: 1 versão


-- 6. Total de Registros por Tabela
-- ============================================
SELECT 'job_titles' as table_name, COUNT(*) as count FROM job_titles
UNION ALL
SELECT 'competency_frameworks', COUNT(*) FROM competency_frameworks
UNION ALL
SELECT 'test_structures', COUNT(*) FROM test_structures
UNION ALL
SELECT 'seniority_assessments', COUNT(*) FROM seniority_assessments
UNION ALL
SELECT 'def_call_evaluations', COUNT(*) FROM def_call_evaluations
UNION ALL
SELECT 'pdi_plans', COUNT(*) FROM pdi_plans;

-- Esperado:
-- job_titles: 10+ (pelo menos 1 por hierarchy_level)
-- competency_frameworks: 2+ (SDR e Closer)
-- test_structures: 6+ (1 por test_type, mais versões)
-- seniority_assessments: 0 (Fase 3 ainda não implementada)
-- def_evaluations: 0+ (pode ter avaliações)
-- pdi_plans: 0+ (pode ter PDIs)


-- 7. Verificar Estrutura DISC v3 (Detalhado)
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
  structure->'categories'->0->>'name' as first_category,
  structure->'scoring'->'scale'->>'min' as scale_min,
  structure->'scoring'->'scale'->>'max' as scale_max
FROM test_structures
WHERE test_type = 'disc'
  AND version = 3
  AND is_active = true;

-- Esperado para DISC v3:
-- total_categories: 24 (questões situacionais)
-- total_questions: 24 (cada categoria tem 1 matrix com 4 statements)
-- scale_min: 1
-- scale_max: 4


-- 8. Verificar integrity das Relações
-- ============================================
-- Job Titles sem users vinculados (pode ser deletado)
SELECT
  jt.id,
  jt.name,
  jt.slug,
  COALESCE(u.count, 0) as users_count,
  COALESCE(fw.count, 0) as frameworks_count
FROM job_titles jt
LEFT JOIN (
  SELECT job_title_id, COUNT(*) as count
  FROM users
  WHERE job_title_id IS NOT NULL
  GROUP BY job_title_id
) u ON u.job_title_id = jt.id
LEFT JOIN (
  SELECT job_title_id, COUNT(*) as count
  FROM competency_frameworks
  GROUP BY job_title_id
) fw ON fw.job_title_id = jt.id
ORDER BY users_count DESC, frameworks_count DESC;


-- 9. Verificar RLS Policies (System Owner)
-- ============================================
-- Esta query retorna as policies aplicadas nas tabelas da Fase 2
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('job_titles', 'competency_frameworks', 'test_structures')
ORDER BY tablename, policyname;

-- Esperado:
-- Policies para "System owners can do anything" ou similar
-- Roles: authenticated
-- Cmd: ALL ou INSERT, SELECT, UPDATE, DELETE


-- 10. Verificar Migrações Aplicadas
-- ============================================
SELECT name, version
FROM schema_migrations
WHERE name LIKE '%enrich_job_titles%'
   OR name LIKE '%competency_system%'
   OR name LIKE '%pdi_and_def%'
   OR name LIKE '%test_structures%'
ORDER BY version;

-- Esperado:
-- 20250101000100_enrich_job_titles
-- 20250101000101_competency_system
-- 20250101000102_pdi_and_def
-- 20250101000105_test_structures_versioning


-- 11. Verificar Seeding (Job Titles)
-- ============================================
SELECT
  name,
  slug,
  hierarchy_level,
  sector,
  allows_seniority,
  remuneration->'junior'->>'fixed' as junior_fixed,
  jsonb_array_length(kpis) as kpis_count
FROM job_titles
WHERE slug IN ('sdr', 'closer', 'sdr-pleno', 'closer-senior')
ORDER BY hierarchy_level, name;

-- Esperado: 4 job titles com dados completos


-- 12. Verificar Seeding (Competency Frameworks)
-- ============================================
SELECT
  fw.name,
  fw.is_template,
  jt.name as job_title,
  jsonb_array_length(fw.behavioral_competencies) as beh_count,
  jsonb_array_length(fw.technical_def_competencies) as tech_count,
  fw.version
FROM competency_frameworks fw
LEFT JOIN job_titles jt ON fw.job_title_id = jt.id
WHERE fw.is_template = true
ORDER BY fw.created_at;

-- Esperado: 2 templates (SDR e Closer)


-- ============================================
-- FIM DA VALIDAÇÃO
-- ============================================
-- Se todas as queries retornaram resultados esperados,
-- a Fase 2 está validada no banco de dados!
-- ============================================
