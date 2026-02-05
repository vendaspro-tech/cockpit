-- ============================================
-- DIAGNÓSTICO: Cargos e Frameworks
-- ============================================
-- Execute no Supabase SQL Editor

-- QUERY 1: Ver todos os cargos existentes
-- ============================================
SELECT
  id,
  name,
  slug,
  hierarchy_level,
  allows_seniority,
  sector
FROM job_titles
WHERE workspace_id IS NULL
ORDER BY hierarchy_level, name;

-- QUERY 2: Ver frameworks existentes
-- ============================================
SELECT
  fw.id,
  fw.name,
  fw.version,
  fw.is_active,
  fw.is_template,
  jt.name as job_title_name,
  (fw.weights->>'behavioral')::numeric as behavioral_weight,
  (fw.weights->>'technical_def')::numeric as technical_weight,
  (fw.weights->>'process')::numeric as process_weight,
  jsonb_array_length(fw.behavioral_competencies) as behavioral_count,
  jsonb_array_length(fw.technical_def_competencies) as technical_count,
  jsonb_array_length(fw.process_competencies) as process_count
FROM competency_frameworks fw
LEFT JOIN job_titles jt ON fw.job_title_id = jt.id
WHERE fw.is_template = true
ORDER BY fw.created_at;

-- QUERY 3: Identificar quais cargos com senioridade estão SEM framework
-- ============================================
SELECT
  jt.id,
  jt.name,
  jt.slug,
  jt.hierarchy_level,
  jt.allows_seniority,
  fw.id as framework_id,
  CASE WHEN fw.id IS NULL THEN 'SEM FRAMEWORK' ELSE 'COM FRAMEWORK' END as status
FROM job_titles jt
LEFT JOIN competency_frameworks fw
  ON fw.job_title_id = jt.id
  AND fw.is_template = true
  AND fw.is_active = true
WHERE jt.workspace_id IS NULL
  AND jt.allows_seniority = true
ORDER BY jt.hierarchy_level, jt.name;

-- QUERY 4: Ver test structures disponíveis
-- ============================================
SELECT
  test_type,
  COUNT(*) as versions,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_version
FROM test_structures
GROUP BY test_type
ORDER BY test_type;
