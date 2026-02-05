/**
 * Migration Script: User Avatars
 *
 * This script migrates existing avatars from workspace-assets/avatars/*
 * to the new user-avatars bucket structure: user-avatars/{user_id}/*
 *
 * Related: PRD Section 2.7 - Storage de Avatares e Assets do Usuário
 *
 * Prerequisites:
 * 1. Run migration 20260105000004_user_avatars_bucket.sql first
 * 2. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 * node scripts/migrate-user-avatars.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')

// Buckets
const OLD_BUCKET = 'workspace-assets'
const NEW_BUCKET = 'user-avatars'

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗')
  process.exit(1)
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Extract user ID from avatar file path or name
 * Patterns to match:
 * - avatars/{user_id}-{timestamp}.{ext}
 * - avatars/{user_id}.{ext}
 * - {workspace_id}/avatars/{user_id}-{timestamp}.{ext}
 */
function extractUserIdFromPath(path) {
  // Remove workspace prefix if exists
  const cleanPath = path.replace(/^[a-f0-9-]+\/avatars\//, 'avatars/')

  // Extract filename
  const filename = cleanPath.split('/').pop()

  // Try to extract UUID from filename (user_id is a UUID)
  const uuidMatch = filename.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)

  if (uuidMatch) {
    return uuidMatch[1]
  }

  return null
}

/**
 * Get all users with their current avatar URLs
 */
async function getUserAvatars() {
  const { data: users, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ Error fetching users:', error.message)
    return []
  }

  return users.users
    .filter(user => user.user_metadata?.avatar_url)
    .map(user => ({
      id: user.id,
      email: user.email,
      avatarUrl: user.user_metadata.avatar_url,
    }))
}

/**
 * List all avatar files in workspace-assets bucket
 */
async function listOldAvatars() {
  const { data: files, error } = await supabase.storage
    .from(OLD_BUCKET)
    .list('avatars', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error('❌ Error listing old avatars:', error.message)
    return []
  }

  return files || []
}

/**
 * Download file from old bucket
 */
async function downloadFile(bucket, path) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)

  if (error) {
    throw new Error(`Failed to download ${path}: ${error.message}`)
  }

  return data
}

/**
 * Upload file to new bucket
 */
async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type
    })

  if (error) {
    throw new Error(`Failed to upload ${path}: ${error.message}`)
  }
}

/**
 * Update user's avatar URL in auth metadata
 */
async function updateUserAvatarUrl(userId, newUrl) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { avatar_url: newUrl }
  })

  if (error) {
    throw new Error(`Failed to update user ${userId}: ${error.message}`)
  }
}

/**
 * Main migration function
 */
async function migrateAvatars() {
  console.log('🚀 Starting avatar migration...\n')

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  // Step 1: Get all users with avatars
  console.log('📋 Step 1: Fetching users with avatars...')
  const usersWithAvatars = await getUserAvatars()
  console.log(`   Found ${usersWithAvatars.length} users with avatars\n`)

  // Step 2: List old avatar files
  console.log('📂 Step 2: Listing avatar files in workspace-assets...')
  const oldAvatars = await listOldAvatars()
  console.log(`   Found ${oldAvatars.length} avatar files\n`)

  // Step 3: Migrate each file
  console.log('🔄 Step 3: Migrating avatars...\n')

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const file of oldAvatars) {
    const oldPath = `avatars/${file.name}`
    const userId = extractUserIdFromPath(file.name)

    if (!userId) {
      console.log(`   ⚠️  Skipped: ${file.name} (could not extract user ID)`)
      skipped++
      continue
    }

    // Find user with this avatar
    const user = usersWithAvatars.find(u => u.id === userId)

    if (!user) {
      console.log(`   ⚠️  Skipped: ${file.name} (user not found: ${userId})`)
      skipped++
      continue
    }

    const fileExt = file.name.split('.').pop()
    const newPath = `${userId}/${userId}.${fileExt}`

    try {
      if (!DRY_RUN) {
        // Download from old bucket
        const fileData = await downloadFile(OLD_BUCKET, oldPath)

        // Upload to new bucket
        await uploadFile(NEW_BUCKET, newPath, fileData)

        // Get new public URL
        const { data: { publicUrl } } = supabase.storage
          .from(NEW_BUCKET)
          .getPublicUrl(newPath)

        // Update user metadata
        await updateUserAvatarUrl(userId, publicUrl)
      }

      console.log(`   ✅ Migrated: ${user.email}`)
      console.log(`      ${oldPath} → ${newPath}`)
      migrated++
    } catch (error) {
      console.log(`   ❌ Error: ${user.email} - ${error.message}`)
      errors++
    }
  }

  // Summary
  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Migrated: ${migrated}`)
  console.log(`   ⚠️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📁 Total: ${oldAvatars.length}`)

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.')
  } else {
    console.log('\n✨ Migration completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Verify avatars are accessible in the new bucket')
    console.log('   2. Test avatar upload in the application')
    console.log('   3. After validation, clean up old avatars:')
    console.log('      Run: node scripts/cleanup-old-avatars.js')
  }
}

// Run migration
migrateAvatars().catch(error => {
  console.error('\n💥 Migration failed:', error)
  process.exit(1)
})
