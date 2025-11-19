# Dataset Upload Implementation Log

**Date Started**: November 19, 2025
**Objective**: Implement Phase A.5 - Dataset Upload Infrastructure
**Reference**: See INTEGRATION_MILESTONE.md Phase A.5 for full specification

---

## Implementation Status

**Current Step**: STEP 3 - Update Paper Ingestion Endpoint
**Overall Progress**: 3/8 steps complete

---

## Change Log

### Step 1: Database Schema Migration (COMPLETE ✅)

**Objective**: Add dataset storage columns to papers table

**Changes Made**:
1. ✅ Added three optional fields to `PaperCreate` model in `backend/api/app/data/models.py`:
   - `dataset_storage_path: Optional[str] = None`
   - `dataset_format: Optional[str] = None`
   - `dataset_original_filename: Optional[str] = None`

2. ✅ Verified database operations in `backend/api/app/data/supabase.py`:
   - `insert_paper()` uses `model_dump(exclude_none=False)` - will include NULL values
   - `get_paper()` uses `model_validate()` - will handle NULL values via Optional fields
   - No changes needed - Pydantic handles backward compatibility automatically

**Files Modified**:
- `backend/api/app/data/models.py` (lines 22-25)

**Testing Notes**:
- Since fields are Optional with default None, existing code will work unchanged
- Supabase table needs columns added manually via dashboard (or migration)
- Need to test after Supabase schema update

**Next Step**: STEP 2 - Create Supabase datasets bucket

---

### Step 2: Supabase Storage Bucket Setup (MANUAL - USER ACTION REQUIRED ⚠️)

**Objective**: Create `datasets` bucket in Supabase for storing user-uploaded datasets

**Action Required**: User must perform the following steps in Supabase dashboard

**Instructions**:

1. **Login to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to Storage**: Click "Storage" in left sidebar
3. **Create New Bucket**:
   - Click "New bucket"
   - Bucket name: `datasets`
   - Public bucket: **UNCHECKED** (private - use signed URLs)
   - File size limit: 50 MB (52,428,800 bytes)
   - Allowed MIME types:
     - `application/vnd.ms-excel` (.xls)
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
     - `text/csv` (.csv)
   - Click "Create bucket"

4. **Configure RLS Policies**:
   - Click on `datasets` bucket → "Policies" tab
   - Add INSERT policy:
     ```sql
     CREATE POLICY "Authenticated users can upload datasets"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'datasets');
     ```
   - Add SELECT policy:
     ```sql
     CREATE POLICY "Users can read their own datasets"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'datasets');
     ```

5. **Add Database Columns to papers table**:
   - Navigate to "Table Editor" → "papers" table
   - Click "Add Column" (3 times for each field):

     **Column 1:**
     - Name: `dataset_storage_path`
     - Type: `text`
     - Default value: `NULL`
     - Nullable: ✅ checked

     **Column 2:**
     - Name: `dataset_format`
     - Type: `text`
     - Default value: `NULL`
     - Nullable: ✅ checked

     **Column 3:**
     - Name: `dataset_original_filename`
     - Type: `text`
     - Default value: `NULL`
     - Nullable: ✅ checked

6. **Verification**:
   - Confirm `datasets` bucket appears in Storage list
   - Confirm policies are active (green checkmark)
   - Confirm `papers` table has 3 new columns

**Testing After Setup**:
- Try uploading a test .xlsx file via Supabase dashboard
- Verify file appears in `datasets` bucket
- Try creating a signed URL (expires in 3600s)
- Verify signed URL downloads the file

**Files Modified**:
- `backend/api/app/config/settings.py` (line 37) - Added `supabase_bucket_datasets` setting

**Status**: ✅ COMPLETE (User confirmed Supabase setup done)

---

### Step 3: Update Paper Ingestion Endpoint (COMPLETE ✅)

**Objective**: Modify `/papers/ingest` endpoint to accept optional dataset file upload

**Changes Made**:
1. ✅ Added `dataset_file: Optional[UploadFile] = File(None)` parameter to ingest_paper
2. ✅ Added dataset file validation:
   - File extension check (only .xlsx, .xls, .csv)
   - File size limit (50MB max)
   - Proper error messages with remediation hints
3. ✅ Upload dataset to Supabase datasets bucket:
   - Created datasets storage dependency (`get_supabase_datasets_storage`)
   - Generate storage path: `datasets/YYYY/MM/DD/{paper_id}.{ext}`
   - Store with correct content-type headers
4. ✅ Store dataset metadata in paper record:
   - `dataset_storage_path` - Supabase storage path
   - `dataset_format` - File extension (xlsx/xls/csv)
   - `dataset_original_filename` - User's original filename
5. ✅ Return dataset upload status in IngestResponse (`dataset_uploaded: bool`)

**Files Modified**:
- `backend/api/app/routers/papers.py`:
  - Line 69: Added `dataset_uploaded` field to IngestResponse
  - Lines 39-40: Added MAX_DATASET_BYTES and ALLOWED_DATASET_EXTENSIONS constants
  - Line 140: Added `dataset_file` parameter
  - Lines 203-257: Added dataset upload logic with validation
  - Lines 303-305: Added dataset fields to PaperCreate
  - Lines 350, 356: Added dataset_uploaded to response
- `backend/api/app/dependencies.py`:
  - Lines 60-64: Added _supabase_datasets_storage function
  - Lines 80-82: Added get_supabase_datasets_storage function
  - Line 98: Added to __all__ exports
- `backend/api/app/config/settings.py`:
  - Line 37: Added supabase_bucket_datasets setting

**Testing Notes**:
- Backward compatible: Existing calls without dataset_file still work
- Error handling covers all validation failures
- Dataset upload only happens if dataset_file is provided

**Next Step**: STEP 4 - Update planner agent dataset_resolver_tool

---

## Testing Notes

**Regression Test Command** (run after each step):
```bash
# 1. Check existing paper in DB still loads
# 2. Extract claims from TextCNN paper
# 3. Generate plan for SST-2
# 4. Materialize notebook
# 5. Verify HuggingFace code generated
```

---

## Issues Encountered

### Issue 1: Deduplication Logic Prevents Dataset Upload Testing

**Problem**: The paper ingestion endpoint uses SHA256 checksum deduplication (lines 170-190 in papers.py). When a duplicate PDF is detected, it returns the existing paper record immediately, skipping the dataset upload logic (lines 204-253).

**Impact**: Cannot test dataset upload with the same PDF twice. Test 2 (paper + dataset upload) returned the existing paper from Test 1 (paper only), resulting in `dataset_uploaded: false` even though a dataset file was provided.

**Test Results**:
- Test 1 (paper only): ✅ PASS - Created paper `19bd124a-2f1c-48dd-a7fb-71f86b4239a2`, `dataset_uploaded: false`
- Test 2 (paper + dataset): ⚠️ DUPLICATE - Returned existing paper, `dataset_uploaded: false` (dataset upload code never executed)
- Test 3 (dataset only): ✅ PASS - Correctly failed with 500 error (paper required)

**Solutions**:
1. **Option A**: Update deduplication logic to allow dataset updates on existing papers (check if `dataset_file` provided and existing paper has no dataset, then allow update)
2. **Option B**: Delete Test 1 paper from Supabase and re-run Test 2
3. **Option C**: Use a different test PDF for Test 2
4. **Option D**: Add `force_new=true` parameter to bypass deduplication for testing

**Recommendation**: Implement Option A - enhance deduplication logic to handle dataset updates.

**Resolution**: ✅ IMPLEMENTED
- Added `update_paper_dataset()` method to SupabaseDatabase (supabase.py lines 142-163)
- Modified deduplication logic to detect dataset-only updates (papers.py lines 179-213)
- Added `is_dataset_update` flag to skip PDF upload and vector store indexing
- Conditional database operation: INSERT for new papers, UPDATE for dataset-only updates

**Testing Required**: Need to restart server and re-run Test 2 to verify dataset update works.

---

### Step 3.5: Enhanced Deduplication Logic (COMPLETE ✅)

**Objective**: Allow users to add datasets to existing papers (upload paper first, dataset later)

**Changes Made**:
1. ✅ Added `update_paper_dataset()` method to SupabaseDatabase:
   - Updates `dataset_storage_path`, `dataset_format`, `dataset_original_filename`
   - Updates `updated_at` timestamp
   - Returns updated PaperRecord

2. ✅ Modified paper ingestion deduplication logic:
   - Detect if user is uploading dataset to existing paper (has no dataset)
   - Set `is_dataset_update = True` flag
   - Reuse existing paper_id, storage_path, vector_store_id
   - Skip PDF upload (line 216-222 wrapped in `if not is_dataset_update`)
   - Skip vector store indexing (line 281-310 wrapped in `if not is_dataset_update`)
   - Call `db.update_paper_dataset()` instead of `db.insert_paper()` (lines 313-320)

**Files Modified**:
- `backend/api/app/data/supabase.py`:
  - Lines 142-163: Added `update_paper_dataset()` method
- `backend/api/app/routers/papers.py`:
  - Lines 183, 197: Added `is_dataset_update` flag
  - Lines 187-197: Dataset update branch in deduplication logic
  - Lines 216-222: Conditional PDF upload
  - Lines 281-310: Conditional vector store indexing
  - Lines 313-320: Conditional database insert/update

**Flow**:
1. Upload paper only → creates new paper, `dataset_uploaded: false`
2. Upload same paper + dataset → detects duplicate, updates existing paper with dataset, `dataset_uploaded: true`
3. Upload different paper + dataset → creates new paper with dataset, `dataset_uploaded: true`

**Next Step**: Restart server and re-test

---

### Issue 2: Import Error - Wrong Relative Import Path

**Problem**: `ModuleNotFoundError: No module named 'app.routers.dependencies'`

**Cause**: Line 264 in papers.py used single dot relative import `.dependencies` which resolves to `app.routers.dependencies` (doesn't exist). Should use double dot `..dependencies` to import from parent package `app.dependencies`.

**Resolution**: ✅ FIXED
- Changed `from .dependencies import` to `from ..dependencies import` (line 264)

---

### Issue 3: Supabase Update API Error

**Problem**: `AttributeError: 'SyncFilterRequestBuilder' object has no attribute 'select'`

**Cause**: Supabase Python client doesn't support `.select()` after `.update().eq()`. The method chaining pattern used in initial implementation doesn't work.

**Resolution**: ✅ FIXED
- Removed `.select("*").single()` from update query (supabase.py lines 152-158)
- Update returns a list, not single object - access first item with `data[0]`

**Files Modified**:
- `backend/api/app/data/supabase.py` lines 142-162

---

### Issue 4: Storage Path Duplicate - Double Bucket Name

**Problem**: `StorageApiError: {'statusCode': 409, 'error': Duplicate, 'message': The resource already exists}`
URL shows `/datasets/datasets/` - duplicate bucket name in path.

**Cause**: Line 257 created path with `datasets/` prefix: `f"datasets/{year}/{month}/{day}/{paper_id}.{ext}"`, but `datasets_storage` is already configured for the `datasets` bucket. When calling `store_asset()`, the path should be relative to bucket root, not include bucket name.

**Resolution**: ✅ FIXED
- Removed `datasets/` prefix from line 257 in papers.py
- Changed from: `f"datasets/{now.year:04d}/{now.month:02d}/{now.day:02d}/{paper_id}.{dataset_extension}"`
- Changed to: `f"{now.year:04d}/{now.month:02d}/{now.day:02d}/{paper_id}.{dataset_extension}"`

**Files Modified**:
- `backend/api/app/routers/papers.py` line 257

**Testing**: ✅ SUCCESS
- Restarted server and uploaded paper + dataset using curl
- Response: `{"paper_id":"19bd124a-2f1c-48dd-a7fb-71f86b4239a2","dataset_uploaded":true}`
- Dataset stored successfully at path: `2025/11/19/19bd124a-2f1c-48dd-a7fb-71f86b4239a2.xls`
- No more storage path errors - all three fixes working correctly

---

## Test Results Summary

### Test 1: Paper + Dataset Upload (PASS ✅)
**Command**:
```bash
curl -X POST http://localhost:8000/api/v1/papers/ingest \
  -F "file=@Soccer Paper/2010-psychological-pressure-in-competitive-environments-evidence-from-a-randomized-natural-experiment.pdf" \
  -F "dataset_file=@Soccer Paper/20081092_data/AER20081092_Data.xls" \
  -F "title=Penalty Shootouts Test - Paper and Dataset"
```

**Response**:
```json
{
  "paper_id": "19bd124a-2f1c-48dd-a7fb-71f86b4239a2",
  "vector_store_id": "vs_691e16a74c8081918a5e66beecbd91db",
  "storage_path": "papers/dev/2025/11/19/19bd124a-2f1c-48dd-a7fb-71f86b4239a2.pdf",
  "dataset_uploaded": true
}
```

**Database Record**:
- Paper ID: `19bd124a-2f1c-48dd-a7fb-71f86b4239a2`
- Dataset Storage Path: `2025/11/19/19bd124a-2f1c-48dd-a7fb-71f86b4239a2.xls`
- Dataset Format: `xls`
- Dataset Original Filename: `AER20081092_Data.xls`

**Verification**:
- ✅ Paper uploaded to `papers` bucket
- ✅ Dataset uploaded to `datasets` bucket
- ✅ Database record includes dataset metadata
- ✅ Deduplication logic allows dataset updates to existing papers
- ✅ All three bug fixes working correctly

---

### Step 4: Update Planner Agent dataset_resolver_tool (COMPLETE ✅)

**Objective**: Modify `dataset_resolver_tool` to check both registry AND paper uploads

**Changes Made**:
1. ✅ Added `paper_id` parameter to `DatasetResolverArgs`:
   - New field: `paper_id: str` with validation
   - Allows tool to query paper-specific uploaded datasets

2. ✅ Updated `dataset_resolver()` function logic:
   - **Priority 1**: Check public registry first (existing datasets like SST-2, MNIST, etc.)
   - **Priority 2**: Check paper uploads if not in registry
   - **Priority 3**: Raise ToolValidationError if not found anywhere

3. ✅ Uploaded dataset matching:
   - Normalize both query and uploaded filename using `normalize_dataset_name()`
   - Match by filename stem (e.g., "AER20081092_Data.xls" → "aer20081092data")
   - Return special metadata with `source: "uploaded"`

4. ✅ Return format for uploaded datasets:
   ```python
   {
       "id": normalized_query,
       "name": uploaded_stem,
       "source": "uploaded",  # Special marker
       "license_id": "user-provided",
       "size_mb": 1,
       "storage_path": paper.dataset_storage_path,
       "dataset_format": paper.dataset_format,
       "original_filename": paper.dataset_original_filename,
   }
   ```

**Files Modified**:
- `backend/api/app/tools/function_tools.py`:
  - Lines 1-14: Added imports (Path, normalize_dataset_name)
  - Lines 146-162: Updated DatasetResolverArgs model with paper_id parameter
  - Lines 214-265: Complete rewrite of dataset_resolver() function
  - Line 322: Updated tool description

**Backward Compatibility**:
- ⚠️ **BREAKING CHANGE**: Tool now requires `paper_id` parameter
- Planner agent already passes paper context in user message (plans.py line 310-318)
- Agent must call tool with both `query` and `paper_id` arguments
- Registry datasets (SST-2, MNIST, etc.) still work exactly as before

**Flow Examples**:
1. **Registry Dataset (SST-2)**:
   - Query: "sst2", paper_id: "abc123"
   - Check registry → FOUND → Return SST-2 metadata

2. **Uploaded Dataset (Penalty Shootouts)**:
   - Query: "penalty_shootouts", paper_id: "19bd124a-2f1c-48dd-a7fb-71f86b4239a2"
   - Check registry → NOT FOUND
   - Check paper uploads → Normalize "AER20081092_Data" → Match!
   - Return uploaded dataset metadata with storage_path

3. **Unknown Dataset**:
   - Query: "imagenet", paper_id: "abc123"
   - Check registry → NOT FOUND (blocked)
   - Check paper uploads → NOT FOUND
   - Raise ToolValidationError with helpful message

---

### Step 5: Update ExcelDatasetGenerator for Supabase (COMPLETE ✅)

**Objective**: Modify ExcelDatasetGenerator to support Supabase-uploaded datasets

**Changes Made**:

1. ✅ **Updated Constructor** ([dataset.py:258-267](backend/api/app/materialize/generators/dataset.py#L258-L267)):
   - Added optional `paper` parameter to `__init__()`
   - Stores paper context for routing between local and uploaded datasets
   ```python
   def __init__(self, metadata: DatasetMetadata, paper=None):
       self.metadata = metadata
       self.paper = paper
   ```

2. ✅ **Updated generate_imports()** ([dataset.py:269-285](backend/api/app/materialize/generators/dataset.py#L269-L285)):
   - Conditionally includes `requests` and `io.BytesIO` for Supabase downloads
   - Only adds these dependencies if paper has uploaded dataset
   ```python
   if self.paper and self.paper.dataset_storage_path:
       imports.extend(["import requests", "from io import BytesIO"])
   ```

3. ✅ **New Method: _generate_uploaded_dataset_code()** ([dataset.py:287-367](backend/api/app/materialize/generators/dataset.py#L287-L367)):
   - Generates code to download dataset from Supabase signed URL
   - URL injected via `DATASET_URL` environment variable (set by sandbox at runtime)
   - Downloads with `requests.get()` with 5-minute timeout
   - Loads Excel from `BytesIO(response.content)` (in-memory)
   - Includes same preprocessing as local path: target detection, categorical encoding, train/test split
   - **Key Feature**: Environment variable approach decouples code generation from URL generation (signed URLs expire in 24 hours)

4. ✅ **Updated generate_code()** ([dataset.py:369-455](backend/api/app/materialize/generators/dataset.py#L369-L455)):
   - Routes between uploaded and local datasets:
     - If `self.paper.dataset_storage_path` exists → call `_generate_uploaded_dataset_code()`
     - Otherwise → fallback to local registry path (for development/testing)
   - Maintains backward compatibility with existing local Excel datasets

5. ✅ **Updated generate_requirements()** ([dataset.py:457-470](backend/api/app/materialize/generators/dataset.py#L457-L470)):
   - Conditionally adds `requests>=2.31.0` for Supabase downloads
   - Only includes if paper has uploaded dataset (keeps requirements minimal for local datasets)

**Key Design Decisions**:

1. **Environment Variable for URL**:
   - Code generation happens once, but signed URLs expire
   - Sandbox will generate fresh signed URL at runtime and inject via `DATASET_URL` env var
   - Keeps generated notebook code reusable (not tied to expired URLs)

2. **BytesIO In-Memory Loading**:
   - Avoids filesystem writes in sandbox (cleaner, faster)
   - Works with both `.xls` (xlrd) and `.xlsx` (openpyxl) formats
   - pandas `read_excel()` supports file-like objects

3. **Same Preprocessing Logic**:
   - Both uploaded and local paths use identical target detection + categorical encoding
   - DRY principle violated slightly (code duplication), but keeps each path self-contained
   - Future: Extract shared preprocessing logic to helper function

4. **Backward Compatibility**:
   - Existing generators (Sklearn, Torchvision, HuggingFace) unchanged
   - ExcelDatasetGenerator still works with local paths (fallback mode)
   - Optional `paper` parameter means old code still works

**Files Modified**:
- `backend/api/app/materialize/generators/dataset.py` (lines 241-470)

**Testing Plan** (Next Step):
- STEP 6 will update GeneratorFactory to pass `paper` context
- STEP 7 will update materialization endpoint to fetch paper and pass to factory
- Full end-to-end test: Upload Penalty Shootouts → Extract → Plan → Materialize → Verify notebook

---

### Step 6: Update GeneratorFactory with paper context (COMPLETE ✅)

**Objective**: Modify GeneratorFactory to accept paper context and route to uploaded datasets

**Changes Made**:

1. ✅ **Updated get_dataset_generator() signature** ([factory.py:48](backend/api/app/materialize/generators/factory.py#L48)):
   - Added optional `paper` parameter: `def get_dataset_generator(plan: PlanDocumentV11, paper=None)`
   - Backward compatible (existing calls without `paper` still work)

2. ✅ **Added uploaded dataset detection logic** ([factory.py:80-100](backend/api/app/materialize/generators/factory.py#L80-L100)):
   - Checks `paper.dataset_storage_path` BEFORE registry lookup
   - Creates minimal DatasetMetadata for uploaded dataset
   - Routes to ExcelDatasetGenerator with `paper` context
   - Logs clear message: "Using uploaded dataset for paper 'xxx'"

3. ✅ **Updated ExcelDatasetGenerator instantiation** ([factory.py:151](backend/api/app/materialize/generators/factory.py#L151)):
   - Registry-based Excel datasets also receive `paper` parameter
   - Enables future hybrid scenarios (registry metadata + uploaded file)

**Key Design Decisions**:

1. **Uploaded Datasets Take Priority**:
   - Check `paper.dataset_storage_path` FIRST, before registry
   - Allows users to override registry datasets with custom uploads
   - Example: User uploads "sst2.xlsx" → will use uploaded version, not HuggingFace

2. **Minimal Metadata Creation**:
   - Creates DatasetMetadata on-the-fly for uploaded datasets
   - Sets `source=DatasetSource.EXCEL`, `license="user-provided"`
   - Avoids need to register every uploaded dataset in static registry

3. **Backward Compatibility**:
   - `paper` parameter is optional (default=None)
   - Existing code paths unchanged (sklearn, torchvision, HuggingFace)
   - Only affects Excel generator behavior

4. **Future CSV Support**:
   - Comment notes "assume all uploaded datasets are Excel (future: support CSV)"
   - Can add conditional logic based on `paper.dataset_format` later
   - Currently: `.xls`, `.xlsx` → ExcelDatasetGenerator

**Files Modified**:
- `backend/api/app/materialize/generators/factory.py` (lines 48-151)

---

### Step 7: Update materialization endpoint (COMPLETE ✅)

**Objective**: Update materialization endpoint to fetch paper and pass context through the code generation pipeline

**Changes Made**:

1. ✅ **Updated build_notebook_bytes() signature** ([notebook.py:58](backend/api/app/materialize/notebook.py#L58)):
   - Added optional `paper` parameter: `def build_notebook_bytes(plan, plan_id, paper=None)`
   - Passes `paper` to `GeneratorFactory.get_dataset_generator(plan, paper=paper)`
   - Updated docstring to document Phase A.5 support

2. ✅ **Updated materialize_plan_assets() endpoint** ([plans.py:877-894](backend/api/app/routers/plans.py#L877-L894)):
   - Fetches paper record using `plan_record.paper_id`
   - Checks if paper has uploaded dataset (`paper.dataset_storage_path`)
   - Logs materialization of uploaded dataset for observability
   - Passes `paper` to `build_notebook_bytes(plan, plan_id, paper=paper)`

**Implementation Flow**:
```
POST /api/v1/plans/{plan_id}/materialize
  ↓
materialize_plan_assets()
  ↓ Fetch plan record
  ↓ Fetch paper record (if paper_id exists)
  ↓
build_notebook_bytes(plan, plan_id, paper=paper)
  ↓
GeneratorFactory.get_dataset_generator(plan, paper=paper)
  ↓ Check paper.dataset_storage_path
  ↓ IF uploaded → ExcelDatasetGenerator(metadata, paper=paper)
  ↓ ELSE → Lookup registry → SklearnDatasetGenerator / HuggingFaceDatasetGenerator / etc.
  ↓
ExcelDatasetGenerator.generate_code()
  ↓ IF paper.dataset_storage_path → _generate_uploaded_dataset_code()
  ↓   → Generates code to download from Supabase via DATASET_URL env var
  ↓ ELSE → Generate local file loading code (fallback)
```

**Key Design Decisions**:

1. **Optional Paper Parameter**:
   - `paper=None` default maintains backward compatibility
   - Existing tests without uploaded datasets still work
   - Only affects behavior when paper has `dataset_storage_path`

2. **Logging for Observability**:
   - Logs when uploaded dataset is detected: `materialize.uploaded_dataset plan_id={} paper_id={} dataset={}`
   - Helps debug which dataset source was used (registry vs uploaded)
   - Critical for troubleshooting production issues

3. **No Changes to build_requirements()**:
   - Requirements are generated by ExcelDatasetGenerator.generate_requirements()
   - Already handles `requests>=2.31.0` conditionally (added in STEP 5)
   - No endpoint changes needed

**Files Modified**:
- `backend/api/app/materialize/notebook.py` (line 58, 80)
- `backend/api/app/routers/plans.py` (lines 877-894)

**End-to-End Integration**:
All 7 steps now complete the full upload → plan → materialize flow:
- ✅ STEP 1: Database schema supports dataset uploads
- ✅ STEP 2: Supabase storage bucket created
- ✅ STEP 3: Ingestion endpoint uploads datasets
- ✅ STEP 4: Planner tool resolves uploaded datasets
- ✅ STEP 5: ExcelDatasetGenerator generates Supabase download code
- ✅ STEP 6: GeneratorFactory routes to uploaded datasets
- ✅ STEP 7: Materialization endpoint passes paper context

**Next Step**: Run full TextCNN regression test to ensure backward compatibility

---

## Known Limitations & Future Work

### Agent Prompt & Schema Limitations (Identified but NOT Yet Fixed)

**Context**: Steps 1-4 implement the infrastructure for dataset uploads, but the agent prompts and data schemas still assume text-only HuggingFace datasets. This section documents what needs to be addressed AFTER steps 5-7 to fully support tabular datasets like Penalty Shootouts and Credit Card Default.

---

#### Limitation 1: Extractor Prompt - Missing Dataset Metadata Capture ❌

**Problem**: Extractor agent prompt doesn't instruct extraction of dataset format, target columns, or preprocessing hints.

**Current Behavior** ([definitions.py](backend/api/app/agents/definitions.py) `_build_extractor`):
- Only extracts: `dataset_name`, `split`, `metric_name`, `metric_value`, `units`, `method_snippet`, `citation`, `confidence`
- No awareness of dataset format (text/tabular/vision)
- No capture of target column ("Win", "default payment next month")
- No preprocessing hints (categorical encoding, feature types)

**Why It Matters**:
- Penalty Shootouts paper describes "Win" as the target variable - extractor should capture this
- Credit Card paper mentions "default payment next month" and categorical features - needs to be stored
- Without target column, ExcelDatasetGenerator must guess (error-prone)

**Required Changes**:
1. Update extractor prompt to add:
   ```
   - If paper describes dataset format or sources, capture:
     * dataset_format: "huggingface" | "excel" | "csv" | "text" | "vision"
     * dataset_url: Any download links mentioned (UCI, paper supplementary)
     * target_column: The prediction target ("Win", "default", "sentiment")
     * preprocessing_notes: Categorical encoding hints, feature descriptions
   ```

2. Extend `ClaimCreate` schema ([models.py:38-54](backend/api/app/data/models.py#L38-L54)):
   ```python
   dataset_format: Optional[str] = None  # "excel", "csv", "huggingface"
   dataset_url: Optional[str] = None  # Paper's dataset link
   target_column: Optional[str] = None  # "Win", "default", "sentiment"
   preprocessing_notes: Optional[str] = None  # Categorical encoding hints
   ```

3. Add columns to `claims` table in Supabase

**Impact**: HIGH - Blocks accurate target column detection for tabular datasets

**Status**: Documented, not implemented

---

#### Limitation 2: Planner Prompt - No Uploaded Dataset Awareness ❌

**Problem**: Planner agent prompt doesn't mention uploaded datasets or how to use `dataset_resolver_tool` with `paper_id`.

**Current Behavior** ([definitions.py](backend/api/app/agents/definitions.py) `_build_planner`):
- Generic "ML reproduction expert" instructions
- No mention of uploaded datasets vs registry datasets
- No guidance on calling `dataset_resolver_tool(query, paper_id)`
- No instructions for `source="uploaded"` handling
- No target column selection logic
- No tabular dataset workflow (train/test split, categorical encoding)

**Why It Matters**:
- Tool was updated in STEP 4 to accept `paper_id`, but planner doesn't know to provide it
- When resolver returns `source="uploaded"`, planner has no instructions on what to do
- Planner needs explicit guidance: "If source=uploaded and format=excel, choose ExcelDatasetGenerator"
- Target column from claim metadata needs to be passed to generator

**Required Changes**:
1. Update planner prompt to add:
   ```
   ## Dataset Selection
   - User may have selected a specific dataset - honor that choice
   - Call dataset_resolver_tool(query=dataset_name, paper_id=paper.id) to check availability
   - Resolver returns {"source": "registry"|"uploaded", "format": "excel"|"csv"|"huggingface", ...}

   ## Uploaded Dataset Workflow
   - If source="uploaded":
     * Use paper.dataset_storage_path instead of registry
     * Extract target_column from claim metadata if available
     * For format="excel" or "csv": Choose ExcelDatasetGenerator/CSVDatasetGenerator
     * Include target_column in plan dataset metadata
     * Specify categorical encoding strategy for tabular data
     * Plan train/test split (no HuggingFace splits available)

   ## Tabular Dataset Guidance
   - For Excel/CSV datasets:
     * Discuss train/test split strategy (80/20, stratified if classification)
     * Specify categorical encoding (one-hot, label encoding, ordinal)
     * Identify numeric vs categorical features
     * Handle missing values strategy
     * Consider subsampling for large datasets (>100K rows)
   ```

2. Remind agent about tool signature:
   ```
   - dataset_resolver_tool(query: str, paper_id: str) returns:
     * Registry: {"source": "registry", "license_id": "...", "size_mb": 67}
     * Uploaded: {"source": "uploaded", "format": "excel", "storage_path": "...", ...}
   ```

**Impact**: CRITICAL - Without this, planner won't use uploaded datasets even though tool supports them

**Status**: Documented, not implemented

---

#### Limitation 3: Claims Schema - Missing New Fields ❌

**Problem**: Database schema doesn't support new metadata fields needed for tabular datasets.

**Current Schema** ([models.py:38-54](backend/api/app/data/models.py#L38-L54)):
```python
class ClaimCreate(BaseModel):
    paper_id: str
    dataset_name: Optional[str] = None
    split: Optional[str] = None
    metric_name: str
    metric_value: float
    units: Optional[str] = None
    method_snippet: Optional[str] = None
    source_citation: str
    confidence: float
    created_by: Optional[str] = None
    created_at: datetime
```

**Missing Fields**:
- `dataset_format`: "excel" | "csv" | "huggingface" | "text" | "vision"
- `dataset_url`: Paper's dataset download link
- `target_column`: Prediction target name
- `preprocessing_notes`: Categorical encoding, feature descriptions

**Required Changes**:
1. Add columns to `claims` table:
   ```sql
   ALTER TABLE claims
   ADD COLUMN dataset_format TEXT NULL,
   ADD COLUMN dataset_url TEXT NULL,
   ADD COLUMN target_column TEXT NULL,
   ADD COLUMN preprocessing_notes TEXT NULL;
   ```

2. Update `ClaimCreate` and `ClaimRecord` models

3. Update extractor prompt to populate these fields

4. Update planner to read these fields when generating plan

**Impact**: HIGH - Without this, target column and format information is lost

**Status**: Documented, not implemented

---

#### Limitation 4: ExcelDatasetGenerator - No Target Column Parameter ❌

**Problem**: Generator uses heuristics to guess target column instead of accepting explicit parameter.

**Current Behavior**: ExcelDatasetGenerator tries to detect target column via:
- Looking for columns named "label", "target", "class"
- Checking for binary/categorical columns
- Guessing based on data types

**Why It's Problematic**:
- Penalty Shootouts has "Win" (not a standard name) - heuristic may fail
- Credit Card has "default payment next month" - too long to match heuristic
- Wastes LLM tokens on guessing instead of using known information

**Required Changes**:
1. Add constructor parameter:
   ```python
   class ExcelDatasetGenerator(CodeGenerator):
       def __init__(
           self,
           metadata: Optional[DatasetMetadata] = None,
           paper: Optional[Paper] = None,
           target_column: Optional[str] = None  # NEW
       ):
           self.metadata = metadata
           self.paper = paper
           self.target_column = target_column
   ```

2. Update `generate_code()` to use explicit target if provided:
   ```python
   if self.target_column:
       target_code = f'y = df["{self.target_column}"]'
   else:
       # Fall back to heuristic detection
       target_code = self._detect_target_column(df)
   ```

3. Update GeneratorFactory to pass target_column from claim metadata

**Impact**: MEDIUM - Improves reliability, reduces guessing errors

**Status**: Documented, not implemented

---

#### Limitation 5: TextCNN-Specific Assumptions in Agent Prompts ❌

**Problem**: Neither extractor nor planner explicitly mention TextCNN, but lack of non-text instructions biases system to text-only.

**Current Behavior**:
- Prompts don't acknowledge existence of tabular or vision datasets
- No guidance on modality-specific workflows
- Implicitly assumes HuggingFace text datasets

**Required Changes**:
1. Update extractor prompt:
   ```
   - Datasets can be text, tabular (Excel/CSV), or vision (images)
   - Identify dataset modality from paper description
   - For text: Extract dataset name, split, metrics
   - For tabular: Extract target column, feature types, preprocessing
   - For vision: Extract image size, number of classes, augmentation
   ```

2. Update planner prompt:
   ```
   - Plans must adapt to dataset modality:
     * Text: HuggingFace loader, tokenization, sequence classification
     * Tabular: Pandas loader, feature encoding, sklearn/tabular models
     * Vision: Image loader, transforms, CNN/ResNet models
   ```

**Impact**: MEDIUM - Makes system modality-agnostic

**Status**: Documented, not implemented

---

### Implementation Priority (Post-STEP 7)

**Phase 1: Enable Tabular Datasets** (Required for Penalty Shootouts)
1. ✅ STEP 5-7: Complete upload infrastructure
2. ❌ Claims schema extension (add 4 new columns)
3. ❌ Extractor prompt update (capture new metadata)
4. ❌ Planner prompt update (uploaded dataset workflow)
5. ❌ ExcelDatasetGenerator target column support

**Phase 2: Improve Reliability** (Quality improvements)
6. ❌ Tabular dataset guidance in planner prompt
7. ❌ Categorical encoding strategy selection
8. ❌ Train/test split logic for non-HuggingFace datasets

**Phase 3: Multi-Modality Support** (Future)
9. ❌ Vision dataset support in prompts
10. ❌ Preprocessing hints utilization
11. ❌ Auto-download from dataset URLs

---

---

## Testing & Verification

### Bug Fix: DatasetSource Import Shadowing (FIXED ✅)

**Issue**: `UnboundLocalError: cannot access local variable 'DatasetSource' where it is not associated with a value`

**Location**: [factory.py:123](backend/api/app/materialize/generators/factory.py#L123)

**Root Cause**:
- Line 92 had a local import inside the uploaded dataset check block:
  ```python
  from .dataset_registry import DatasetMetadata, DatasetSource
  ```
- Python treated `DatasetSource` as a local variable defined only inside the `if` block
- When `paper=None` (TextCNN regression test), the block wasn't executed
- Line 123 tried to access `DatasetSource` outside the block → UnboundLocalError

**Fix** (Commit 2d10358):
- Removed redundant local import of `DatasetSource` (line 92)
- Uses only the module-level import from line 24: `from .dataset_registry import DatasetSource, lookup_dataset`

**Testing**: ✅ Verified with TextCNN regression test - materialization succeeded

---

### Test Results: TextCNN Regression Test (PASS ✅)

**Objective**: Verify Phase A.5 didn't break existing workflows for papers without uploaded datasets

**Test Details**:
- Paper: kim_2014_textcnn.pdf
- Dataset: None uploaded (tests backward compatibility)
- Expected: Should generate HuggingFace SST-2 loading code, NOT Excel/Supabase code

**Step 1: Upload Paper (No Dataset)**
```bash
curl -X POST http://localhost:8000/api/v1/papers/ingest \
  -F "file=@backend/assets/papers/kim_2014_textcnn.pdf" \
  -F "title=Convolutional Neural Networks for Sentence Classification"
```

**Response**:
```json
{
  "paper_id": "147879d5-b8d6-41ca-890d-7f55dbee7029",
  "vector_store_id": "vs_691cea2f7fac8191b2c13deb649446c1",
  "storage_path": "papers/dev/2025/11/18/147879d5-b8d6-41ca-890d-7f55dbee7029.pdf",
  "dataset_uploaded": false  ← ✅ CORRECT
}
```

**Step 2: Create Plan**
```bash
curl -X POST http://localhost:8000/api/v1/papers/147879d5-b8d6-41ca-890d-7f55dbee7029/plan \
  -H "Content-Type: application/json" \
  -d '{"claims": [{"dataset": "SST-2", "split": "train", "metric": "accuracy", "value": 0.87, "units": "%", "citation": "Table 1", "confidence": 0.9}], "budget_minutes": 20}'
```

**Response**:
```json
{
  "plan_id": "23a1aba7-e302-49ad-be40-2fe07ff0f0e2",
  "plan_version": "1.1",
  "data_resolution": {
    "status": "resolved",  ← ✅ Found in registry
    "dataset": "SST-2",
    "canonical_name": "sst2",
    "reason": "Dataset found in registry as 'sst2'"
  }
}
```

**Step 3: Materialize Notebook**
```bash
curl -X POST http://localhost:8000/api/v1/plans/23a1aba7-e302-49ad-be40-2fe07ff0f0e2/materialize
```

**Response**:
```json
{
  "notebook_asset_path": "23a1aba7-e302-49ad-be40-2fe07ff0f0e2/notebook.ipynb",
  "env_asset_path": "23a1aba7-e302-49ad-be40-2fe07ff0f0e2/requirements.txt",
  "env_hash": "476842118a11ef09ebe708a5c55026b40d53b6d160f2deb4256a1604d6c5d555"
}
```

**Step 4: Verify Generated Code**

Downloaded notebook contains **HuggingFace code** (NOT Excel/Supabase):
```python
# ✅ CORRECT IMPORTS
from datasets import load_dataset
from sklearn.feature_extraction.text import CountVectorizer

# ✅ CORRECT DATASET LOADING
dataset = load_dataset(
    "glue", "sst2",
    cache_dir=CACHE_DIR,
    download_mode="reuse_dataset_if_exists",
)

# ❌ NO Excel/Supabase code present:
# - No `import requests`
# - No `from io import BytesIO`
# - No `os.getenv("DATASET_URL")`
# - No `pd.read_excel(BytesIO(...))`
```

**Step 5: Execute Notebook**
```bash
curl -X POST http://localhost:8000/api/v1/plans/23a1aba7-e302-49ad-be40-2fe07ff0f0e2/run
```

**Execution Results**:
```json
{
  "metrics": {
    "accuracy": 0.722,
    "precision": 0.7204301075268817,
    "recall": 0.8300884955752212,
    "accuracy_gap": -86.278
  }
}
```

**Analysis**:
- Notebook executed successfully on SST-2 sentiment classification
- Accuracy 72.2% (lower than paper's 87% because we use Logistic Regression + bag-of-words, not actual TextCNN)
- This is expected Phase 2 behavior (simple sklearn models for CPU-only execution)

**Conclusion**: ✅ **BACKWARD COMPATIBILITY CONFIRMED**
- Papers without datasets use registry/HuggingFace generators
- No Excel/Supabase code generated when `paper.dataset_storage_path` is None
- `paper=None` fallback works correctly throughout the pipeline
- Phase A.5 did NOT break existing workflows

---

### Known Infrastructure Issues

#### Issue: Supabase Storage Bucket MIME Type Restriction ⚠️

**Problem**: Supabase `plans` bucket rejects `.jsonl` files during run artifact persistence

**Error**:
```
storage3.exceptions.StorageApiError: {
  'statusCode': 400,
  'error': InvalidRequest,
  'message': mime type application/jsonl is not supported
}
```

**Location**: [runs.py:54](backend/api/app/routers/runs.py#L54) - `_persist_artifacts()` function

**When It Happens**:
- After notebook execution completes successfully
- When trying to upload `events.jsonl` to `plans/runs/{run_id}/events.jsonl`

**Impact**:
- ❌ Run artifacts (events.jsonl, logs.txt, metrics.json) cannot be persisted
- ❌ Run status shows as "failed" even though notebook executed successfully
- ✅ Notebook execution itself works (metrics are generated)
- ✅ Metrics are visible in SSE event stream before upload fails

**Root Cause**:
- Supabase storage buckets have MIME type restrictions configured at bucket level
- `plans` bucket was likely created with a whitelist of allowed types
- `application/jsonl` (or `application/x-ndjson`) not in the whitelist

**Solution** (User Action Required):
1. Login to Supabase Dashboard → Storage → `plans` bucket
2. Click "Settings" or "Configuration"
3. Add allowed MIME types:
   - `application/jsonl`
   - `application/x-ndjson` (alternative JSONL MIME type)
   - `text/plain` (fallback - logs.txt already uses this)
4. Save changes

**Workaround** (Temporary):
- Change content-type to `text/plain` in [supabase.py:493](backend/api/app/data/supabase.py#L493):
  ```python
  # BEFORE:
  storage.store_text(key, events_jsonl, content_type="application/jsonl")

  # AFTER (workaround):
  storage.store_text(key, events_jsonl, content_type="text/plain")
  ```

**Status**: ⚠️ **UNRESOLVED** - Requires Supabase bucket configuration change

**Related**: This is a pre-existing issue, NOT introduced by Phase A.5. The run execution feature has always had this limitation.

---

## Next Steps

### Immediate Testing Priority

1. **Test Penalty Shootouts End-to-End** (NEW FUNCTIONALITY):
   - Upload paper + dataset via `/ingest`
   - Manually create plan (extractor won't work yet - see Limitation 1)
   - Materialize notebook
   - Verify Excel/Supabase download code generated
   - Verify `requests>=2.31.0` in requirements.txt

2. **Test Dataset-Only Update** (EDGE CASE):
   - Upload paper without dataset
   - Upload dataset later via same endpoint
   - Verify database update works
   - Verify plan + materialize use uploaded dataset

3. **Fix Supabase .jsonl MIME Type Issue**:
   - Update `plans` bucket configuration
   - Re-run TextCNN execution test
   - Verify artifacts persist successfully

### Post-Testing Work (Phase 1: Enable Tabular Datasets)

**Required to make Penalty Shootouts work end-to-end**:
1. ❌ Claims schema extension (add 4 new columns to database)
2. ❌ Extractor prompt update (capture dataset_format, target_column, preprocessing_notes, dataset_url)
3. ❌ Planner prompt update (uploaded dataset workflow instructions, tool usage guidance)
4. ❌ ExcelDatasetGenerator enhancement (accept explicit target_column parameter)
5. ❌ Sandbox execution environment (inject DATASET_URL with fresh signed URL)

### Future Phases

**Phase 2: Improve Reliability**
- Tabular dataset guidance in planner prompt
- Categorical encoding strategy selection
- Train/test split logic for non-HuggingFace datasets

**Phase 3: Multi-Modality Support**
- Vision dataset support
- Preprocessing hints utilization
- Auto-download from dataset URLs

**Phase 4: Frontend Integration**
- Dataset upload modal (deferred - see INTEGRATION_MILESTONE.md Phase A.5)
