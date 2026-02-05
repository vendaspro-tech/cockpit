-- Allow authenticated users to create workspaces
CREATE POLICY workspaces_insert_policy ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert into workspace_members (needed to add themselves as owner)
CREATE POLICY workspace_members_insert_policy ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );
