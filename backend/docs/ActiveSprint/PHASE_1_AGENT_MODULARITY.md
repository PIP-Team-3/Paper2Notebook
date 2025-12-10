# Phase 1: Agent Modularity for Multi-Dataset Support

**Status**: 🚧 IN PROGRESS
**Started**: 2025-11-19
**Goal**: Enable end-to-end automation for penalty shootouts (Excel dataset) without manual plan creation

---

## Executive Summary

**Phase A.5 (COMPLETE ✅)**: Built infrastructure for uploading datasets (Supabase storage, upload endpoint, materialization with paper context)

**Phase 1 (IN PROGRESS)**: Make agents smart enough to automatically handle uploaded datasets without manual intervention

**The Problem**: Currently, penalty shootouts requires manual plan creation because:
1. Extractor can't store dataset metadata (`dataset_format="excel"`, `target_column="Win"`)
2. Planner doesn't know about uploaded datasets (only checks static registry)
3. Claims schema missing 4 columns needed for tabular dataset metadata

**The Solution**: Extend claims schema + update agent prompts + add dataset resolver tool

---

## Success Criteria

### Before Phase 1 (Current State):
```
User uploads TextCNN paper
  ↓
Extractor extracts claims automatically ✅
  ↓
Planner creates plan automatically ✅
  ↓
Notebook materialized + executed ✅

User uploads Penalty Shootouts paper + Excel
  ↓
Extractor extracts claims (but can't store dataset metadata) ⚠️
  ↓
Planner rejects (dataset not in registry) ❌
  ↓
MANUAL PLAN CREATION REQUIRED ❌
```

### After Phase 1 (Target State):
```
User uploads TextCNN paper
  ↓
Extractor extracts claims with dataset_format="huggingface" ✅
  ↓
Planner calls dataset_resolver_tool → finds registry ✅
  ↓
Notebook materialized + executed ✅

User uploads Penalty Shootouts paper + Excel
  ↓
Extractor extracts claims with dataset_format="excel", target_column="Win" ✅
  ↓
Planner calls dataset_resolver_tool → finds uploaded dataset ✅
  ↓
Plan created automatically ✅
  ↓
Notebook materialized + executed ✅
```

---

## Implementation Sprints

### **Sprint 1: Database Schema Extension** (1 day)

**Goal**: Add 4 new columns to `claims` table to store dataset metadata

**Files Modified**:
- `backend/sql/migration_phase1_claims_metadata.sql` (NEW)
- `backend/api/app/data/models.py` (ClaimCreate, ClaimRecord)

**Changes**:
1. Run SQL migration on Supabase (see detailed instructions below)
2. Update Pydantic models with new optional fields
3. Verify backward compatibility (existing claims still load)

**Testing**:
- TextCNN regression test (no dataset upload) → MUST PASS
- Query existing claims → verify NULL values for new columns
- Insert new claim with metadata → verify storage works

---

### **Sprint 2: Dataset Resolver Tool** (1 day)

**Goal**: Create tool that checks BOTH registry AND paper uploads

**Files Modified**:
- `backend/api/app/agents/tools/dataset_resolver.py` (NEW)
- `backend/api/app/agents/definitions.py` (register tool)
- `backend/api/app/routers/papers.py` (pass paper_id to planner)

**Implementation**:
1. Create `dataset_resolver_tool(paper_id, dataset_name)` function
2. Check registry first (fast path for TextCNN)
3. Check paper.dataset_storage_path if registry miss
4. Return structured response: `{available, source, format, details}`
5. Register tool in planner agent definition
6. Thread paper_id through planner invocation

**Testing**:
- Call tool with "sst2" → returns `source="registry"` ✅
- Call tool with "penalty_shootouts" + uploaded paper → returns `source="uploaded"` ✅
- Call tool with "unknown" → returns `available=False` ✅

---

### **Sprint 3: Extractor Prompt Update** (0.5 days)

**Goal**: Teach extractor to capture dataset metadata from paper text

**Files Modified**:
- `backend/api/app/agents/definitions.py` (extractor system_prompt)

**Changes**:
- Add instructions to extract `dataset_format` ("huggingface", "excel", "csv", "torchvision")
- Add instructions to extract `target_column` (prediction variable name)
- Add optional `preprocessing_notes` capture
- Add optional `dataset_url` capture (for future auto-download)

**Testing**:
- Run extractor on TextCNN → verify `dataset_format="huggingface"` ✅
- Run extractor on Penalty Shootouts → verify `dataset_format="excel"`, `target_column="Win"` ✅
- Verify claims stored in database with new fields ✅

---

### **Sprint 4: Planner Prompt Update** (0.5 days)

**Goal**: Teach planner to use dataset_resolver_tool and route based on source

**Files Modified**:
- `backend/api/app/agents/definitions.py` (planner system_prompt)

**Changes**:
- Add instructions to call `dataset_resolver_tool` for each dataset in claims
- Add routing logic based on `source: "registry"` vs `source: "uploaded"`
- Add dataset-specific guidance (HuggingFace vs Excel vs CSV)
- Add budget constraints and Phase 2 limitations

**Testing**:
- Run planner with TextCNN claims → verifies registry dataset ✅
- Run planner with Penalty Shootouts claims → verifies uploaded dataset ✅
- Run planner with unknown dataset → rejects or uses synthetic ✅

---

### **Sprint 5: Excel Generator Enhancement** (0.5 days)

**Goal**: Use explicit target column from claims when available

**Files Modified**:
- `backend/api/app/materialize/generators/dataset.py` (ExcelDatasetGenerator)

**Changes**:
- Accept optional `target_column` from plan metadata
- Update heuristics: check plan hint first, then common names, then last column
- Log which detection method was used

**Testing**:
- Generate notebook with explicit target_column → uses it ✅
- Generate notebook without target_column → falls back to heuristics ✅

---

## Detailed Schema Migration Instructions

### **STEP 1: Verify Current Schema**

Run this query in Supabase SQL Editor to see current `claims` table structure:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'claims'
ORDER BY ordinal_position;
```

**Expected Output** (BEFORE migration):
```
column_name       | data_type              | is_nullable | column_default
------------------+------------------------+-------------+-------------------
id                | uuid                   | NO          | gen_random_uuid()
paper_id          | uuid                   | NO          | NULL
dataset_name      | text                   | YES         | NULL
split             | text                   | YES         | NULL
metric_name       | text                   | NO          | NULL
metric_value      | numeric                | NO          | NULL
units             | text                   | YES         | NULL
method_snippet    | text                   | YES         | NULL
source_citation   | text                   | NO          | NULL
confidence        | numeric                | NO          | NULL
created_by        | uuid                   | YES         | NULL
created_at        | timestamp with time zone| NO         | now()
```

---

### **STEP 2: Run Migration SQL**

**⚠️ IMPORTANT SAFETY CHECKS**:
1. **Backup first**: Export claims table from Supabase (Table Editor → Export → CSV)
2. **Test on staging**: If you have a staging database, run migration there first
3. **Check row count**: `SELECT COUNT(*) FROM claims;` (should be same before/after)
4. **Verify no active writes**: Ensure no extraction jobs running during migration

**Migration SQL** (copy-paste into Supabase SQL Editor):

```sql
-- =============================================================================
-- Phase 1: Claims Schema Extension for Dataset Metadata
-- =============================================================================
-- Purpose: Add 4 new columns to store extractor-captured dataset metadata
-- Date: 2025-11-19
-- Safety: All columns are nullable (backward compatible)
-- =============================================================================

BEGIN;

-- Add new columns (all nullable for backward compatibility)
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS dataset_format text,
ADD COLUMN IF NOT EXISTS target_column text,
ADD COLUMN IF NOT EXISTS preprocessing_notes text,
ADD COLUMN IF NOT EXISTS dataset_url text;

-- Add comments for documentation
COMMENT ON COLUMN claims.dataset_format IS
  'Dataset type: "huggingface", "excel", "csv", "torchvision", "sklearn", or "unknown"';

COMMENT ON COLUMN claims.target_column IS
  'Name of the prediction target column (e.g., "Win", "sentiment", "default")';

COMMENT ON COLUMN claims.preprocessing_notes IS
  'Optional preprocessing hints extracted from paper (e.g., "categorical encoding needed")';

COMMENT ON COLUMN claims.dataset_url IS
  'Optional dataset download URL from paper (for future auto-download feature)';

-- Verify migration
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'claims'
    AND column_name IN ('dataset_format', 'target_column', 'preprocessing_notes', 'dataset_url')
ORDER BY column_name;

-- Should return 4 rows with is_nullable = YES

COMMIT;

-- Final verification: Check existing claims still load correctly
SELECT id, paper_id, dataset_name, metric_name, dataset_format, target_column
FROM claims
LIMIT 5;

-- New columns should be NULL for existing claims
```

**Expected Output**:
```
Migration successful!

column_name          | data_type | is_nullable
---------------------+-----------+-------------
dataset_format       | text      | YES
dataset_url          | text      | YES
preprocessing_notes  | text      | YES
target_column        | text      | YES
```

---

### **STEP 3: Verify Migration Didn't Break Anything**

Run these verification queries:

```sql
-- 1. Check row count (should be same as before)
SELECT COUNT(*) FROM claims;

-- 2. Check existing claims still have all original data
SELECT
    id,
    paper_id,
    dataset_name,
    metric_name,
    metric_value,
    source_citation,
    confidence,
    -- New columns (should be NULL)
    dataset_format,
    target_column
FROM claims
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verify indexes still exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'claims';

-- Expected: claims_paper_id_idx, claims_confidence_idx, claims_pkey
```

---

### **STEP 4: Update Pydantic Models**

**File**: `backend/api/app/data/models.py`

**Change** (lines 38-54):

```python
class ClaimCreate(BaseModel):
    """Model for creating a claim record in the database."""
    paper_id: str
    dataset_name: Optional[str] = None
    split: Optional[str] = None
    metric_name: str
    metric_value: float
    units: Optional[str] = None
    method_snippet: Optional[str] = None
    source_citation: str
    confidence: float = Field(ge=0.0, le=1.0)
    created_by: Optional[str] = None
    created_at: datetime

    # Phase 1: Dataset metadata fields (NEW)
    dataset_format: Optional[str] = None       # "huggingface", "excel", "csv", etc.
    target_column: Optional[str] = None        # "Win", "sentiment", "default"
    preprocessing_notes: Optional[str] = None  # Free text preprocessing hints
    dataset_url: Optional[str] = None          # Optional download URL

    model_config = {
        "extra": "ignore",
    }
```

**Why Safe**:
- All new fields are `Optional[str] = None`
- Existing code that creates `ClaimCreate` objects without new fields → still works
- Database columns are nullable → no constraint violations
- `extra: "ignore"` config → old database rows (missing new fields) load fine

---

### **STEP 5: Rollback Plan (If Something Goes Wrong)**

If migration causes issues, rollback with:

```sql
BEGIN;

-- Remove new columns
ALTER TABLE claims
DROP COLUMN IF EXISTS dataset_format,
DROP COLUMN IF EXISTS target_column,
DROP COLUMN IF EXISTS preprocessing_notes,
DROP COLUMN IF EXISTS dataset_url;

-- Verify rollback
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'claims'
    AND column_name IN ('dataset_format', 'target_column', 'preprocessing_notes', 'dataset_url');

-- Should return 0 rows

COMMIT;
```

Then revert code changes:
```bash
git checkout backend/api/app/data/models.py
```

---

## Testing Checklist

### **After Sprint 1 (Schema Migration)**:
- [ ] Run migration SQL in Supabase ✅
- [ ] Verify 4 new columns added ✅
- [ ] Check row count unchanged ✅
- [ ] Update Pydantic models ✅
- [ ] Restart backend server ✅
- [ ] Run TextCNN regression test → MUST PASS ✅
- [ ] Query existing claims → verify NULL for new columns ✅

### **After Sprint 2 (Dataset Resolver Tool)**:
- [ ] Create `dataset_resolver.py` tool ✅
- [ ] Register tool in agent definitions ✅
- [ ] Unit test: call tool with "sst2" → returns registry ✅
- [ ] Unit test: call tool with uploaded dataset → returns uploaded ✅
- [ ] Integration test: planner receives paper_id ✅
- [ ] TextCNN regression test → MUST PASS ✅

### **After Sprint 3 (Extractor Prompt)**:
- [ ] Update extractor system prompt ✅
- [ ] Run extraction on TextCNN → verify dataset_format captured ✅
- [ ] Run extraction on Penalty Shootouts → verify target_column captured ✅
- [ ] Verify claims saved to database with new fields ✅
- [ ] TextCNN regression test → MUST PASS ✅

### **After Sprint 4 (Planner Prompt)**:
- [ ] Update planner system prompt ✅
- [ ] Test planning with TextCNN claims → uses registry ✅
- [ ] Test planning with Penalty Shootouts claims → uses uploaded ✅
- [ ] Verify plan JSON includes correct dataset metadata ✅
- [ ] TextCNN regression test → MUST PASS ✅

### **After Sprint 5 (Excel Generator)**:
- [ ] Update ExcelDatasetGenerator target detection ✅
- [ ] Test with explicit target_column → uses it ✅
- [ ] Test without target_column → uses heuristics ✅
- [ ] TextCNN regression test → MUST PASS ✅
- [ ] **FULL PENALTY SHOOTOUTS TEST** → MUST PASS ✅

---

## Backward Compatibility Guarantees

### **Database Changes**:
✅ All new columns are `NULL`-able → existing rows load fine
✅ No constraints added → no data validation failures
✅ No indexes added → no performance impact
✅ Rollback SQL provided → can undo migration safely

### **Code Changes**:
✅ All new Pydantic fields are `Optional` → old callers still work
✅ `extra: "ignore"` config → old database rows load without errors
✅ No changes to existing function signatures → no breaking changes
✅ New tool is additive → planner can ignore it if not called

### **Regression Testing**:
✅ TextCNN test runs after EVERY sprint → catches breaks immediately
✅ Existing claims load and display correctly
✅ Papers without uploaded datasets still work
✅ Materialization without paper context still works

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Schema migration breaks existing claims queries | HIGH | LOW | All columns nullable, Pydantic extra="ignore", tested rollback plan |
| Extractor fails to extract new metadata | MEDIUM | MEDIUM | Fields are optional, fallback to NULL/unknown values |
| Planner rejects uploaded datasets | HIGH | LOW | Tool tested independently, prompt provides clear examples |
| Dataset name matching ambiguity | MEDIUM | MEDIUM | Normalize names, log warnings, allow user override (future) |
| TextCNN regression breaks | HIGH | LOW | Run regression test after each sprint, revert if fails |

---

## Timeline Estimate

| Sprint | Estimated Time | Cumulative |
|--------|---------------|------------|
| Sprint 1: Schema Migration | 1 day | 1 day |
| Sprint 2: Dataset Resolver Tool | 1 day | 2 days |
| Sprint 3: Extractor Prompt | 0.5 days | 2.5 days |
| Sprint 4: Planner Prompt | 0.5 days | 3 days |
| Sprint 5: Excel Generator | 0.5 days | 3.5 days |
| Testing & Documentation | 0.5 days | 4 days |

**Total**: ~4 days (1 week with buffer)

---

## Next Steps After Phase 1

1. **Test with 3rd Paper** (Credit Card CSV) → verify modularity works
2. **Frontend Integration** (Phase C) → dataset selection UI
3. **Planner Reliability** (Phase 2) → improve tabular dataset guidance
4. **Sandbox DATASET_URL Injection** (Phase 2) → fresh signed URLs at runtime
5. **Auto-Download from URLs** (Phase 3) → no manual uploads needed

---

## Notes

- **Focus on Modularity**: No hardcoding for specific papers
- **Backward Compatibility**: TextCNN must work after every change
- **User Empowerment**: Goal is user-driven pipeline without developer help
- **Phase 2 Constraints**: sklearn baselines only (no real PyTorch models yet)
