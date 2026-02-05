-- Add name column to product_sales_scripts to group versions by script name
ALTER TABLE product_sales_scripts
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Script Principal';

-- Optional unique index to prevent duplicate version numbers per script name
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_sales_scripts_product_name_version
ON product_sales_scripts (product_id, name, version);
