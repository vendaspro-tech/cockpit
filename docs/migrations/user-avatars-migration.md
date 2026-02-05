# User Avatars Migration Guide

**Related PRD:** [Section 2.7 - Storage de Avatares e Assets do Usuário](../prd/2025-01-01-refatoracao-cargos-e-competencias.md#27-storage-de-avatares-e-assets-do-usuário)

## Overview

This migration moves user avatars from a workspace-scoped bucket to a global user bucket structure.

### Problem (Before)

```
workspace-assets/
└── {workspace_id}/
    └── avatars/
        └── {user_id}.jpg
```

**Issues:**
- Same avatar duplicated across workspaces
- Storage waste
- Inconsistency when updating
- User can be in multiple workspaces

### Solution (After)

```
user-avatars/
└── {user_id}/
    └── {filename}.jpg
```

**Benefits:**
- Single, global avatar per user
- User maintains same photo across all workspaces
- Updates reflect everywhere
- Better organization

---

## Migration Steps

### 1. Apply Database Migration

Run the migration to create the new bucket and RLS policies:

```bash
# Push the migration to Supabase
supabase db push

# Or apply directly
psql $DATABASE_URL -f supabase/migrations/20260105000004_user_avatars_bucket.sql
```

This creates:
- ✅ `user-avatars` bucket (public read, restricted write)
- ✅ RLS policies (users can only manage their own avatars)
- ✅ 5MB file size limit
- ✅ Allowed MIME types for images

### 2. Migrate Existing Avatars

⚠️ **Before running, ensure you have:**
- `NEXT_PUBLIC_SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` environment variable

#### Dry Run (Test First)

```bash
node scripts/migrate-user-avatars.js --dry-run
```

This will:
- List all avatars to be migrated
- Show what would happen
- Not make any changes

#### Run Migration

```bash
node scripts/migrate-user-avatars.js
```

This will:
- Copy avatars from `workspace-assets` to `user-avatars`
- Update user metadata with new URLs
- Preserve original files (non-destructive)

**Output Example:**
```
🚀 Starting avatar migration...

📋 Step 1: Fetching users with avatars...
   Found 15 users with avatars

📂 Step 2: Listing avatar files in workspace-assets...
   Found 20 avatar files

🔄 Step 3: Migrating avatars...

   ✅ Migrated: user@example.com
      avatars/abc-123.jpg → abc-123/abc-123.jpg
   ...

📊 Migration Summary:
   ✅ Migrated: 15
   ⚠️  Skipped: 5
   ❌ Errors: 0
   📁 Total: 20
```

### 3. Verify Migration

After migration, verify that:

1. **Avatars are accessible:**
   - Check user profiles in the application
   - Verify images load correctly
   - Test in multiple workspaces (same user should have same avatar)

2. **New uploads work:**
   - Go to Settings > Account
   - Upload a new avatar
   - Verify it saves to `user-avatars` bucket

3. **RLS policies work:**
   - Users can only upload their own avatars
   - Public can view all avatars

### 4. Cleanup Old Avatars (Optional)

⚠️ **Only after verifying migration was successful!**

#### Dry Run

```bash
node scripts/cleanup-old-avatars.js --dry-run
```

#### Cleanup

```bash
# Interactive (asks for confirmation)
node scripts/cleanup-old-avatars.js

# Auto-confirm (no prompt)
node scripts/cleanup-old-avatars.js --confirm
```

This will:
- Delete old avatars from `workspace-assets/avatars/`
- Free up storage space
- **Cannot be undone!**

---

## Technical Details

### New Bucket Configuration

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);
```

### RLS Policies

**Read (Public):**
```sql
-- Anyone can view avatars
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

**Write (Restricted):**
```sql
-- Users can only upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Code Changes

**Before (account-settings.tsx):**
```typescript
const filePath = `avatars/${fileName}`
const { error } = await supabase.storage
  .from('workspace-assets')
  .upload(filePath, file)
```

**After (account-settings.tsx):**
```typescript
const filePath = `${userData.id}/${fileName}`
const { error } = await supabase.storage
  .from('user-avatars')
  .upload(filePath, file)
```

---

## Rollback Plan

If issues occur, you can rollback:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Keep old bucket active:**
   - Old avatars remain in `workspace-assets`
   - Users with old URLs will continue working

3. **Delete new bucket (if needed):**
   ```sql
   DELETE FROM storage.buckets WHERE id = 'user-avatars';
   ```

---

## Troubleshooting

### Issue: "Bucket not found"

**Solution:** Run the migration first:
```bash
supabase db push
```

### Issue: "Permission denied"

**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY`

**Solution:** Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Issue: Avatar doesn't load after migration

**Cause:** URL cached in browser or CDN

**Solutions:**
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Wait for CDN cache to expire (~1 hour)

### Issue: User can't upload avatar

**Cause:** RLS policy not applied or incorrect user ID

**Solutions:**
1. Check policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```
2. Verify user is authenticated
3. Check browser console for errors

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Old avatars still work (before cleanup)
- [ ] New avatars appear in `user-avatars` bucket
- [ ] Avatar URLs updated in user metadata
- [ ] Avatar displays correctly in UI
- [ ] Upload new avatar works
- [ ] User can only upload to their own folder
- [ ] Public can view all avatars
- [ ] Same user has same avatar across workspaces
- [ ] Cleanup script removes old avatars (after validation)

---

## Support

If you encounter issues:

1. Check the [PRD Section 2.7](../prd/2025-01-01-refatoracao-cargos-e-competencias.md#27-storage-de-avatares-e-assets-do-usuário)
2. Review migration logs
3. Verify environment variables are set
4. Check Supabase dashboard for bucket and policies
