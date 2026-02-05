-- Add pdi_id column to assessments table
-- This links an assessment to its generated PDI

ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS pdi_id UUID REFERENCES pdi_plans(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_assessments_pdi ON assessments(pdi_id);

COMMENT ON COLUMN assessments.pdi_id IS 'Reference to PDI generated from this assessment';
