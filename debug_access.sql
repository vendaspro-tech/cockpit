-- Execute este SQL para ver exatamente o que a função canAccessCommercialPlans vê
-- SUBSTITUA os valores com seus dados reais

-- Primeiro, pegue seu user_id e workspace_id:
SELECT 
  u.id as user_id,
  u.email,
  wm.workspace_id,
  w.name as workspace_name,
  wm.job_title_id,
  jt.name as job_title_name,
  jt.hierarchy_level,
  (jt.hierarchy_level <= 1) as should_have_access
FROM users u
LEFT JOIN workspace_members wm ON wm.user_id = u.id
LEFT JOIN workspaces w ON w.id = wm.workspace_id
LEFT JOIN job_titles jt ON jt.id = wm.job_title_id
WHERE u.email = 'brenno.pinheiro@vendas-pro.com'  -- TROCAR!
ORDER BY w.name;

-- Se o resultado mostrar should_have_access = true, então o problema é no código
-- Se mostrar false ou null, então o cargo não está corretamente atribuído
