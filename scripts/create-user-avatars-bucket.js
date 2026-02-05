/**
 * Script: Create User Avatars Bucket
 *
 * Creates the user-avatars bucket via Supabase API (no database password needed)
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL in .env or environment
 * - SUPABASE_SERVICE_ROLE_KEY in .env or environment
 *
 * Usage:
 * node scripts/create-user-avatars-bucket.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗')
  console.error('\n💡 Make sure these are set in your .env.local file')
  process.exit(1)
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createBucket() {
  console.log('🚀 Creating user-avatars bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketExists = buckets.some(b => b.id === 'user-avatars')

    if (bucketExists) {
      console.log('✅ Bucket "user-avatars" already exists!')
      console.log('   No action needed.\n')
      return
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('user-avatars', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
      ]
    })

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`)
    }

    console.log('✅ Bucket "user-avatars" created successfully!\n')
    console.log('📋 Bucket details:')
    console.log('   ID: user-avatars')
    console.log('   Public: true')
    console.log('   Size limit: 5MB')
    console.log('   Allowed types: JPEG, PNG, WebP, GIF\n')

    console.log('⚠️  Note: RLS policies need to be created via SQL')
    console.log('   Run this SQL in Supabase Dashboard > SQL Editor:\n')

    console.log(`
-- Public read access
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
`)

    console.log('\n✨ Done! You can now upload avatars.')

  } catch (error) {
    console.error('\n💥 Error:', error.message)
    process.exit(1)
  }
}

// Run
createBucket()
