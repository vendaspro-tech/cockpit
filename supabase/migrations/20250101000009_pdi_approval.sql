-- PDI Approval and Progress Tracking
-- Adds approval workflow and date tracking fields

ALTER TABLE pdi_plans
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN start_date DATE,
  ADD COLUMN completion_date DATE;

-- Update status check to include draft
ALTER TABLE pdi_plans 
  DROP CONSTRAINT IF EXISTS pdi_plans_status_check;

ALTER TABLE pdi_plans
  ADD CONSTRAINT pdi_plans_status_check 
  CHECK (status IN ('draft', 'active', 'completed', 'archived'));

-- Create index for approved_by lookups
CREATE INDEX idx_pdi_plans_approved_by ON pdi_plans(approved_by);

COMMENT ON COLUMN pdi_plans.approved_by IS 'User who approved the PDI (typically a manager)';
COMMENT ON COLUMN pdi_plans.approved_at IS 'Timestamp when the PDI was approved';
COMMENT ON COLUMN pdi_plans.start_date IS 'Actual start date of PDI execution';
COMMENT ON COLUMN pdi_plans.completion_date IS 'Actual completion date (when all items are done)';
