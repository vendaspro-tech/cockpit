-- Migration: Move marketing config to month strategies
-- Date: 2026-01-05

-- Add marketing columns to plan_product_month_strategies
ALTER TABLE plan_product_month_strategies
ADD COLUMN IF NOT EXISTS monthly_investment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpl NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS mql_to_sql_rate NUMERIC DEFAULT 0.25 
  CHECK (mql_to_sql_rate >= 0 AND mql_to_sql_rate <= 1);

-- Migrate data from plan_products to strategies
-- Divide annual investment by 12 months for each strategy
UPDATE plan_product_month_strategies pms
SET 
  monthly_investment = COALESCE(pp.monthly_investment, 0) / 12,
  cpl = COALESCE(pp.cpl, 10),
  mql_to_sql_rate = COALESCE(pp.mql_to_sql_rate, 0.25)
FROM plan_products pp
WHERE pms.plan_product_id = pp.id
  AND pms.monthly_investment = 0;  -- Only if not already set

-- Remove marketing columns from plan_products
ALTER TABLE plan_products
DROP COLUMN IF EXISTS monthly_investment,
DROP COLUMN IF EXISTS cpl,
DROP COLUMN IF EXISTS mql_to_sql_rate;

-- Add comments explaining the columns
COMMENT ON COLUMN plan_product_month_strategies.monthly_investment IS 'Monthly marketing investment for this specific strategy';
COMMENT ON COLUMN plan_product_month_strategies.cpl IS 'Cost Per Lead (MQL) for this month/strategy';
COMMENT ON COLUMN plan_product_month_strategies.mql_to_sql_rate IS 'MQL to SQL conversion rate for this month (0-1)';
