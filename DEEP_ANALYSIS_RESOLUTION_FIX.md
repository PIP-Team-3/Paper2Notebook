# Deep Analysis: Dataset Resolution Fix

**Date**: 2025-11-20
**Context**: Reviewing whether "Option 1: Always Match" is the right solution

---

## 🎯 WHAT WE'RE TRYING TO ACCOMPLISH

### Phase 1 Goal
Enable **automatic plan generation** for papers with uploaded datasets (like penalty shootouts Excel) without requiring manual plan creation.

### The User Flow We Need to Support
```
1. User uploads paper.pdf + dataset.xls simultaneously
2. Extractor runs → captures claim with dataset_name="Penalty Shoot-out Dataset"
3. User requests plan generation for that claim
4. Planner needs to KNOW that the uploaded dataset matches this claim
5. Plan generation succeeds (not rejected)
6. Materialization downloads dataset from paper.dataset_storage_path
```

---

## 🔍 CURRENT ARCHITECTURE REVIEW

### The Two Resolution Systems

#### System 1: dataset_resolution.py (Python-based, NEW - Phase 1)
**Location**: `backend/api/app/materialize/dataset_resolution.py`
**Called by**: `plans.py:create_plan()` at line 568
**Purpose**: **Early warning system** - classifies dataset BEFORE sanitizer runs
**Returns**: `DatasetResolutionResult` with status (RESOLVED/BLOCKED/COMPLEX/UNKNOWN)
**Used for**: Logging, user feedback in API response
**Decision power**: **NONE** - it's informational only!

**Key insight**: This system is for **observability**, not enforcement.

```python
# plans.py line 568
resolution = resolve_dataset_for_plan(
    plan_dict=plan_raw,
    registry=DATASET_REGISTRY,
    blocked_list=BLOCKED_DATASETS,
    paper=paper  # Phase 1: Check uploaded datasets
)

# This runs BEFORE the sanitizer
# Returns DatasetResolutionInfo for logging/response
# But doesn't actually affect whether plan succeeds/fails!
```

#### System 2: sanitizer.py (Python-based, PRE-EXISTING)
**Location**: `backend/api/app/materialize/sanitizer.py:360`
**Called by**: `plans.py:create_plan()` at line 617
**Purpose**: **Plan validation and cleanup** - the ACTUAL gatekeeper
**Returns**: Cleaned plan dict OR raises ValueError
**Used for**: **Enforcement** - this is what rejects plans

**Key insight**: This system is the **actual decision maker**.

```python
# sanitizer.py line 360
canonical = resolve_dataset_name(raw_name, registry)
if canonical is None:
    # Dataset blocked or unknown
    warnings.append(f"Dataset '{raw_name}' not in registry and was omitted")
    pruned.pop("dataset", None)  # REMOVES dataset from plan!

# sanitizer.py line 382
if "dataset" not in pruned or not pruned.get("dataset", {}).get("name"):
    raise ValueError(
        "No allowed datasets in plan after sanitization"  # THIS IS THE ERROR WE SEE!
    )
```

---

## 🚨 THE REAL PROBLEM

### What We Discovered
1. ✅ Phase A.5 upload works - dataset metadata is saved to database
2. ✅ dataset_resolution.py receives `paper` object with dataset_storage_path
3. ❌ Name matching fails: "Penalty Shoot-out Dataset" ≠ "AER20081092_Data"
4. ⚠️ dataset_resolution.py marks it as UNKNOWN (logged for observability)
5. ❌ **sanitizer.py doesn't know about uploaded datasets at all!**

### The Critical Gap
**sanitizer.py:resolve_dataset_name() ONLY checks the registry**. It has:
- ✅ Access to `registry` (DATASET_REGISTRY dict)
- ✅ Access to `BLOCKED_DATASETS` list
- ❌ NO access to `paper` object
- ❌ NO knowledge of uploaded datasets
- ❌ NO way to check paper.dataset_storage_path

```python
# sanitizer.py:193
def resolve_dataset_name(name: str, registry: Dict[str, DatasetMetadata]) -> Optional[str]:
    # ... only checks registry ...
    meta = lookup_dataset(cleaned_name)
    if meta is None:
        logger.warning(f"sanitizer.dataset.unknown name={name}")
        return None  # THIS IS WHY IT FAILS!
```

---

## 🤔 SHOULD WE FIX dataset_resolution.py OR sanitizer.py?

### Option A: Fix dataset_resolution.py (What We Did)
**Changes**: Remove name matching in Step 3.5, always return RESOLVED if paper has dataset
**Impact**: Better logging, better user feedback in DataResolutionInfo
**PROBLEM**: **Doesn't actually solve the issue!** Sanitizer still rejects the plan.

### Option B: Fix sanitizer.py (THE RIGHT FIX)
**Changes**: Pass `paper` to sanitizer, update `resolve_dataset_name()` to check uploads
**Impact**: Sanitizer actually allows uploaded datasets through
**RESULT**: Plan generation succeeds!

---

## ✅ THE CORRECT SOLUTION

### We Need BOTH Fixes

#### Fix 1: dataset_resolution.py (for observability)
Remove name matching, trust that if dataset is uploaded with THIS paper, it's the right one.

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
        canonical_name=dataset_name,
        reason=f"Dataset uploaded with paper: {paper.dataset_original_filename}",
        metadata={"source": "uploaded", "format": paper.dataset_format}
    )
```

#### Fix 2: sanitizer.py (for enforcement)
Update `sanitize_plan()` and `resolve_dataset_name()` to accept and check paper uploads.

```python
# sanitizer.py:293
def sanitize_plan(
    raw_plan: Dict[str, Any],
    registry: Dict[str, DatasetMetadata],
    policy: Dict[str, Any],
    paper=None  # NEW: Optional paper record
) -> Tuple[Dict[str, Any], List[str]]:
    # ...

# sanitizer.py:193
def resolve_dataset_name(
    name: str,
    registry: Dict[str, DatasetMetadata],
    paper=None  # NEW
) -> Optional[str]:
    # ... existing registry checks ...

    # NEW: Check paper uploads (Phase 1)
    if paper and paper.dataset_storage_path:
        # If paper has uploaded dataset, accept this dataset name
        logger.info(f"sanitizer.dataset.uploaded name={name} filename={paper.dataset_original_filename}")
        return name  # Use extractor's name as canonical

    # ... rest of function ...
```

#### Fix 3: plans.py (thread paper through)
```python
# plans.py:617
plan_raw, sanitizer_warnings = sanitize_plan(
    raw_plan=plan_raw,
    registry=DATASET_REGISTRY,
    policy={"budget_minutes": policy_budget},
    paper=paper  # NEW: Pass paper to sanitizer
)
```

---

## 🎭 WHY THIS IS THE RIGHT APPROACH

### 1. **One paper = one dataset** (Phase 1 scope)
Penalty shootouts paper has exactly 1 dataset. If user uploaded it, it's the right one.

### 2. **User intent is clear**
Uploading dataset.xls WITH paper.pdf is an explicit signal: "this dataset goes with this paper"

### 3. **No false positives in Phase 1**
We're not building a multi-paper, multi-dataset system yet. This is single-paper automation.

### 4. **Extractor name is source of truth**
The extractor read the paper and captured "Penalty Shoot-out Dataset". That's the name we should use.
Filename "AER20081092_Data.xls" is meaningless - it's an archive code.

### 5. **Materialization will work**
When materializer needs the dataset, it looks at `paper.dataset_storage_path` - it doesn't care about names.

---

## ⚠️ POTENTIAL CONCERNS ADDRESSED

### Concern 1: "What if user uploads wrong dataset?"
**Answer**: Phase 1 is semi-automated. User must:
1. Upload correct PDF + correct dataset together
2. Review extractor output
3. Request plan generation

If they uploaded the wrong dataset, they'll catch it during review. Future: add validation UI.

### Concern 2: "What if paper mentions multiple datasets?"
**Answer**: Phase 1 scope is single-dataset papers only. Multi-dataset support is Phase 2+.
Current limitation documented in PHASE_1_AGENT_MODULARITY.md line 144.

### Concern 3: "What if name normalization breaks something?"
**Answer**: We're NOT using filename for matching. We trust user intent + extractor output.
The "penalty_shoot_out_dataset" vs "aer20081092_data" mismatch proves filename matching is unreliable.

### Concern 4: "Will this break TextCNN or existing papers?"
**Answer**: NO. The fix is additive:
- If `paper=None` (existing code paths) → works as before
- If `paper.dataset_storage_path=None` (no upload) → works as before
- If `paper.dataset_storage_path` exists → new behavior (allows uploaded dataset)

---

## 📋 IMPLEMENTATION CHECKLIST

### Step 1: Fix dataset_resolution.py (Option 1 - Always Match)
- [x] Already implemented in commit c49b05b
- [ ] Remove name matching check
- [ ] Update to always return RESOLVED when paper has dataset
- [ ] Test: resolution logs show "resolved_upload"

### Step 2: Fix sanitizer.py (Critical - NEW)
- [ ] Add `paper` parameter to `sanitize_plan()`
- [ ] Add `paper` parameter to `resolve_dataset_name()`
- [ ] Add upload check before "return None"
- [ ] Test: sanitizer accepts uploaded dataset

### Step 3: Update plans.py call site
- [ ] Pass `paper=paper` to `sanitize_plan()` at line 617
- [ ] Test: plan generation succeeds for penalty shootouts

### Step 4: Restart server & retest
- [ ] Stop server
- [ ] Start server
- [ ] Upload paper + dataset (or use existing)
- [ ] Extract claims
- [ ] Generate plan → SHOULD SUCCEED

---

## 🎯 SUCCESS CRITERIA

### Test 1: Penalty Shootouts WITH Upload ✅ Expected
```bash
curl -X POST "http://localhost:8000/api/v1/papers/ID/plan" \
  -H "Content-Type: application/json" \
  -d '{"claims": [{"id": "..."}], "budget_minutes": 20}'

# Expected:
# - Resolution logs: dataset_resolution.resolved_upload
# - Sanitizer logs: sanitizer.dataset.uploaded
# - Response: 200 OK with plan JSON (not 422 error)
```

### Test 2: TextCNN WITHOUT Upload ✅ Expected (Regression)
```bash
# Should still work exactly as before
# - Resolution: dataset found in registry
# - Sanitizer: dataset found in registry
# - Response: 200 OK
```

### Test 3: Unknown Dataset ❌ Expected (Should Fail)
```bash
# Paper with no upload, dataset not in registry
# - Resolution: UNKNOWN
# - Sanitizer: rejects plan
# - Response: 422 with E_PLAN_NO_ALLOWED_DATASETS
```

---

## 📝 CONCLUSION

**Original Question**: Is "Option 1: Always Match" the right fix?

**Answer**: **YES, but incomplete**. Option 1 is correct for dataset_resolution.py, but we also need to apply the same logic to sanitizer.py.

**The Real Issue**: We fixed the informational system but not the enforcement system.

**Next Steps**:
1. Apply Option 1 fix to dataset_resolution.py (remove name matching)
2. **Apply same fix to sanitizer.py** (this is the critical missing piece)
3. Thread `paper` parameter through call chain
4. Test end-to-end

**Why This Is Right**:
- Respects user intent (uploaded dataset goes with paper)
- Matches Phase 1 scope (single dataset per paper)
- Simple, deterministic logic
- No false positives in current use case
- Backward compatible
