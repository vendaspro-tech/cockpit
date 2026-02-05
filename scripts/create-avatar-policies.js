/**
 * Script: Create User Avatars RLS Policies
 *
 * Creates RLS policies for the user-avatars bucket
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - user-avatars bucket already created
 *
 * Usage:
 * node scripts/create-avatar-policies.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createPolicies() {
  console.log('🔐 Creating RLS policies for user-avatars bucket...\n')

  const policies = [
    {
      name: 'Public avatar read access',
      sql: `
        CREATE POLICY "Public avatar read access"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'user-avatars');
      `
    },
    {
      name: 'Users can upload own avatar',
      sql: `
        CREATE POLICY "Users can upload own avatar"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'user-avatars' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `
    },
    {
      name: 'Users can update own avatar',
      sql: `
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
      `
    },
    {
      name: 'Users can delete own avatar',
      sql: `
        CREATE POLICY "Users can delete own avatar"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'user-avatars' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `
    }
  ]

  let created = 0
  let errors = 0

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql })

      if (error) {
        // Try alternative method - direct SQL via postgrest
        const { error: error2 } = await supabase
          .from('_sql')
          .insert({ query: policy.sql })

        if (error2) {
          console.log(`   ⚠️  ${policy.name}: ${error.message}`)
          errors++
        } else {
          console.log(`   ✅ ${policy.name}`)
          created++
        }
      } else {
        console.log(`   ✅ ${policy.name}`)
        created++
      }
    } catch (err) {
      console.log(`   ❌ ${policy.name}: ${err.message}`)
      errors++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ❌ Errors: ${errors}`)

  if (errors > 0) {
    console.log('\n⚠️  Some policies could not be created via API.')
    console.log('   Please run the SQL manually in Supabase Dashboard > SQL Editor')
    console.log('   (The SQL was shown in the previous step)\n')
  } else {
    console.log('\n✨ All policies created successfully!')
  }
}

createPolicies()
