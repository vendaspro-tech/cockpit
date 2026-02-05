-- Migration: Setup PDI Evidence Storage
-- Creates storage bucket and policies for PDI evidence files

-- Create storage bucket for PDI evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdi-evidence', 'pdi-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pdi-evidence bucket
-- Note: Policies are simplified to work with public bucket
-- Access control is primarily handled at the application level via RLS on pdi_evidence table

-- Policy: Anyone authenticated can view files (RLS on DB controls actual access)
CREATE POLICY "Authenticated users can view PDI evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdi-evidence');

-- Policy: Authenticated users can upload files (RLS on DB controls actual access)
CREATE POLICY "Authenticated users can upload PDI evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdi-evidence');

-- Policy: Authenticated users can delete files (RLS on DB controls actual access)
CREATE POLICY "Authenticated users can delete PDI evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdi-evidence');

-- Add index for better performance on evidence queries
CREATE INDEX IF NOT EXISTS idx_pdi_evidence_item ON pdi_evidence(pdi_item_id);
CREATE INDEX IF NOT EXISTS idx_pdi_evidence_uploaded_by ON pdi_evidence(uploaded_by);

COMMENT ON COLUMN pdi_evidence.file_url IS 'Public URL of the uploaded evidence file in Supabase Storage';
COMMENT ON COLUMN pdi_evidence.description IS 'Optional description of what this evidence proves';
COMMENT ON COLUMN pdi_evidence.uploaded_by IS 'User who uploaded this evidence';
