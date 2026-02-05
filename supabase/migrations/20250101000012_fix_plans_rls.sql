
-- Enable RLS on plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read plans
CREATE POLICY "Plans are viewable by everyone" 
ON plans FOR SELECT 
USING (true);

-- Ensure workspaces is readable by members (existing policy should cover this, but just in case)
-- We assume workspaces RLS is already set up correctly as the user can see the dashboard.
