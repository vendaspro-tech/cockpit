-- Drop plan_squad_config table (concept error - squads don't have strategies)
-- Squads are just people groupings. Strategies belong to products.
-- Squad share is calculated as sum of product shares linked to that squad.

DROP TABLE IF EXISTS plan_squad_config CASCADE;

-- Ensure plan_products.squad_id is nullable (already is, but being explicit)
ALTER TABLE plan_products 
ALTER COLUMN squad_id DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN plan_products.squad_id IS 'Optional reference to squad responsible for this product. Squad share is calculated from sum of product shares.';
