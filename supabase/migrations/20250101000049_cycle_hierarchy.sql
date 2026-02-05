-- =============================================
-- STRATEGIC CYCLES - ANNUAL HIERARCHY SUPPORT
-- =============================================

-- Add cycle type and parent relationship for annual → quarterly hierarchy
ALTER TABLE strategic_cycles 
ADD COLUMN IF NOT EXISTS cycle_type TEXT DEFAULT 'quarterly' CHECK (cycle_type IN ('annual', 'quarterly')),
ADD COLUMN IF NOT EXISTS parent_cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE SET NULL;

-- Add archived status to existing check constraint
-- First, drop the old constraint and create a new one
ALTER TABLE strategic_cycles DROP CONSTRAINT IF EXISTS strategic_cycles_status_check;
ALTER TABLE strategic_cycles 
ADD CONSTRAINT strategic_cycles_status_check 
CHECK (status IN ('planning', 'executing', 'reviewing', 'completed', 'archived'));

-- Add index for parent lookup
CREATE INDEX IF NOT EXISTS idx_strategic_cycles_parent ON strategic_cycles(parent_cycle_id);
CREATE INDEX IF NOT EXISTS idx_strategic_cycles_type ON strategic_cycles(cycle_type);

-- Comments
COMMENT ON COLUMN strategic_cycles.cycle_type IS 'Type of cycle: annual (year-long strategy) or quarterly (Q1-Q4 execution)';
COMMENT ON COLUMN strategic_cycles.parent_cycle_id IS 'For quarterly cycles, references the parent annual cycle';
