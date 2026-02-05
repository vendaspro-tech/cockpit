-- Migration: Move marketing config from global to product-level
-- Date: 2026-01-05

-- Add marketing columns to plan_products
ALTER TABLE plan_products
ADD COLUMN IF NOT EXISTS monthly_investment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpl NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mql_to_sql_rate NUMERIC DEFAULT 0.25 
  CHECK (mql_to_sql_rate >= 0 AND mql_to_sql_rate <= 1);

-- Migrate existing data from plan_marketing_config to plan_products
-- Each product gets investment proportional to its share
UPDATE plan_products pp
SET 
  monthly_investment = COALESCE(pmc.monthly_investment, 0) * pp.share_target,
  cpl = COALESCE(pmc.cpl, 10),
  mql_to_sql_rate = COALESCE(pmc.mql_to_sql_rate, 0.25)
FROM plan_marketing_config pmc
WHERE pp.plan_id = pmc.plan_id
  AND pp.monthly_investment = 0; -- Only update if not already set

-- Add comment explaining the columns
COMMENT ON COLUMN plan_products.monthly_investment IS 'Monthly marketing investment for this specific product in the plan currency';
COMMENT ON COLUMN plan_products.cpl IS 'Cost Per Lead (MQL) for this product';
COMMENT ON COLUMN plan_products.mql_to_sql_rate IS 'Marketing Qualified Lead to Sales Qualified Lead conversion rate (0-1)';

-- Drop old global marketing config table
-- Note: This is a breaking change, but we're migrating data first
DROP TABLE IF EXISTS plan_marketing_config CASCADE;
