-- Corrigir pergunta "Lead conhece o Expert?" para ter opções Sim/Não
-- Esta pergunta é diferente das outras do DEF que usam escala 1-3

UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{categories}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN category->>'id' = 'encantamento' 
        THEN jsonb_set(
          category,
          '{questions}',
          (
            SELECT jsonb_agg(
              CASE 
                WHEN question->>'id' = 'e12'
                THEN jsonb_build_object(
                  'id', 'e12',
                  'text', 'Lead conhece o Expert?',
                  'weight', 1,
                  'type', 'boolean',
                  'options', jsonb_build_array(
                    jsonb_build_object('label', 'Sim', 'value', 1),
                    jsonb_build_object('label', 'Não', 'value', 0)
                  )
                )
                ELSE question
              END
            )
            FROM jsonb_array_elements(category->'questions') AS question
          )
        )
        ELSE category
      END
    )
    FROM jsonb_array_elements(structure->'categories') AS category
  )
)
WHERE test_type = 'def_method';
