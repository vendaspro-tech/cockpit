-- Migration: Update existing test structures to new metamodel format
-- Adds missing fields: type, options, metadata, scoring config

-- DISC Test: Add type and options to questions
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
        cat,
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
                jsonb_build_object('id', 'opt_d', 'label', 'Opção D (Dominância)', 'value', 1, 'order', 0, 'metadata', jsonb_build_object('profile', 'D')),
                jsonb_build_object('id', 'opt_i', 'label', 'Opção I (Influência)', 'value', 2, 'order', 1, 'metadata', jsonb_build_object('profile', 'I')),
                jsonb_build_object('id', 'opt_s', 'label', 'Opção S (Estabilidade)', 'value', 3, 'order', 2, 'metadata', jsonb_build_object('profile', 'S')),
                jsonb_build_object('id', 'opt_c', 'label', 'Opção C (Conformidade)', 'value', 4, 'order', 3, 'metadata', jsonb_build_object('profile', 'C'))
              )
            )
          )
          FROM jsonb_array_elements(cat->'questions') WITH ORDINALITY AS q
        ),
        false
      )
    )
    FROM jsonb_array_elements(structure->'categories') AS cat
  ),
  false
)
WHERE test_type = 'disc' AND NOT (structure->'categories'->0->'questions'->0 ? 'type');

-- Add scoring config to DISC if missing
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
WHERE test_type = 'disc' AND NOT (structure ? 'scoring');

-- DEF Method: Add type='scale' to questions
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
        cat,
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
    FROM jsonb_array_elements(structure->'categories') AS cat
  ),
  false
)
WHERE test_type = 'def_method' AND NOT (structure->'categories'->0->'questions'->0 ? 'type');

-- Add scoring config to DEF if missing
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
WHERE test_type = 'def_method' AND NOT (structure ? 'scoring');

-- Seniority Tests: Add type='scale' to questions
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
        cat,
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
    FROM jsonb_array_elements(structure->'categories') AS cat
  ),
  false
)
WHERE test_type IN ('seniority_seller', 'seniority_leader')
  AND NOT (structure->'categories'->0->'questions'->0 ? 'type');

-- Add scoring config to Seniority tests if missing
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
      jsonb_build_object('id', 'junior', 'label', 'Júnior', 'min', 1, 'max', 2.5),
      jsonb_build_object('id', 'pleno', 'label', 'Pleno', 'min', 2.5, 'max', 3.5),
      jsonb_build_object('id', 'senior', 'label', 'Sênior', 'min', 3.5, 'max', 5)
    )
  ),
  true
)
WHERE test_type IN ('seniority_seller', 'seniority_leader')
  AND NOT (structure ? 'scoring');

-- Leadership Style: Add type='scale' to questions
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
        cat,
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
    FROM jsonb_array_elements(structure->'categories') AS cat
  ),
  false
)
WHERE test_type = 'leadership_style'
  AND NOT (structure->'categories'->0->'questions'->0 ? 'type');

-- Add scoring config to Leadership Style if missing
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
WHERE test_type = 'leadership_style'
  AND NOT (structure ? 'scoring');

-- 8 Dimensions of Values: Add type='scale' to questions
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
        cat,
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
    FROM jsonb_array_elements(structure->'categories') AS cat
  ),
  false
)
WHERE test_type = 'values_8d'
  AND NOT (structure->'categories'->0->'questions'->0 ? 'type');

-- Add scoring config to 8D Values if missing
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
WHERE test_type = 'values_8d'
  AND NOT (structure ? 'scoring');

-- Remove old fields from all test structures
UPDATE test_structures
SET structure = structure - 'title' - 'version' - 'profiles' - 'scale'
WHERE structure ? 'title' OR structure ? 'version' OR structure ? 'profiles' OR structure ? 'scale';

COMMENT ON COLUMN test_structures.structure IS 'JSONB structure following the new metamodel: {metadata, categories, scoring}';
