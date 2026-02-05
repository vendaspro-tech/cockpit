-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE def_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE def_meeting_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE def_meeting_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_structures ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: Get user's workspaces
-- =============================================

CREATE OR REPLACE FUNCTION public.user_workspaces(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT workspace_id 
  FROM workspace_members 
  WHERE user_id = user_uuid;
$$;

-- =============================================
-- USERS: Allow read for authenticated users
-- =============================================

CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- WORKSPACES: Members can view their workspaces
-- =============================================

CREATE POLICY workspaces_select_policy ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT public.user_workspaces(auth.uid()))
  );

-- =============================================
-- WORKSPACE_MEMBERS: Can view members of their workspaces
-- =============================================

CREATE POLICY workspace_members_select_policy ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

-- =============================================
-- TEAMS: Can view teams in their workspaces
-- =============================================

CREATE POLICY teams_select_policy ON teams
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

CREATE POLICY teams_insert_policy ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND workspace_id = teams.workspace_id
      AND role IN ('owner', 'admin', 'leader')
    )
  );

-- =============================================
-- TEAM_MEMBERS: Can view team members in their workspaces
-- =============================================

CREATE POLICY team_members_select_policy ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

-- =============================================
-- TEST_STRUCTURES: Public read access
-- =============================================

CREATE POLICY test_structures_select_policy ON test_structures
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- ASSESSMENTS: Complex access based on role
-- =============================================

CREATE POLICY assessments_select_policy ON assessments
  FOR SELECT
  TO authenticated
  USING (
    -- User is in the workspace
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND (
      -- User is the evaluated person
      evaluated_user_id = auth.uid()
      -- OR user is the evaluator
      OR evaluator_user_id = auth.uid()
      -- OR user is owner/admin/leader in the workspace
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE user_id = auth.uid()
        AND workspace_id = assessments.workspace_id
        AND role IN ('owner', 'admin', 'leader')
      )
      -- OR user is evaluating someone in their team
      OR EXISTS (
        SELECT 1 FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = assessments.evaluated_user_id
        AND t.leader_id = auth.uid()
      )
    )
  );

CREATE POLICY assessments_insert_policy ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

-- =============================================
-- ASSESSMENT_RESPONSES: Follow assessment access
-- =============================================

CREATE POLICY assessment_responses_select_policy ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM assessments 
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY assessment_responses_insert_policy ON assessment_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessments 
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

-- =============================================
-- ASSESSMENT_RESULTS: Follow assessment access
-- =============================================

CREATE POLICY assessment_results_select_policy ON assessment_results
  FOR SELECT
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM assessments 
      WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

-- =============================================
-- DEF MEETINGS: Seller sees own, evaluator sees evaluated, leaders see team
-- =============================================

CREATE POLICY def_meetings_select_policy ON def_meetings
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND (
      seller_id = auth.uid()
      OR evaluator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE user_id = auth.uid()
        AND workspace_id = def_meetings.workspace_id
        AND role IN ('owner', 'admin', 'leader')
      )
    )
  );

CREATE POLICY def_meetings_insert_policy ON def_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

-- =============================================
-- DEF MEETING SCORES & COMMENTS: Follow meeting access
-- =============================================

CREATE POLICY def_scores_select_policy ON def_meeting_scores
  FOR SELECT
  TO authenticated
  USING (
    meeting_id IN (SELECT id FROM def_meetings WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid())))
  );

CREATE POLICY def_comments_select_policy ON def_meeting_comments
  FOR SELECT
  TO authenticated
  USING (
    meeting_id IN (SELECT id FROM def_meetings WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid())))
  );

-- =============================================
-- PDI PLANS: User sees own, leaders see team PDIs
-- =============================================

CREATE POLICY pdi_plans_select_policy ON pdi_plans
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE user_id = auth.uid()
        AND workspace_id = pdi_plans.workspace_id
        AND role IN ('owner', 'admin', 'leader')
      )
      OR EXISTS (
        SELECT 1 FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = pdi_plans.user_id
        AND t.leader_id = auth.uid()
      )
    )
  );

CREATE POLICY pdi_plans_insert_policy ON pdi_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

CREATE POLICY pdi_plans_update_policy ON pdi_plans
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

-- =============================================
-- PDI ITEMS, ACTIONS, EVIDENCE: Follow PDI plan access
-- =============================================

CREATE POLICY pdi_items_select_policy ON pdi_items
  FOR SELECT
  TO authenticated
  USING (
    pdi_plan_id IN (SELECT id FROM pdi_plans WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid())))
  );

CREATE POLICY pdi_actions_select_policy ON pdi_actions
  FOR SELECT
  TO authenticated
  USING (
    pdi_item_id IN (
      SELECT id FROM pdi_items 
      WHERE pdi_plan_id IN (SELECT id FROM pdi_plans WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid())))
    )
  );

CREATE POLICY pdi_evidence_select_policy ON pdi_evidence
  FOR SELECT
  TO authenticated
  USING (
    pdi_item_id IN (
      SELECT id FROM pdi_items 
      WHERE pdi_plan_id IN (SELECT id FROM pdi_plans WHERE workspace_id IN (SELECT public.user_workspaces(auth.uid())))
    )
  );

-- =============================================
-- CUSTOM WEIGHTS: Admin only
-- =============================================

CREATE POLICY custom_weights_select_policy ON custom_weights
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

CREATE POLICY custom_weights_insert_update_policy ON custom_weights
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND workspace_id = custom_weights.workspace_id
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- ALERTS: User sees own alerts
-- =============================================

CREATE POLICY alerts_select_policy ON alerts
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    AND user_id = auth.uid()
  );

CREATE POLICY alerts_update_policy ON alerts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  );
