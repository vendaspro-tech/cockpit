-- Migration: Add versioning system to test_structures
-- Date: 2025-01-01
-- Description: Adds version control fields and removes unique constraint on test_type
--              to allow multiple versions of the same test type

-- First, rename the old version column if it exists (it's TEXT type)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_structures'
    AND column_name = 'version'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE test_structures RENAME COLUMN version TO version_old;
  END IF;
END $$;

-- Add versioning fields to test_structures
ALTER TABLE test_structures
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS parent_structure_id UUID REFERENCES test_structures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS changelog TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Drop the unique constraint on test_type to allow multiple versions
-- First, check if the constraint exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_structures_test_type_key'
  ) THEN
    ALTER TABLE test_structures DROP CONSTRAINT test_structures_test_type_key;
  END IF;
END $$;

-- Create a unique partial index to ensure only one active version per test_type
CREATE UNIQUE INDEX IF NOT EXISTS test_structures_active_version_unique
  ON test_structures (test_type)
  WHERE is_active = true;

-- Add index for better query performance on version-related queries
CREATE INDEX IF NOT EXISTS test_structures_parent_structure_id_idx
  ON test_structures(parent_structure_id);

CREATE INDEX IF NOT EXISTS test_structures_version_idx
  ON test_structures(test_type, version DESC);

CREATE INDEX IF NOT EXISTS test_structures_created_by_idx
  ON test_structures(created_by);

-- Add comment for documentation
COMMENT ON COLUMN test_structures.version IS 'Version number of this test structure (incremental per test_type)';
COMMENT ON COLUMN test_structures.is_active IS 'Whether this version is currently active (only one active per test_type)';
COMMENT ON COLUMN test_structures.parent_structure_id IS 'Reference to parent version for tracking version history';
COMMENT ON COLUMN test_structures.changelog IS 'Description of changes made in this version';
COMMENT ON COLUMN test_structures.published_at IS 'Timestamp when this version was published/activated';
COMMENT ON COLUMN test_structures.created_by IS 'User who created this version';

-- Update existing records to have version 1 and is_active true
-- The new version column will have default value 1 from the ADD COLUMN statement
UPDATE test_structures
SET
  is_active = true,
  published_at = COALESCE(published_at, NOW()),
  changelog = COALESCE(changelog, 'Versão inicial migrada de ' || COALESCE(version_old, 'sistema antigo'))
WHERE published_at IS NULL;

-- Drop the old version column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_structures'
    AND column_name = 'version_old'
  ) THEN
    ALTER TABLE test_structures DROP COLUMN version_old;
  END IF;
END $$;
