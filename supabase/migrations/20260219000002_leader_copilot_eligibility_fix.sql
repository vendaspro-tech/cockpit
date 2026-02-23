-- Migration: 20260219000002_leader_copilot_eligibility_fix.sql
-- Purpose: make leader copilot eligibility robust (owner/admin or hierarchy<=2 or known leader titles)

CREATE OR REPLACE FUNCTION is_leader_copilot_eligible_user(user_id_param UUID, workspace_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    LEFT JOIN job_titles jt ON jt.id = wm.job_title_id
    WHERE wm.workspace_id = workspace_id_param
      AND wm.user_id = user_id_param
      AND (
        COALESCE(LOWER(wm.role), '') IN ('owner', 'admin')
        OR COALESCE(jt.hierarchy_level, 99) <= 2
        OR COALESCE(LOWER(jt.slug), '') IN ('supervisor-comercial', 'coordenador-comercial', 'gerente-comercial')
        OR COALESCE(LOWER(jt.name), '') IN ('supervisor comercial', 'coordenador comercial', 'gerente comercial')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION is_leader_copilot_eligible_user(UUID, UUID) TO authenticated;
