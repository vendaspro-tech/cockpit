-- Remove max_products column from plans table
ALTER TABLE plans DROP COLUMN IF EXISTS max_products;
