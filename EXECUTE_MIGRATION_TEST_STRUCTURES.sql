-- ============================================================================
-- MIGRATION: Update Test Structures to New Metamodel Format
-- ============================================================================
-- This script adds missing fields to existing test structures:
-- - type field for questions
-- - options array for choice questions
-- - metadata object with name, description, instructions
-- - scoring configuration
--
-- IMPORTANT: Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- DISC Test
-- ============================================================================
-- Add type='single_choice' and options to DISC questions
UPDATE test_structures
SET structure = jsonb_set(
  jsonb_set(
    structure,
    '{metadata}',
    jsonb_build_object(
      'name', structure->>'title',
      'description', structure->>'description',
      'instructions', 'Escolha a alternativa que mais se aproxima do seu comportamento natural.',
      'estimated_duration_minutes', 15
    )
  ),
  '{categories}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        jsonb_set(
          cat,
          '{order}',
          to_jsonb((row_number() OVER ()) - 1)
        ),
        '{questions}',
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', q->>'id',
              'text', q->>'text',
              'type', 'single_choice',
              'order', (row_number() OVER ()) - 1,
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('id', 'opt_d', 'label', 'Opção D', 'value', 1, 'order', 0),
                jsonb_build_object('id', 'opt_i', 'label', 'Opção I', 'value', 2, 'order', 1),
                jsonb_build_object('id', 'opt_s', 'label', 'Opção S', 'value', 3, 'order', 2),
                jsonb_build_object('id', 'opt_c', 'label', 'Opção C', 'value', 4, 'order', 3)
              )
            )
          )
          FROM jsonb_array_elements(cat->'questions') WITH ORDINALITY AS q
        ),
        false
      )
    )
    FROM jsonb_array_elements(structure->'categories') WITH ORDINALITY AS cat
  ),
  false
)
WHERE test_type = 'disc';

-- Add scoring config to DISC
UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{scoring}',
  jsonb_build_object(
    'method', 'custom',
    'category_weights', jsonb_build_object(),
    'scale', jsonb_build_object(
      'min', 1,
      'max', 4,
      'labels', jsonb_build_object(
        'min', 'Menos você',
        'max', 'Muito você'
      )
    ),
    'ranges', jsonb_build_array()
  ),
  true
)
WHERE test_type = 'disc';

-- ============================================================================
-- DEF Method
-- ============================================================================
UPDATE test_structures
SET structure = jsonb_set(
  jsonb_set(
    structure,
    '{metadata}',
    jsonb_build_object(
      'name', COALESCE(structure->>'title', 'Método DEF'),
      'description', COALESCE(structure->>'description', 'Avaliação de Desempenho, Esforço e Facilidade'),
      'instructions', 'Avalie cada dimensão usando a escala de 1 a 5.',
      'estimated_duration_minutes', 10
    )
  ),
  '{categories}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        jsonb_set(
          cat,
          '{order}',
          to_jsonb((row_number() OVER ()) - 1)
        ),
        '{questions}',
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', q->>'id',
              'text', q->>'text',
              'type', 'scale',
              'order', (row_number() OVER ()) - 1,
              'required', true
            )
          )
          FROM jsonb_array_elements(cat->'questions') WITH ORDINALITY AS q
        ),
        false
      )
    )
    FROM jsonb_array_elements(structure->'categories') WITH ORDINALITY AS cat
  ),
  false
)
WHERE test_type = 'def_method';

UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{scoring}',
  jsonb_build_object(
    'method', 'custom',
    'category_weights', jsonb_build_object(),
    'scale', jsonb_build_object(
      'min', 1,
      'max', 5,
      'labels', jsonb_build_object(
        'min', 'Muito baixo',
        'max', 'Muito alto'
      )
    ),
    'ranges', jsonb_build_array()
  ),
  true
)
WHERE test_type = 'def_method';

-- ============================================================================
-- Seniority Tests (Seller and Leader)
-- ============================================================================
UPDATE test_structures
SET structure = jsonb_set(
  jsonb_set(
    structure,
    '{metadata}',
    jsonb_build_object(
      'name', COALESCE(structure->>'title', 'Avaliação de Senioridade'),
      'description', COALESCE(structure->>'description', 'Avaliação de nível de senioridade'),
      'instructions', 'Avalie cada competência usando a escala de 1 a 5.',
      'estimated_duration_minutes', 20
    )
  ),
  '{categories}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        jsonb_set(
          cat,
          '{order}',
          to_jsonb((row_number() OVER ()) - 1)
        ),
        '{questions}',
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', q->>'id',
              'text', q->>'text',
              'type', 'scale',
              'order', (row_number() OVER ()) - 1,
              'required', true
            )
          )
          FROM jsonb_array_elements(cat->'questions') WITH ORDINALITY AS q
        ),
        false
      )
    )
    FROM jsonb_array_elements(structure->'categories') WITH ORDINALITY AS cat
  ),
  false
)
WHERE test_type IN ('seniority_seller', 'seniority_leader');

UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{scoring}',
  jsonb_build_object(
    'method', 'weighted_average',
    'category_weights', jsonb_build_object(),
    'scale', jsonb_build_object(
      'min', 1,
      'max', 5,
      'labels', jsonb_build_object(
        'min', 'Iniciante',
        'max', 'Expert'
      )
    ),
    'ranges', jsonb_build_array(
      jsonb_build_object('id', 'junior', 'label', 'Júnior', 'min', 1.0, 'max', 2.5),
      jsonb_build_object('id', 'pleno', 'label', 'Pleno', 'min', 2.5, 'max', 3.5),
      jsonb_build_object('id', 'senior', 'label', 'Sênior', 'min', 3.5, 'max', 5.0)
    )
  ),
  true
)
WHERE test_type IN ('seniority_seller', 'seniority_leader');

-- ============================================================================
-- Leadership Style
-- ============================================================================
UPDATE test_structures
SET structure = jsonb_set(
  jsonb_set(
    structure,
    '{metadata}',
    jsonb_build_object(
      'name', COALESCE(structure->>'title', 'Estilo de Liderança'),
      'description', COALESCE(structure->>'description', 'Avaliação de estilo de liderança'),
      'instructions', 'Avalie cada afirmação de acordo com seu estilo.',
      'estimated_duration_minutes', 15
    )
  ),
  '{categories}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        jsonb_set(
          cat,
          '{order}',
          to_jsonb((row_number() OVER ()) - 1)
        ),
        '{questions}',
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', q->>'id',
              'text', q->>'text',
              'type', 'scale',
              'order', (row_number() OVER ()) - 1,
              'required', true
            )
          )
          FROM jsonb_array_elements(cat->'questions') WITH ORDINALITY AS q
        ),
        false
      )
    )
    FROM jsonb_array_elements(structure->'categories') WITH ORDINALITY AS cat
  ),
  false
)
WHERE test_type = 'leadership_style';

UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{scoring}',
  jsonb_build_object(
    'method', 'custom',
    'category_weights', jsonb_build_object(),
    'scale', jsonb_build_object(
      'min', 1,
      'max', 5,
      'labels', jsonb_build_object(
        'min', 'Discordo totalmente',
        'max', 'Concordo totalmente'
      )
    ),
    'ranges', jsonb_build_array()
  ),
  true
)
WHERE test_type = 'leadership_style';

-- ============================================================================
-- 8 Dimensions of Values
-- ============================================================================
UPDATE test_structures
SET structure = jsonb_set(
  jsonb_set(
    structure,
    '{metadata}',
    jsonb_build_object(
      'name', COALESCE(structure->>'title', '8 Dimensões de Valores'),
      'description', COALESCE(structure->>'description', 'Avaliação de valores pessoais'),
      'instructions', 'Posicione-se entre os extremos de cada dimensão.',
      'estimated_duration_minutes', 15
    )
  ),
  '{categories}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        jsonb_set(
          cat,
          '{order}',
          to_jsonb((row_number() OVER ()) - 1)
        ),
        '{questions}',
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', q->>'id',
              'text', q->>'text',
              'type', 'scale',
              'order', (row_number() OVER ()) - 1,
              'required', true
            )
          )
          FROM jsonb_array_elements(cat->'questions') WITH ORDINALITY AS q
        ),
        false
      )
    )
    FROM jsonb_array_elements(structure->'categories') WITH ORDINALITY AS cat
  ),
  false
)
WHERE test_type = 'values_8d';

UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{scoring}',
  jsonb_build_object(
    'method', 'custom',
    'category_weights', jsonb_build_object(),
    'scale', jsonb_build_object(
      'min', 1,
      'max', 7,
      'labels', jsonb_build_object(
        'min', 'Extremo esquerdo',
        'max', 'Extremo direito'
      )
    ),
    'ranges', jsonb_build_array()
  ),
  true
)
WHERE test_type = 'values_8d';

-- ============================================================================
-- Cleanup: Remove old structure fields
-- ============================================================================
UPDATE test_structures
SET structure = structure - 'title' - 'version' - 'profiles' - 'scale' - 'id'
WHERE structure ? 'title' OR structure ? 'version' OR structure ? 'profiles' OR structure ? 'scale' OR structure ? 'id';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the migration worked
SELECT
    test_type,
    structure->>'metadata' as has_metadata,
    structure->'categories'->0->'questions'->0->>'type' as first_question_type,
    structure ? 'scoring' as has_scoring
FROM test_structures
ORDER BY test_type;
