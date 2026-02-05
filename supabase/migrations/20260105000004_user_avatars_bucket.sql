-- Migration: User Avatars Bucket
-- Description: Create user-avatars bucket with proper RLS policies
-- Related: PRD Section 2.7 - Storage de Avatares e Assets do Usuário
-- Date: 2026-01-05

-- =====================================================
-- 1. CREATE USER-AVATARS BUCKET
-- =====================================================

-- Create the new bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. RLS POLICIES FOR USER-AVATARS BUCKET
-- =====================================================

-- Public read access (avatars are public)
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- NOTES
-- =====================================================
--
-- This migration creates the new user-avatars bucket with:
-- 1. Public read access (anyone can view avatars)
-- 2. Restricted write access (users can only manage their own avatars)
-- 3. File size limit of 5MB
-- 4. Allowed mime types for common image formats
--
-- Structure: user-avatars/{user_id}/{filename}
--
-- After this migration, run the migration script to move existing avatars:
-- node scripts/migrate-user-avatars.js
--
-- Then update the code in components/settings/account-settings.tsx to use
-- the new bucket (change from 'workspace-assets' to 'user-avatars')
