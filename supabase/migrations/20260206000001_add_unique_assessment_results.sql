-- Ensure a single results row per assessment for upsert support
WITH ranked AS (
  SELECT
    id,
    assessment_id,
    generated_at,
    ROW_NUMBER() OVER (
      PARTITION BY assessment_id
      ORDER BY generated_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM assessment_results
)
DELETE FROM assessment_results ar
USING ranked r
WHERE ar.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessment_results_assessment_id_unique'
  ) THEN
    ALTER TABLE assessment_results
      ADD CONSTRAINT assessment_results_assessment_id_unique
      UNIQUE (assessment_id);
  END IF;
END $$;
