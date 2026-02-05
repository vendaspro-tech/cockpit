-- Script de diagnostico para competency frameworks

-- Verificar se ha workspaces
SELECT 'Workspaces:' as check_type, count(*) as total FROM workspaces;

-- Verificar job_titles relevantes
SELECT 'Job Titles:' as check_type, id, name, slug
FROM job_titles
WHERE name ILIKE '%sdr%'
   OR name ILIKE '%closer%'
   OR name ILIKE '%supervisor%'
ORDER BY name;

-- Verificar frameworks criados
SELECT 'Frameworks Created:' as check_type, count(*) as total FROM competency_frameworks;

-- Ver detalhes dos frameworks
SELECT
    id,
    workspace_id,
    job_title_id,
    name,
    weights,
    jsonb_array_length(behavioral_competencies) as behavioral_count,
    jsonb_array_length(technical_def_competencies) as technical_count,
    jsonb_array_length(process_competencies) as process_count,
    scoring_ranges
FROM competency_frameworks
ORDER BY created_at DESC;

-- Ver frameworks com job titles
SELECT
    cf.id,
    cf.name as framework_name,
    jt.name as job_title_name,
    jt.slug,
    jsonb_array_length(cf.behavioral_competencies) as behavioral_count,
    jsonb_array_length(cf.technical_def_competencies) as technical_count,
    jsonb_array_length(cf.process_competencies) as process_count
FROM competency_frameworks cf
LEFT JOIN job_titles jt ON cf.job_title_id = jt.id
ORDER BY cf.created_at DESC;
