-- Script de diagnóstico para Test Structures
-- Execute este script para ver a estrutura atual dos testes

-- 1. Listar todos os test structures
SELECT
    id,
    test_type,
    version,
    is_active,
    structure->>'metadata' as metadata_check,
    jsonb_array_length(structure->'categories') as categories_count,
    created_at
FROM test_structures
ORDER BY test_type, version DESC;

-- 2. Ver detalhes das categorias e questões
SELECT
    ts.test_type,
    ts.version,
    cat->>'name' as category_name,
    jsonb_array_length(cat->'questions') as questions_count
FROM test_structures ts,
    jsonb_array_elements(ts.structure->'categories') as cat
WHERE ts.is_active = true
ORDER BY ts.test_type;

-- 3. Ver tipos de questões usadas
SELECT DISTINCT
    ts.test_type,
    q->>'type' as question_type,
    COUNT(*) as count
FROM test_structures ts,
    jsonb_array_elements(ts.structure->'categories') as cat,
    jsonb_array_elements(cat->'questions') as q
WHERE ts.is_active = true
GROUP BY ts.test_type, q->>'type'
ORDER BY ts.test_type, question_type;

-- 4. Ver questões sem tipo definido
SELECT
    ts.test_type,
    ts.version,
    cat->>'name' as category,
    q->>'text' as question_text,
    q->>'type' as question_type,
    q
FROM test_structures ts,
    jsonb_array_elements(ts.structure->'categories') as cat,
    jsonb_array_elements(cat->'questions') as q
WHERE
    ts.is_active = true
    AND (q->>'type' IS NULL OR q->>'type' = '' OR q->>'type' NOT IN ('single_choice', 'multiple_choice', 'scale', 'text', 'textarea', 'number'))
ORDER BY ts.test_type;

-- 5. Ver estrutura completa de um teste específico (exemplo: DISC)
SELECT
    test_type,
    version,
    jsonb_pretty(structure) as structure_pretty
FROM test_structures
WHERE test_type = 'disc' AND is_active = true
LIMIT 1;
