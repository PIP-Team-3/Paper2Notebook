# Phase 1 Testing Analysis & Fix Strategy

**Date**: 2025-11-19
**Status**: ⚠️ **BLOCKED** - Dataset upload metadata not saved to database
**Updated**: 2025-11-19 21:00 - Identified root cause

---

## 🚨 CURRENT BLOCKER

**Issue**: Plan generation fails with "E_PLAN_NO_ALLOWED_DATASETS"

**Root Cause (CONFIRMED)**: **Dataset name mismatch** between extractor and uploaded file

**Evidence from database (VERIFIED 2025-11-20)**:
- ✅ `papers` table HAS the 3 dataset columns (`dataset_storage_path`, `dataset_format`, `dataset_original_filename`)
- ✅ Columns are POPULATED for paper ID `19bd124a-2f1c-48dd-a7fb-71f86b4239a2`
- ✅ Upload infrastructure (Phase A.5) is working correctly

**The Name Mismatch Problem**:
```
Extractor captured:     "Penalty Shoot-out Dataset"  (from paper text)
Uploaded filename:      "AER20081092_Data.xls"
Filename stem:          "AER20081092_Data"

Normalized extractor:   "penalty_shoot_out_dataset"
Normalized filename:    "aer20081092_data"

❌ THESE DON'T MATCH!
```

Our `classify_dataset()` checks:
```python
if normalized_uploaded == normalized_query:  # FALSE!
    return RESOLVED
```

**Server logs confirm this**:
```
planner.resolution.non_resolved dataset=Penalty Shoot-out Dataset status=unknown
  reason=Dataset not found in registry
```

No `dataset_resolution.resolved_upload` log = Step 3.5 check failed due to name mismatch

---

## 🔧 SOLUTION OPTIONS

### Option 1: Always Match Uploaded Dataset (SIMPLEST)
**Logic**: If paper has `dataset_storage_path`, consider it RESOLVED regardless of name
```python
# Step 3.5: Check paper uploads (Phase 1)
if paper and paper.dataset_storage_path:
    logger.info(
        "dataset_resolution.resolved_upload paper_id=%s filename=%s",
        paper.id,
        paper.dataset_original_filename
    )
    return DatasetResolutionResult(
        status=ResolutionStatus.RESOLVED,
        dataset_name=dataset_name,
        canonical_name=dataset_name,  # Use extractor's name
        reason=f"Dataset uploaded with paper: {paper.dataset_original_filename}",
        metadata={"source": "uploaded", "format": paper.dataset_format}
    )
```

**Pros**:
- Simple, always works
- User uploaded dataset with THIS paper → must be the right one
- Handles any naming convention

**Cons**:
- If user uploads multiple papers with datasets, might match wrong one
- No validation that extractor found the right dataset name

---

### Option 2: Fuzzy Name Matching (MORE ROBUST)
**Logic**: Check if normalized names are "similar enough" (substring match, edit distance)
```python
if paper and paper.dataset_storage_path:
    uploaded_stem = Path(paper.dataset_original_filename or "").stem
    normalized_uploaded = normalize_dataset_name(uploaded_stem)
    normalized_query = normalize_dataset_name(dataset_name)

    # Try exact match first
    if normalized_uploaded == normalized_query:
        return RESOLVED

    # Try substring match (either direction)
    if normalized_uploaded in normalized_query or normalized_query in normalized_uploaded:
        logger.info("dataset_resolution.fuzzy_match uploaded=%s query=%s",
                   normalized_uploaded, normalized_query)
        return RESOLVED

    # Try word overlap (e.g., "penalty" in both)
    uploaded_words = set(normalized_uploaded.split('_'))
    query_words = set(normalized_query.split('_'))
    overlap = uploaded_words & query_words
    if len(overlap) >= 2:  # At least 2 common words
        logger.info("dataset_resolution.word_overlap words=%s", overlap)
        return RESOLVED
```

**Pros**:
- More intelligent matching
- Catches common patterns (abbreviations, reordering)

**Cons**:
- More complex logic
- False positives possible

---

### Option 3: Store Claim-to-Upload Mapping (CLEANEST)
**Logic**: When user uploads dataset with paper, store this association in claims table
```python
# In papers.py ingest endpoint, AFTER dataset upload:
if dataset_storage_path and existing_claims:
    # Update all claims for this paper to mark dataset as uploaded
    for claim in existing_claims:
        if claim.dataset_name:  # Has a dataset reference
            db.update_claim(
                claim_id=claim.id,
                dataset_uploaded_with_paper=True  # NEW COLUMN in claims table
            )
```

**Pros**:
- Explicit, no guessing
- Works for papers with multiple datasets

**Cons**:
- Requires new database column
- Claims might not exist yet during upload (extraction happens after)

---

## ⚠️ CRITICAL SAFETY NOTE

**DO NOT remove the name matching guard!**

Matching every uploaded dataset unconditionally would allow a paper with an unrelated upload to accidentally satisfy a different claim. The filename stem comparison is the safety guard that prevents wrong matches.

The issue isn't the guard itself - **it's that the guard never fires**.

---

## 🔍 DIAGNOSTIC APPROACH (CORRECT)

### What's Actually Blocking Us

Two possibilities:
1. **Data not populated**: Supabase record doesn't have `dataset_storage_path`/`dataset_format`/`dataset_original_filename`
2. **Normalization mismatch**: Filename stem doesn't match claim dataset name after normalization

### Diagnostic Steps

#### Step 1: Add Debug Logging (DONE)
Added comprehensive logging in `dataset_resolution.py` Step 3.5:
- Log paper_id
- Log query (raw claim dataset name)
- Log normalized_query
- Log uploaded_filename
- Log uploaded_stem
- Log normalized_uploaded
- Log match result (True/False)

This will tell us **exactly why the match is failing**.

#### Step 2: Restart Server & Retest
```bash
# Server restarted with new logging
# Now retest plan generation
```

#### Step 3: Analyze Logs
Look for `dataset_resolution.upload_check` log entry to see:
```
dataset_resolution.upload_check paper_id=... query="Penalty Shoot-out Dataset"
  normalized_query="penalty_shoot_out_dataset" uploaded_filename="AER20081092_Data.xls"
  uploaded_stem="AER20081092_Data" normalized_uploaded="aer20081092_data" match=False
```

This confirms the normalization mismatch.

#### Step 4: Fix Based on Data

**If dataset columns are NULL**:
- Bug in upload endpoint (didn't save metadata)
- Fix: Ensure `db.insert_paper()` saves dataset fields

**If normalization doesn't match**:
- Current matching: exact match only
- Options:
  - Substring matching ("penalty" in both)
  - Word overlap (≥2 common words)
  - Fuzzy matching (edit distance)
  - Multiple upload support (allow user to label uploads)

---

## RECOMMENDED SOLUTION: Diagnose First, Then Fix

**Step 1**: Look at server logs after retry
**Step 2**: Confirm whether it's data issue or matching issue
**Step 3**: Apply appropriate fix (don't blindly remove safety guards)

---

## What We've Completed So Far

### ✅ Sprint 1: Database Schema (COMPLETE)
**Commit**: 47e6dd4
- Added 4 nullable columns to `claims` table via Supabase UI
- Updated `ClaimCreate` and `ClaimRecord` models in `models.py`
- Fields: `dataset_format`, `target_column`, `preprocessing_notes`, `dataset_url`
- All backward compatible (nullable, Optional)

### ✅ Sprint 3: Extractor Enhancement (COMPLETE)
**Commits**: b68f8b0, da6e4ca
- Updated `ExtractedClaimModel` Pydantic schema (schemas.py)
- Updated `ExtractedClaim` dataclass (types.py)
- Enhanced extractor prompt to capture metadata
- Updated claim creation in papers.py to map fields
- **VERIFIED**: Extractor successfully captured metadata in test

### ✅ Phase A.5: Upload Infrastructure (COMPLETE - Pre-existing)
- Upload endpoint accepts `dataset_file` parameter
- Stores dataset in Supabase storage
- Saves metadata to `papers` table (`dataset_storage_path`, `dataset_format`, `dataset_original_filename`)
- Materialization downloads from storage with paper context

---

## Test Results

### Test 1: Server Health ✅
```bash
curl http://localhost:8000/health
# {"status":"ok","tracing_enabled":true}
```

### Test 2: Upload Paper + Dataset ✅
```bash
curl -X POST "http://localhost:8000/api/v1/papers/ingest" \
  -F "file=@Soccer Paper/2010-psychological-pressure...pdf" \
  -F "dataset_file=@Soccer Paper/20081092_data/AER20081092_Data.xls" \
  -F "title=Psychological Pressure in Penalty Shootouts"

# Response:
{
  "paper_id": "19bd124a-2f1c-48dd-a7fb-71f86b4239a2",
  "vector_store_id": "vs_691e16a74c8081918a5e66beecbd91db",
  "storage_path": "papers/dev/2025/11/19/19bd124a-2f1c-48dd-a7fb-71f86b4239a2.pdf",
  "dataset_uploaded": true  ← SUCCESS
}
```

### Test 3: Extraction with Metadata ✅
```bash
curl -X POST "http://localhost:8000/api/v1/papers/19bd124a-2f1c-48dd-a7fb-71f86b4239a2/extract"

# Server logs show:
DEBUG CAPTURED JSON: {
  "claims": [{
    "dataset_name": "Penalty Shoot-out Dataset",
    "dataset_format": "unknown",  ← Captured!
    "target_column": "Winning Team",  ← Captured!
    ...
  }]
}

# Event stream:
event: stage_update
data: {"agent": "extractor", "stage": "persist_done", "count": 1}  ← Saved to DB
```

**Note**: Extractor marked format as "unknown" because paper doesn't explicitly mention ".xls" or ".xlsx"

### Test 4: Plan Generation ❌ FAILED
```bash
curl -X POST "http://localhost:8000/api/v1/papers/19bd124a-2f1c-48dd-a7fb-71f86b4239a2/plan" \
  -H "Content-Type: application/json" \
  -d '{"claims": [{"id": "3af5d6cb-...", ...}], "budget_minutes": 20}'

# Response:
{
  "detail": {
    "code": "E_PLAN_NO_ALLOWED_DATASETS",
    "message": "No allowed datasets in plan after sanitization"
  }
}

# Server logs show:
planner.resolution.non_resolved dataset=Penalty Shoot-out Dataset status=unknown
  reason=Dataset not found in registry
sanitizer.dataset.unknown name=Penalty Shoot-out Dataset
planner.sanitize.failed error=No allowed datasets in plan after sanitization
```

---

## Root Cause Analysis

### The Problem

The **planner route has Python code that checks dataset availability AFTER the LLM runs**, and this Python code **only checks the static registry** - it doesn't know about uploaded datasets.

### Architecture Flow (Current)

```
User requests plan
  ↓
plans.py:create_plan() invoked
  ↓
LLM planner agent runs (lines 289-547)
  ├─ Has dataset_resolver TOOL available
  ├─ Prompt tells it to call tool
  └─ But... it doesn't call it (logs show no tool calls)
  ↓
LLM returns plan_raw dict
  ↓
Python post-processing (lines 567-609):
  ↓
  resolve_dataset_for_plan(plan_dict, registry, blocked_list)
    ↓
    classify_dataset(dataset_name, registry, blocked_list)
      ↓
      Checks: blocked → registry → complexity → UNKNOWN ❌
      (Never checks paper uploads!)
  ↓
Sanitizer sees "unknown" dataset → REJECTS plan
```

### Why Didn't the LLM Call dataset_resolver?

Looking at the logs:
```
planner.tool_only_path paper_id=... function_calls=39 synthesizing_prose=true
```

The planner made 39 function calls, but none to `dataset_resolver`. Why?

**Hypothesis**: The LLM might have called other tools (license_checker, budget_estimator) but skipped dataset_resolver because:
1. It already had the dataset name from the claim
2. The prompt might not be strong enough
3. OR the LLM decided the dataset was unavailable and moved on

---

## The Two Approaches

### Approach A: Fix Python Resolution Code (SAFER)
**Change**: Update `classify_dataset()` to check paper uploads

**Pros**:
- Works regardless of whether LLM calls the tool
- Failsafe - catches datasets even if LLM doesn't check
- Mirrors what dataset_resolver tool does
- Minimal change - just add one check

**Cons**:
- Duplicates logic (tool + Python both check uploads)
- Requires passing `paper` through the call chain

**Files to modify**:
1. `dataset_resolution.py`: Add `paper` param to `classify_dataset()` and `resolve_dataset_for_plan()`
2. `plans.py`: Pass `paper` to `resolve_dataset_for_plan()`

### Approach B: Strengthen LLM Prompt (RISKIER)
**Change**: Make the prompt more explicit about calling dataset_resolver

**Pros**:
- Leverages LLM capabilities
- No Python code changes
- Follows Phase 1 design intent

**Cons**:
- Unreliable - LLM might still not call it
- No failsafe if LLM doesn't cooperate
- Harder to debug

---

## Recommended Solution: Approach A

### Why Approach A is Better

1. **Reliability**: Python code always runs, LLM behavior is unpredictable
2. **Consistency**: Makes Python resolution match the tool's logic
3. **Already Proven**: Phase A.5 works this way (materialization checks paper.dataset_storage_path)
4. **Backward Compatible**: Paper param is optional, existing calls still work

### Implementation Plan

#### Step 1: Update `classify_dataset()` signature
**File**: `backend/api/app/materialize/dataset_resolution.py:98`

```python
def classify_dataset(
    dataset_name: str,
    registry: Dict[str, Any],
    blocked_list: Set[str],
    paper=None  # NEW: Optional paper record
) -> DatasetResolutionResult:
```

#### Step 2: Add upload check logic
**Location**: After registry check (line 180), before complexity check (line 183)

```python
# Step 3.5: Check paper uploads (Phase 1)
if paper and paper.dataset_storage_path:
    from app.materialize.generators.dataset_registry import normalize_dataset_name

    uploaded_stem = Path(paper.dataset_original_filename or "").stem
    normalized_uploaded = normalize_dataset_name(uploaded_stem)
    normalized_query = normalize_dataset_name(dataset_name)

    if normalized_uploaded == normalized_query:
        logger.info(
            "dataset_resolution.resolved_upload dataset=%s filename=%s",
            dataset_name,
            paper.dataset_original_filename
        )
        return DatasetResolutionResult(
            status=ResolutionStatus.RESOLVED,
            dataset_name=dataset_name,
            canonical_name=normalized_query,
            reason=f"Dataset uploaded with paper: {paper.dataset_original_filename}",
            metadata={"source": "uploaded", "format": paper.dataset_format}
        )
```

#### Step 3: Update `resolve_dataset_for_plan()` signature
**Location**: Line 215

```python
def resolve_dataset_for_plan(
    plan_dict: Dict[str, Any],
    registry: Dict[str, Any],
    blocked_list: Set[str],
    paper=None  # NEW
) -> Optional[DatasetResolutionResult]:
```

And pass it through:
```python
return classify_dataset(dataset_name, registry, blocked_list, paper=paper)
```

#### Step 4: Update call site in plans.py
**Location**: Line 568

```python
resolution = resolve_dataset_for_plan(
    plan_dict=plan_raw,
    registry=DATASET_REGISTRY,
    blocked_list=BLOCKED_DATASETS,
    paper=paper  # NEW
)
```

---

## Testing Checklist After Fix

### Regression Tests
- [ ] TextCNN paper (no upload) → Plan still works
- [ ] Existing plans in database still load
- [ ] Penalty shootouts WITHOUT dataset upload → Still rejects (expected)

### New Functionality Tests
- [ ] Penalty shootouts WITH dataset upload → Plan succeeds
- [ ] Resolution logs show "resolved_upload" status
- [ ] Sanitizer accepts the uploaded dataset
- [ ] Plan includes uploaded dataset metadata

### Edge Cases
- [ ] Uploaded dataset with mismatched name → Still rejects (expected)
- [ ] Paper without dataset_storage_path → Falls back to registry check
- [ ] Multiple papers with same dataset name → Only matches correct paper

---

## Why This Fix is Correct

1. **Matches Existing Pattern**: Phase A.5 already does this in `GeneratorFactory.get_dataset_generator()`
2. **Consistent with Tool**: Mirrors `dataset_resolver` tool logic exactly
3. **Backward Compatible**: Optional param, no breaking changes
4. **Minimal Risk**: Only adds one conditional check
5. **Testable**: Clear success/failure criteria

---

## Next Steps

1. **Review this document** - Does the analysis make sense?
2. **Approve the approach** - Is Approach A the right fix?
3. **Implement the fix** - Make the 4 code changes listed above
4. **Restart server** - Load new code
5. **Retest plan generation** - Should succeed now
6. **Run regression tests** - Ensure nothing broke
7. **Commit and document** - Create clear commit message

---

## Open Questions

1. Should we also strengthen the LLM prompt as a backup?
2. Do we need to update the sanitizer to recognize "uploaded" as a valid source?
3. Should the GET /papers/{id}/claims endpoint return the new metadata fields?


---

## Summary of Session Progress

### What Works ✅
1. **Schema Migration**: Claims table has 4 new metadata columns
2. **Extractor**: Captures `dataset_format` and `target_column` from papers
3. **Upload API**: Accepts `dataset_file` parameter, stores to Supabase storage
4. **Python Resolution Fix**: `classify_dataset()` now checks `paper.dataset_storage_path`

### What's Broken ❌
1. **Upload endpoint doesn't save metadata to database** - Returns `dataset_uploaded: true` but columns are NULL
2. **Plan generation fails** - Sanitizer rejects plan because dataset not recognized

### Critical Path Forward

**Immediate**: Verify database state with SQL query above

**If columns are NULL** (most likely):
- Bug is in `backend/api/app/routers/papers.py` ingest endpoint
- Upload stores file to Supabase storage but doesn't UPDATE paper record
- Need to add database UPDATE after storage upload
- Fix location: Around line 230-280 in papers.py where dataset upload happens

**If columns have values**:
- Name normalization mismatch between:
  - Claim dataset name: "Penalty Shoot-out Dataset"  
  - Uploaded filename: "AER20081092_Data.xls" → stem: "AER20081092_Data"
- These don't match! Need different matching strategy

### Sanitizer Issue (User Warning)
User warned about sanitization issues. The sanitizer runs AFTER our resolution fix and may have its own blocklist/validation that rejects uploaded datasets even if marked as "resolved". Need to check `sanitizer.py` for how it handles `source="uploaded"`.

### Files Modified This Session
- `backend/api/app/agents/schemas.py` - Added extractor metadata fields
- `backend/api/app/agents/types.py` - Added dataclass metadata fields
- `backend/api/app/agents/definitions.py` - Enhanced extractor prompt
- `backend/api/app/routers/papers.py` - Map metadata in claim creation
- `backend/api/app/materialize/dataset_resolution.py` - Check paper uploads
- `backend/api/app/routers/plans.py` - Pass paper to resolution

### Commits
- `b68f8b0` - Sprint 3: Extractor captures metadata (Pydantic)
- `da6e4ca` - Fix: Add metadata to dataclass
- `c49b05b` - Fix: Python resolution checks uploads

### Context Remaining
~68K tokens - Getting low, may need new session soon

