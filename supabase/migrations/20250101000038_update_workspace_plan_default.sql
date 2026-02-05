-- Remover constraint rígida de plano e definir default como "Closer PRO"
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_plan_check;
ALTER TABLE workspaces ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE workspaces ALTER COLUMN plan SET DEFAULT 'Closer PRO';
