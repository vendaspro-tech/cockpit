-- Add icp_id and created_by to product_sales_scripts
ALTER TABLE product_sales_scripts
  ADD COLUMN IF NOT EXISTS icp_id UUID REFERENCES icps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Optional backfill: set created_by = editor_id when missing
UPDATE product_sales_scripts
SET created_by = editor_id
WHERE created_by IS NULL AND editor_id IS NOT NULL;
