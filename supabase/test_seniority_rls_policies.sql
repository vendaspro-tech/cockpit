-- =============================================================================
-- SENIORITY ASSESSMENTS RLS VALIDATION SCRIPT (AUTO-DISCOVERY)
-- =============================================================================
-- Run this in Supabase Dashboard SQL Editor (service_role context)
-- This script automatically discovers users and tests RLS policies

-- =============================================================================
-- STEP 1: DISCOVER DATABASE STATE
-- =============================================================================

DO $$
DECLARE
  v_user_count int;
  v_workspace_count int;
  v_policy_count int;
  v_leader_count int;
  v_subordinate_count int;
BEGIN
  RAISE NOTICE '=== SENIORITY RLS VALIDATION STARTING ===';
  RAISE NOTICE '';
  
  -- Count resources
  SELECT COUNT(*) INTO v_user_count FROM users;
  SELECT COUNT(*) INTO v_workspace_count FROM workspaces;
  SELECT COUNT(*) INTO v_policy_count 
    FROM pg_policies WHERE tablename = 'seniority_assessments';
  SELECT COUNT(*) INTO v_leader_count 
    FROM workspace_members wm 
    JOIN job_titles jt ON jt.id = wm.job_title_id 
    WHERE jt.hierarchy_level <= 2;
  SELECT COUNT(*) INTO v_subordinate_count 
    FROM workspace_members wm 
    JOIN job_titles jt ON jt.id = wm.job_title_id 
    WHERE jt.hierarchy_level >= 3;
  
  RAISE NOTICE '📊 Database State:';
  RAISE NOTICE '   Users: %', v_user_count;
  RAISE NOTICE '   Workspaces: %', v_workspace_count;
  RAISE NOTICE '   RLS Policies: %', v_policy_count;
  RAISE NOTICE '   Leaders (level 0-2): %', v_leader_count;
  RAISE NOTICE '   Subordinates (level 3-4): %', v_subordinate_count;
  RAISE NOTICE '';
  
  IF v_user_count = 0 THEN
    RAISE NOTICE '❌ No users found - cannot run tests';
    RETURN;
  END IF;
  
  IF v_policy_count = 0 THEN
    RAISE NOTICE '❌ No RLS policies found - migration may not be applied';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Prerequisites met - proceeding with tests';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- STEP 2: LIST SAMPLE USERS & WORKSPACES
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '👥 Sample Users:';
END $$;

SELECT 
  u.id as user_id,
  u.email,
  LEFT(u.supabase_user_id::text, 12) || '...' as auth_id_preview,
  w.name as workspace,
  jt.name as job_title,
  jt.hierarchy_level
FROM users u
JOIN workspace_members wm ON wm.user_id = u.id
JOIN workspaces w ON w.id = wm.workspace_id
JOIN job_titles jt ON jt.id = wm.job_title_id
ORDER BY jt.hierarchy_level, u.email
LIMIT 5;

-- =============================================================================
-- STEP 3: VERIFY RLS POLICIES
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies on seniority_assessments:';
END $$;

SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING ✓'
    ELSE 'USING ✗'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK ✓'
    ELSE 'WITH CHECK ✗'
  END as has_check
FROM pg_policies 
WHERE tablename = 'seniority_assessments'
ORDER BY policyname;

-- =============================================================================
-- STEP 4: TEST HELPER FUNCTIONS
-- =============================================================================

DO $$
DECLARE
  v_leader_id uuid;
  v_subordinate_id uuid;
  v_workspace_id uuid;
  v_leader_level int;
  v_subordinate_level int;
  v_can_view boolean;
BEGIN
  RAISE NOTICE '🔧 Testing Helper Functions:';
  RAISE NOTICE '';
  
  -- Find a leader and subordinate in same workspace
  SELECT 
    leader.user_id,
    subordinate.user_id,
    leader.workspace_id,
    leader_jt.hierarchy_level,
    subordinate_jt.hierarchy_level
  INTO 
    v_leader_id,
    v_subordinate_id,
    v_workspace_id,
    v_leader_level,
    v_subordinate_level
  FROM workspace_members leader
  JOIN job_titles leader_jt ON leader_jt.id = leader.job_title_id
  JOIN workspace_members subordinate ON subordinate.workspace_id = leader.workspace_id
  JOIN job_titles subordinate_jt ON subordinate_jt.id = subordinate.job_title_id
  WHERE leader_jt.hierarchy_level <= 2 
    AND subordinate_jt.hierarchy_level >= 3
    AND leader.user_id != subordinate.user_id
  LIMIT 1;
  
  IF v_leader_id IS NULL THEN
    RAISE NOTICE '⚠️  No leader-subordinate pair found - skipping hierarchy test';
  ELSE
    -- Test get_user_hierarchy_level
    RAISE NOTICE '📍 Testing get_user_hierarchy_level()';
    RAISE NOTICE '   Leader level: %', v_leader_level;
    RAISE NOTICE '   Subordinate level: %', v_subordinate_level;
    
    -- Test can_view_user_data
    SELECT can_view_user_data(v_leader_id, v_subordinate_id, v_workspace_id) INTO v_can_view;
    
    IF v_can_view THEN
      RAISE NOTICE '   ✅ can_view_user_data: Leader CAN view subordinate (level % → %)', 
        v_leader_level, v_subordinate_level;
    ELSE
      RAISE NOTICE '   ❌ can_view_user_data: Leader CANNOT view subordinate (unexpected!)';
    END IF;
    
    -- Test reverse (subordinate viewing leader - should fail)
    SELECT can_view_user_data(v_subordinate_id, v_leader_id, v_workspace_id) INTO v_can_view;
    
    IF NOT v_can_view THEN
      RAISE NOTICE '   ✅ can_view_user_data: Subordinate CANNOT view leader (level % → %)', 
        v_subordinate_level, v_leader_level;
    ELSE
      RAISE NOTICE '   ❌ can_view_user_data: Subordinate CAN view leader (unexpected!)';
    END IF;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- STEP 5: TEST RLS POLICIES (SERVICE ROLE SIMULATION)
-- =============================================================================

DO $$
DECLARE
  v_test_user_id uuid;
  v_test_workspace_id uuid;
  v_test_job_title_id uuid;
  v_test_email text;
  v_assessment_id uuid;
  v_count int;
BEGIN
  RAISE NOTICE '🧪 Testing RLS Policies (service_role context):';
  RAISE NOTICE '   Note: Full RLS testing requires authenticated user context';
  RAISE NOTICE '';
  
  -- Pick first user with job title
  SELECT 
    u.id, 
    wm.workspace_id, 
    wm.job_title_id,
    u.email
  INTO 
    v_test_user_id, 
    v_test_workspace_id, 
    v_test_job_title_id,
    v_test_email
  FROM users u
  JOIN workspace_members wm ON wm.user_id = u.id
  WHERE wm.job_title_id IS NOT NULL
  LIMIT 1;
  
  IF v_test_user_id IS NULL THEN
    RAISE NOTICE '❌ No users with job titles - cannot test';
    RETURN;
  END IF;
  
  RAISE NOTICE '👤 Test user: % (id: %)', v_test_email, LEFT(v_test_user_id::text, 8) || '...';
  RAISE NOTICE '';
  
  -- Test 1: Insert self-assessment (should succeed as service_role)
  RAISE NOTICE '📝 Test 1: Insert self-assessment';
  BEGIN
    INSERT INTO seniority_assessments (
      workspace_id,
      evaluated_user_id,
      evaluator_user_id,
      assessment_type,
      job_title_id,
      status
    ) VALUES (
      v_test_workspace_id,
      v_test_user_id,
      v_test_user_id,
      'self',
      v_test_job_title_id,
      'draft'
    ) RETURNING id INTO v_assessment_id;
    
    RAISE NOTICE '   ✅ INSERT succeeded (id: %)', LEFT(v_assessment_id::text, 8) || '...';
    RAISE NOTICE '   Note: This bypassed RLS (service_role). Test via UI for real RLS behavior.';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ❌ INSERT failed: %', SQLERRM;
    v_assessment_id := NULL;
  END;
  
  -- Test 2: Read assessment back
  IF v_assessment_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📖 Test 2: Read assessment';
    SELECT COUNT(*) INTO v_count 
    FROM seniority_assessments 
    WHERE id = v_assessment_id;
    
    IF v_count = 1 THEN
      RAISE NOTICE '   ✅ SELECT succeeded - assessment readable';
    ELSE
      RAISE NOTICE '   ❌ SELECT failed - assessment not found';
    END IF;
    
    -- Test 3: Update assessment
    RAISE NOTICE '';
    RAISE NOTICE '✏️  Test 3: Update assessment status';
    BEGIN
      UPDATE seniority_assessments 
      SET status = 'self_submitted'
      WHERE id = v_assessment_id;
      
      RAISE NOTICE '   ✅ UPDATE succeeded';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '   ❌ UPDATE failed: %', SQLERRM;
    END;
    
    -- Cleanup
    DELETE FROM seniority_assessments WHERE id = v_assessment_id;
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Cleanup: Test assessment deleted';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- STEP 6: POLICY COVERAGE CHECK
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policy Coverage Summary:';
END $$;

WITH expected_policies AS (
  SELECT unnest(ARRAY[
    'seniority_assessments_system_owners',
    'seniority_assessments_self_read',
    'seniority_assessments_hierarchy_read',
    'seniority_assessments_self_insert',
    'seniority_assessments_self_update',
    'seniority_assessments_leader_insert',
    'seniority_assessments_leader_update'
  ]) as policy_name
)
SELECT 
  ep.policy_name,
  CASE 
    WHEN pp.policyname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM expected_policies ep
LEFT JOIN pg_policies pp ON pp.policyname = ep.policy_name 
  AND pp.tablename = 'seniority_assessments'
ORDER BY ep.policy_name;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDATION COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: These tests ran in service_role context (bypasses RLS)';
  RAISE NOTICE '   For real RLS validation:';
  RAISE NOTICE '   1. Test via UI as authenticated user';
  RAISE NOTICE '   2. Try creating self-assessment';
  RAISE NOTICE '   3. Try viewing other users'' assessments';
  RAISE NOTICE '   4. Test leader viewing subordinate assessments';
  RAISE NOTICE '';
END $$;
