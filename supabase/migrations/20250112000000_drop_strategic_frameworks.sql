-- =============================================
-- DROP STRATEGIC FRAMEWORKS MODULE TABLES
-- =============================================
-- This migration removes all tables related to the strategic planning
-- module that has been deprecated from the application.
-- 
-- Tables to be dropped:
-- - metric_snapshots (depends on cycle_metrics)
-- - cycle_metrics (depends on strategic_cycles)
-- - execution_actions (depends on strategic_cycles)
-- - swot_items (depends on strategic_cycles)
-- - blue_ocean_items (depends on strategic_cycles)
-- - ansoff_items (depends on strategic_cycles)
-- - three_cs_items (depends on strategic_cycles)
-- - strategic_cycles (parent table)
-- =============================================

-- Drop in correct order (respecting foreign key dependencies)

-- 1. Drop metric_snapshots first (depends on cycle_metrics)
DROP TABLE IF EXISTS metric_snapshots CASCADE;

-- 2. Drop tables that depend on strategic_cycles
DROP TABLE IF EXISTS cycle_metrics CASCADE;
DROP TABLE IF EXISTS execution_actions CASCADE;
DROP TABLE IF EXISTS swot_items CASCADE;
DROP TABLE IF EXISTS blue_ocean_items CASCADE;
DROP TABLE IF EXISTS ansoff_items CASCADE;
DROP TABLE IF EXISTS three_cs_items CASCADE;

-- 3. Drop the parent table
DROP TABLE IF EXISTS strategic_cycles CASCADE;

-- Note: IF EXISTS ensures this migration won't fail if tables don't exist
