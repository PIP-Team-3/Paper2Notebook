-- =============================================================================
-- Phase 1: Claims Schema Extension for Dataset Metadata
-- =============================================================================
-- Purpose: Add 4 new columns to store extractor-captured dataset metadata
-- Date: 2025-11-19
-- Author: P2N Team
-- Safety: All columns are nullable (backward compatible with existing claims)
--
-- What This Enables:
-- - Extractor can store dataset_format ("huggingface", "excel", "csv", etc.)
-- - Extractor can store target_column ("Win", "sentiment", "default", etc.)
-- - Planner can make intelligent routing decisions based on dataset type
-- - Generator can use explicit target column hints from claims
--
-- Rollback: See ROLLBACK section at bottom of file
-- =============================================================================

-- =============================================================================
-- PRE-MIGRATION VERIFICATION
-- =============================================================================

-- Check current schema (run before migration)
SELECT
    'PRE-MIGRATION: Current claims table structure' AS status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'claims'
ORDER BY ordinal_position;

-- Check row count (should be same after migration)
SELECT 'PRE-MIGRATION: Row count' AS status, COUNT(*) AS total_claims FROM claims;

-- =============================================================================
-- MIGRATION
-- =============================================================================

BEGIN;

-- Add new columns (all nullable for backward compatibility)
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS dataset_format text,
ADD COLUMN IF NOT EXISTS target_column text,
ADD COLUMN IF NOT EXISTS preprocessing_notes text,
ADD COLUMN IF NOT EXISTS dataset_url text;

-- Add column comments for documentation
COMMENT ON COLUMN claims.dataset_format IS
  'Dataset type extracted from paper: "huggingface", "excel", "csv", "torchvision", "sklearn", or "unknown". Used by planner to route to correct generator.';

COMMENT ON COLUMN claims.target_column IS
  'Name of the prediction target column extracted from paper (e.g., "Win", "sentiment", "default"). Used by ExcelDatasetGenerator for target detection.';

COMMENT ON COLUMN claims.preprocessing_notes IS
  'Optional preprocessing hints extracted from paper methodology (e.g., "categorical encoding needed", "normalize features"). Free-text field for future use.';

COMMENT ON COLUMN claims.dataset_url IS
  'Optional dataset download URL extracted from paper (e.g., UCI ML Repository link). For future auto-download feature (Phase 3).';

-- Verify columns were added
SELECT
    'POST-MIGRATION: New columns added' AS status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'claims'
    AND column_name IN ('dataset_format', 'target_column', 'preprocessing_notes', 'dataset_url')
ORDER BY column_name;

-- Should return 4 rows with is_nullable = YES

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================

-- Verify row count unchanged
SELECT 'POST-MIGRATION: Row count' AS status, COUNT(*) AS total_claims FROM claims;

-- Check existing claims still load correctly (new columns should be NULL)
SELECT
    'POST-MIGRATION: Sample existing claims' AS status,
    id,
    paper_id,
    dataset_name,
    metric_name,
    metric_value,
    -- New columns (should be NULL for existing claims)
    dataset_format,
    target_column
FROM claims
ORDER BY created_at DESC
LIMIT 5;

-- Verify indexes still exist (should be unchanged)
SELECT
    'POST-MIGRATION: Index verification' AS status,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'claims'
ORDER BY indexname;

-- Expected indexes:
-- - claims_pkey (primary key on id)
-- - claims_paper_id_idx (index on paper_id)
-- - claims_confidence_idx (index on confidence DESC)

-- =============================================================================
-- TEST: Insert new claim with metadata
-- =============================================================================

-- Test inserting a claim with new fields (optional - comment out if not testing)
/*
INSERT INTO claims (
    paper_id,
    dataset_name,
    split,
    metric_name,
    metric_value,
    units,
    method_snippet,
    source_citation,
    confidence,
    dataset_format,
    target_column,
    preprocessing_notes,
    dataset_url
) VALUES (
    '00000000-0000-0000-0000-000000000000',  -- Replace with real paper_id
    'penalty_shootouts',
    'full',
    'accuracy',
    0.65,
    '%',
    'LogisticRegression baseline',
    'Table 2, page 8',
    0.95,
    'excel',
    'Win',
    'categorical encoding for team names',
    'https://www.aeaweb.org/articles?id=10.1257/aer.100.4.1687'
)
RETURNING id, dataset_name, dataset_format, target_column;

-- Clean up test claim (comment out if you want to keep it)
DELETE FROM claims WHERE paper_id = '00000000-0000-0000-0000-000000000000';
*/

-- =============================================================================
-- ROLLBACK (Run this if migration causes issues)
-- =============================================================================

/*
BEGIN;

-- Remove new columns
ALTER TABLE claims
DROP COLUMN IF EXISTS dataset_format,
DROP COLUMN IF EXISTS target_column,
DROP COLUMN IF EXISTS preprocessing_notes,
DROP COLUMN IF EXISTS dataset_url;

-- Verify rollback
SELECT
    'ROLLBACK: Columns removed' AS status,
    column_name
FROM information_schema.columns
WHERE table_name = 'claims'
    AND column_name IN ('dataset_format', 'target_column', 'preprocessing_notes', 'dataset_url');

-- Should return 0 rows

COMMIT;

-- After rollback, also revert code changes:
-- git checkout backend/api/app/data/models.py
*/

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

SELECT 'MIGRATION COMPLETE ✅' AS status,
       'Run backend tests and TextCNN regression test to verify backward compatibility' AS next_steps;
