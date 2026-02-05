-- Add settings columns to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Create storage bucket for workspace assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- Allow public access to view files
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'workspace-assets');

-- Allow authenticated users to upload files (simplified for MVP, ideally restricted to workspace members)
CREATE POLICY "Auth Upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'workspace-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their files
CREATE POLICY "Auth Update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'workspace-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Auth Delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'workspace-assets' 
  AND auth.role() = 'authenticated'
);
