-- ============================================================================
-- Migration: Feature Performance Indexes
-- Description: Add indexes to optimize common queries in competency & PDI system
-- Phase: Phase 6 - Polish (T045)
-- Date: 2026-01-13
-- ============================================================================

-- Index for job titles sorted by hierarchy level
-- Used by: Job titles list page sorting, hierarchy comparisons
CREATE INDEX IF NOT EXISTS idx_job_titles_hierarchy_level 
ON job_titles(hierarchy_level);

-- Composite index for active competency framework lookups by job title
-- Used by: Framework selection when creating assessments, admin framework list
CREATE INDEX IF NOT EXISTS idx_competency_frameworks_job_title_active 
ON competency_frameworks(job_title_id, is_active);

-- Composite index for assessment queries by workspace and user
-- Used by: User assessment history, dashboard queries filtering by workspace/user
CREATE INDEX IF NOT EXISTS idx_seniority_assessments_workspace_user_status 
ON seniority_assessments(workspace_id, evaluated_user_id, status);

-- Index for leader dashboard to find pending calibrations
-- Used by: Leader view to fetch assessments they need to calibrate
CREATE INDEX IF NOT EXISTS idx_seniority_assessments_evaluator_status 
ON seniority_assessments(evaluator_user_id, status);

-- Index for bulk hierarchy queries via workspace members
-- Used by: Hierarchy access checks when determining visible users
CREATE INDEX IF NOT EXISTS idx_workspace_members_job_title 
ON workspace_members(job_title_id);

-- Index for finding workspace members by user
-- Used by: getUserHierarchyInfo helper to get user's role in workspace
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_workspace 
ON workspace_members(user_id, workspace_id);

-- Add comments for documentation
COMMENT ON INDEX idx_job_titles_hierarchy_level IS 
'Optimizes job title list sorting and hierarchy level comparisons';

COMMENT ON INDEX idx_competency_frameworks_job_title_active IS 
'Optimizes finding active frameworks for a specific job title';

COMMENT ON INDEX idx_seniority_assessments_workspace_user_status IS 
'Optimizes dashboard queries filtering by workspace, user, and status';

COMMENT ON INDEX idx_seniority_assessments_evaluator_status IS 
'Optimizes leader dashboard queries for pending calibrations';

COMMENT ON INDEX idx_workspace_members_job_title IS 
'Optimizes bulk hierarchy queries via workspace members';

COMMENT ON INDEX idx_workspace_members_user_workspace IS 
'Optimizes getUserHierarchyInfo helper function';
