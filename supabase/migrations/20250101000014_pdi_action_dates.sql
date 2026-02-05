-- Add date tracking columns to pdi_actions
ALTER TABLE pdi_actions
  ADD COLUMN start_date DATE,
  ADD COLUMN due_date DATE;

COMMENT ON COLUMN pdi_actions.start_date IS 'Planned start date for the action';
COMMENT ON COLUMN pdi_actions.due_date IS 'Due date for the action';
