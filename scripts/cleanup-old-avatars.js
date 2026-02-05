/**
 * Cleanup Script: Remove Old Avatars
 *
 * This script removes old avatars from workspace-assets/avatars/*
 * after successful migration to user-avatars bucket.
 *
 * ⚠️ WARNING: This is a destructive operation!
 * Only run this after verifying the migration was successful.
 *
 * Prerequisites:
 * 1. Run migrate-user-avatars.js first
 * 2. Verify all avatars work in the new bucket
 * 3. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 * node scripts/cleanup-old-avatars.js [--dry-run] [--confirm]
 */

const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')
const AUTO_CONFIRM = process.argv.includes('--confirm')

// Buckets
const OLD_BUCKET = 'workspace-assets'

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
 * Delete files from storage
 */
async function deleteFiles(bucket, paths) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`)
  }
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Main cleanup function
 */
async function cleanupOldAvatars() {
  console.log('🧹 Starting old avatars cleanup...\n')

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n')
  }

  // Step 1: List old avatar files
  console.log('📂 Step 1: Listing avatar files in workspace-assets...')
  const oldAvatars = await listOldAvatars()
  console.log(`   Found ${oldAvatars.length} avatar files\n`)

  if (oldAvatars.length === 0) {
    console.log('✨ No old avatars to clean up!')
    return
  }

  // Step 2: Display files to be deleted
  console.log('📋 Files to be deleted:')
  oldAvatars.forEach(file => {
    console.log(`   - avatars/${file.name}`)
  })
  console.log('')

  // Step 3: Confirmation (unless auto-confirmed or dry-run)
  if (!DRY_RUN && !AUTO_CONFIRM) {
    console.log('⚠️  WARNING: This action cannot be undone!')
    console.log('   Make sure you have verified that all avatars work in the new bucket.\n')

    const confirmed = await promptConfirmation('Are you sure you want to delete these files?')

    if (!confirmed) {
      console.log('\n❌ Cleanup cancelled by user.')
      return
    }
  }

  // Step 4: Delete files
  console.log('\n🗑️  Step 2: Deleting old avatars...\n')

  if (!DRY_RUN) {
    try {
      const paths = oldAvatars.map(file => `avatars/${file.name}`)
      await deleteFiles(OLD_BUCKET, paths)
      console.log(`   ✅ Deleted ${oldAvatars.length} files`)
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      process.exit(1)
    }
  } else {
    console.log(`   🔍 Would delete ${oldAvatars.length} files`)
  }

  // Summary
  console.log('\n📊 Cleanup Summary:')
  console.log(`   🗑️  Files deleted: ${DRY_RUN ? 0 : oldAvatars.length}`)
  console.log(`   📁 Total processed: ${oldAvatars.length}`)

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to delete files.')
  } else {
    console.log('\n✨ Cleanup completed!')
  }
}

// Run cleanup
cleanupOldAvatars().catch(error => {
  console.error('\n💥 Cleanup failed:', error)
  process.exit(1)
})
