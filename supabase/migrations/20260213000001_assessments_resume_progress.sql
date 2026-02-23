-- Persist progress position so users can resume assessments exactly where they stopped
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS current_category_index INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessments_current_category_index_non_negative'
  ) THEN
    ALTER TABLE public.assessments
    ADD CONSTRAINT assessments_current_category_index_non_negative
    CHECK (current_category_index >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessments_current_question_index_non_negative'
  ) THEN
    ALTER TABLE public.assessments
    ADD CONSTRAINT assessments_current_question_index_non_negative
    CHECK (current_question_index >= 0);
  END IF;
END $$;
