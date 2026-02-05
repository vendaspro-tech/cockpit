-- Debug: Verificar se usuário tem job_title_id atribuído
-- Execute este SQL no Supabase SQL Editor para debug

-- 1. Ver seu workspace_member record
SELECT 
  wm.id as member_id,
  wm.user_id,
  wm.workspace_id,
  wm.access_level,
  wm.job_title_id,
  u.email,
  w.name as workspace_name
FROM workspace_members wm
LEFT JOIN users u ON wm.user_id = u.id
LEFT JOIN workspaces w ON wm.workspace_id = w.id
WHERE u.email = 'seu-email@aqui.com';  -- TROCAR COM SEU EMAIL

-- 2. Ver job_titles disponíveis
SELECT id, name, hierarchy_level, is_global
FROM job_titles
WHERE is_global = true
ORDER BY hierarchy_level, name;

-- 3. Ver se Empresário existe
SELECT * FROM job_titles WHERE name = 'Empresário' AND is_global = true;
