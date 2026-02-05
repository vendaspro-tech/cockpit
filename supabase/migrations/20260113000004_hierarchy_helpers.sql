-- Migration: 20260113000004_hierarchy_helpers.sql
-- Purpose: harden hierarchy helper functions for use inside RLS (T009)

-- Drop legacy helpers so we can recreate them with search_path safety
DROP FUNCTION IF EXISTS can_view_user_data(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_user_hierarchy_level(UUID, UUID);
DROP FUNCTION IF EXISTS is_leader(UUID, UUID);

-- Reliable lookup for hierarchy level (defaults to 3 = Execution if missing)
CREATE OR REPLACE FUNCTION get_user_hierarchy_level(user_id_param UUID, workspace_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hierarchy_level INTEGER;
BEGIN
  SELECT jt.hierarchy_level
  INTO hierarchy_level
  FROM workspace_members wm
  LEFT JOIN job_titles jt ON jt.id = wm.job_title_id
  WHERE wm.user_id = user_id_param
    AND wm.workspace_id = workspace_id_param;

  RETURN COALESCE(hierarchy_level, 3);
END;
$$;

-- Canonical helper for FR-002 hierarchy-based reads
CREATE OR REPLACE FUNCTION can_view_user_in_workspace(
  viewer_user_id UUID,
  target_user_id UUID,
  workspace_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_level INTEGER;
  target_level INTEGER;
BEGIN
  IF viewer_user_id = target_user_id THEN
    RETURN TRUE;
  END IF;

  viewer_level := get_user_hierarchy_level(viewer_user_id, workspace_id_param);
  target_level := get_user_hierarchy_level(target_user_id, workspace_id_param);

  RETURN viewer_level < target_level;
END;
$$;

-- Maintain backwards compatibility for existing policies/functions
CREATE OR REPLACE FUNCTION can_view_user_data(
  viewer_id UUID,
  target_user_id UUID,
  workspace_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT can_view_user_in_workspace($1, $2, $3);
$$;

CREATE OR REPLACE FUNCTION is_leader(user_id_param UUID, workspace_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN get_user_hierarchy_level(user_id_param, workspace_id_param) <= 2;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_hierarchy_level(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_user_in_workspace(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_user_data(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_leader(UUID, UUID) TO authenticated;

-- Supporting indexes to keep helper lookups fast under RLS
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user
  ON workspace_members(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_only
  ON workspace_members(user_id);
