-- Add is_template and template_id columns to action_plans table

ALTER TABLE action_plans 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES action_plans(id);

-- Add index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_action_plans_is_template ON action_plans(is_template);
