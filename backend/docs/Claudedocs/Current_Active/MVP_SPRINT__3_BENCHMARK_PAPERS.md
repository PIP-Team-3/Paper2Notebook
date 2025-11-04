# MVP Sprint: 3 Benchmark Papers End-to-End

**Status**: 🚀 ACTIVE SPRINT
**Start Date**: 2025-10-29
**Target Completion**: 2025-11-01 (3 days)
**Branch**: `clean/phase2-working`

---

## 🎯 Sprint Goal

Demonstrate **end-to-end pipeline** (Ingest → Extract → Plan → Materialize → **Execute**) on 3 benchmark ML papers with **verifiable metrics**.

**Success Criteria**:
- ✅ 3 papers fully processed without manual intervention
- ✅ Plans use real datasets (not synthetic fallbacks)
- ✅ Notebooks execute successfully within 20-minute budget
- ✅ metrics.json shows non-zero accuracy for each run
- ✅ Full demo script documented

---

## 📋 Selected Papers

### 1. **TextCNN** (Kim 2014) - NLP Baseline

**Paper Details**:
- **Slug**: `kim_2014_textcnn`
- **Title**: "Convolutional Neural Networks for Sentence Classification"
- **Paper ID**: `15017eb5-68ee-4dcb-b3b4-1c98479c3a93`
- **Domain**: NLP (sentiment classification)

**Dataset**:
- **Primary**: SST-2 (Stanford Sentiment Treebank)
- **Registry Status**: ✅ Available as `sst2`
- **Source**: HuggingFace GLUE benchmark
- **Size**: ~67 MB
- **Expected Runtime**: 8-12 minutes

**Claims Extracted**: 28 claims (pre-existing from seed papers)

**Why This Paper**:
- Classic NLP paper (6000+ citations)
- Uses well-supported registry dataset
- Fast training (small model + dataset)
- High probability of success

**Expected Model**: Simple CNN with word embeddings (sklearn baseline or minimal PyTorch)

---

### 2. **CharCNN** (Zhang 2015) - NLP Text Classification

**Paper Details**:
- **Slug**: `zhang_2015_charcnn`
- **Title**: "Character-level Convolutional Networks for Text Classification"
- **Paper ID**: `8479e2f7-78fe-4098-b949-5899ce07f8c9`
- **Domain**: NLP (text classification)

**Dataset**:
- **Primary**: AG News (news article classification)
- **Registry Status**: ✅ Available as `agnews`
- **Source**: HuggingFace
- **Size**: ~35 MB
- **Expected Runtime**: 10-15 minutes

**Claims Extracted**: 7 claims (Table 4 error rates)

**Why This Paper**:
- Character-level approach (interesting variation)
- Registry dataset available
- Multiple claims to test
- Validates NLP pipeline variety

**Expected Model**: Character-level CNN (sklearn baseline initially)

---

### 3. **DenseNet** (Huang 2017) - Computer Vision

**Paper Details**:
- **Slug**: `huang_2017_densenet`
- **Title**: "Densely Connected Convolutional Networks"
- **Paper ID**: `3e585dc9-5968-4458-b81f-d1146d2577e8`
- **Domain**: Computer Vision (image classification)

**Dataset**:
- **Primary**: CIFAR-10
- **Registry Status**: ✅ Available as `cifar10`
- **Source**: Torchvision
- **Size**: ~170 MB (downloads on first use)
- **Expected Runtime**: 15-20 minutes

**Claims Extracted**: 5 claims (Table 2 error rates on CIFAR)

**Why This Paper**:
- Validates vision pipeline (different from NLP)
- CIFAR-10 is deterministic and well-supported
- Torchvision integration test
- Iconic architecture (CVPR 2017 Best Paper)

**Expected Model**: Tiny DenseNet variant or ResNet-18 baseline

---

## 🗓️ 3-Day Sprint Timeline

### **Day 1: Verification & Setup** (Oct 29)

**Morning (3-4 hours)**:
- ✅ Fix sanitizer test assertion bug (5 min)
- ✅ Verify 3 papers ingested in database
- ✅ Verify claims exist for each paper
- ✅ Verify datasets in registry (sst2, agnews, cifar10)
- ✅ Test Supabase connectivity (DB + Storage)
- ✅ Verify .env configuration

**Afternoon (3-4 hours)**:
- ✅ Start API server
- ✅ Test plan generation for 1 claim from each paper
- ✅ Verify data_resolution returns "resolved" status
- ✅ Document any sanitizer warnings
- ✅ Save plan IDs for Day 2

**Deliverables**:
- 3 valid plan JSONs (one per paper)
- Test results documented
- Known issues logged

---

### **Day 2: Materialize & First Execution** (Oct 30)

**Morning (3-4 hours)**:
- ✅ Materialize notebooks for 3 plans
- ✅ Download notebooks from Supabase Storage
- ✅ Manual inspection of generated code:
  - Dataset loading (should use real datasets)
  - Model architecture (reasonable for 20-min budget)
  - Training loop (deterministic seeding)
  - Metrics capture (accuracy, loss)

**Afternoon (4-5 hours)**:
- ✅ Execute TextCNN notebook (SST-2)
  - Monitor SSE stream
  - Verify progress updates
  - Check for errors
  - Validate metrics.json
- 🔧 Debug any issues found
- 📝 Document execution results

**Deliverables**:
- 3 notebooks generated and inspected
- 1 successful execution (TextCNN)
- Execution logs and metrics captured

---

### **Day 3: Full Execution & Documentation** (Oct 31)

**Morning (3-4 hours)**:
- ✅ Execute CharCNN notebook (AG News)
- ✅ Execute DenseNet notebook (CIFAR-10)
- ✅ Verify all metrics.json files
- 🔧 Debug any execution failures

**Afternoon (3-4 hours)**:
- ✅ Create demo script
- ✅ Document troubleshooting guide
- ✅ Update status_overview.md
- ✅ Update changelog.md
- ✅ Create "Next Steps" roadmap
- ✅ Archive sprint documentation

**Deliverables**:
- 3 successful end-to-end executions
- Demo script ready
- Documentation complete
- Retrospective notes

---

## 📝 Detailed Task Breakdown

### **Phase 1: Verification** (4 hours)

#### Task 1.1: Database Verification
```sql
-- Check papers are ingested
SELECT id, slug, title, vector_store_id
FROM papers
WHERE slug IN ('kim_2014_textcnn', 'zhang_2015_charcnn', 'huang_2017_densenet');

-- Expected: 3 rows returned

-- Check claims exist
SELECT paper_id, COUNT(*) as claim_count
FROM claims
WHERE paper_id IN (
  '15017eb5-68ee-4dcb-b3b4-1c98479c3a93',  -- TextCNN
  '8479e2f7-78fe-4098-b949-5899ce07f8c9',  -- CharCNN
  '3e585dc9-5968-4458-b81f-d1146d2577e8'   -- DenseNet
)
GROUP BY paper_id;

-- Expected: TextCNN=28, CharCNN=7, DenseNet=5
```

**Exit Criteria**: All 3 papers exist with expected claim counts

---

#### Task 1.2: Registry Verification
```python
# Run in Python REPL or test script
from api.app.materialize.generators.dataset_registry import DATASET_REGISTRY

# Check datasets exist
required_datasets = ['sst2', 'agnews', 'cifar10']
for ds in required_datasets:
    if ds in DATASET_REGISTRY:
        meta = DATASET_REGISTRY[ds]
        print(f"✅ {ds}: {meta.source.value}, {meta.typical_size_mb}MB")
    else:
        print(f"❌ {ds}: NOT FOUND")

# Expected: All 3 datasets found
```

**Exit Criteria**: All 3 datasets in registry with correct metadata

---

#### Task 1.3: Environment Setup
```bash
# Check .env variables
cat .env | grep -E '(SUPABASE_URL|SUPABASE_KEY|OPENAI_API_KEY)'

# Expected: All variables set (no empty values)

# Test Supabase connectivity
python -c "
from api.app.data.supabase import SupabaseDatabase
db = SupabaseDatabase.from_env()
result = db.client.table('papers').select('id').limit(1).execute()
print(f'✅ Supabase DB connected: {len(result.data)} rows')
"

# Test Supabase Storage
python -c "
from api.app.data.supabase_storage import SupabaseStorage
storage = SupabaseStorage.from_env()
files = storage.client.storage.from_('plans').list()
print(f'✅ Supabase Storage connected: {len(files)} files in plans bucket')
"
```

**Exit Criteria**: All services reachable, no auth errors

---

#### Task 1.4: Fix Known Test Bug (5 minutes)
```python
# File: api/tests/test_sanitizer.py, line 408

# BEFORE (WRONG):
assert "accuracy" in sanitized["metrics"]

# AFTER (CORRECT):
assert sanitized["metrics"][0]["name"] == "accuracy"
```

Run tests to verify:
```bash
pytest api/tests/test_sanitizer.py::TestSanitizePlan::test_sanitize_missing_defaults -v
# Expected: PASSED
```

**Exit Criteria**: All sanitizer tests passing (31/31)

---

### **Phase 2: Plan Generation** (4 hours)

#### Task 2.1: Start API Server
```bash
# Load environment variables (Windows)
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $key = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"').Trim("'")
    Set-Item -Path "Env:$key" -Value $value
  }
}

# Start server
cd api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Verify server is running
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

**Exit Criteria**: API server responding to health checks

---

#### Task 2.2: Generate Plans
```bash
# Select one claim per paper for testing

# TextCNN + SST-2 (claim with highest confidence)
curl -X POST http://localhost:8000/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "<CLAIM_ID_FROM_DB>",
    "paper_id": "15017eb5-68ee-4dcb-b3b4-1c98479c3a93"
  }'

# Expected response:
# {
#   "plan_id": "...",
#   "plan_version": "1.1",
#   "plan_json": {...},
#   "warnings": [],
#   "data_resolution": {
#     "status": "resolved",
#     "dataset": "SST-2",
#     "canonical_name": "sst2",
#     "reason": "Dataset found in registry as 'sst2'",
#     "suggestions": []
#   }
# }

# Repeat for CharCNN + AG News and DenseNet + CIFAR-10
```

**Success Indicators**:
- ✅ HTTP 200 response
- ✅ plan_id returned
- ✅ data_resolution.status == "resolved"
- ✅ warnings array empty or minimal

**Failure Handling**:
- HTTP 422: Claim references blocked dataset → Skip, try different claim
- HTTP 500: Server error → Check logs, debug planner
- data_resolution.status == "unknown": Registry issue → Investigate

**Exit Criteria**: 3 plan IDs saved, all with "resolved" dataset status

---

### **Phase 3: Materialize** (3 hours)

#### Task 3.1: Generate Notebooks
```bash
# For each plan_id from Phase 2
curl -X POST http://localhost:8000/api/v1/plans/<PLAN_ID>/materialize

# Expected response:
# {
#   "notebook_asset_path": "plans/<PLAN_ID>/notebook.ipynb",
#   "env_asset_path": "plans/<PLAN_ID>/requirements.txt",
#   "env_hash": "sha256:..."
# }
```

**Exit Criteria**: 3 notebooks materialized, stored in Supabase

---

#### Task 3.2: Download & Inspect Notebooks
```bash
# Download notebooks locally
mkdir -p notebooks_mvp

# TextCNN notebook
curl "$(python -c "
from api.app.data.supabase_storage import SupabaseStorage
storage = SupabaseStorage.from_env()
url = storage.get_public_url('plans/<PLAN_ID>/notebook.ipynb')
print(url)
")" > notebooks_mvp/textcnn_sst2.ipynb

# Repeat for CharCNN and DenseNet
```

**Manual Inspection Checklist**:
- [ ] Notebook has 5-7 cells (setup, load_data, build_model, train, evaluate, metrics)
- [ ] Dataset loading uses real dataset:
  - TextCNN: `load_dataset("glue", "sst2")`
  - CharCNN: `load_dataset("ag_news")`
  - DenseNet: `torchvision.datasets.CIFAR10(...)`
- [ ] NOT using synthetic fallback: `make_classification()`
- [ ] Deterministic seeding present: `random.seed(42)`, `torch.manual_seed(42)`
- [ ] Metrics capture: `json.dump({"accuracy": ..., "loss": ...}, open("metrics.json", "w"))`
- [ ] Requirements.txt has expected deps (datasets, transformers, torch, etc.)

**Exit Criteria**: All 3 notebooks inspected, look reasonable

---

### **Phase 4: Execution** (6-8 hours)

#### Task 4.1: Execute TextCNN (First Test)
```bash
# Start execution
curl -X POST http://localhost:8000/api/v1/plans/<TEXTCNN_PLAN_ID>/run

# Expected response:
# {
#   "run_id": "...",
#   "status": "pending"
# }

# Monitor SSE stream
curl -N http://localhost:8000/api/v1/runs/<RUN_ID>/stream

# Expected events:
# event: stage_update
# data: {"stage": "run_start", "run_id": "..."}
#
# event: progress
# data: {"percent": 0}
#
# event: log_line
# data: {"message": "Loading dataset..."}
#
# event: progress
# data: {"percent": 50}
#
# event: stage_update
# data: {"stage": "run_complete", "run_id": "..."}
#
# event: progress
# data: {"percent": 100}
```

**Monitoring Checklist**:
- [ ] Execution starts within 5 seconds
- [ ] Progress updates received every 30-60 seconds
- [ ] Log lines show dataset loading
- [ ] Log lines show training epochs
- [ ] No error events received
- [ ] Completes within 20 minutes

**Exit Criteria**: TextCNN execution completes successfully

---

#### Task 4.2: Verify Artifacts
```bash
# Check run status in database
curl http://localhost:8000/api/v1/runs/<RUN_ID>

# Expected:
# {
#   "run_id": "...",
#   "plan_id": "...",
#   "status": "succeeded",
#   "started_at": "2025-10-30T...",
#   "completed_at": "2025-10-30T...",
#   "duration_seconds": 480
# }

# Download metrics.json
curl "$(python -c "
from api.app.data.supabase_storage import SupabaseStorage
storage = SupabaseStorage.from_env()
url = storage.get_public_url('runs/<RUN_ID>/metrics.json')
print(url)
")" > metrics_textcnn.json

cat metrics_textcnn.json
# Expected:
# {
#   "accuracy": 0.65,  (non-zero, >0.5 for binary classification)
#   "loss": 0.45
# }
```

**Validation Checklist**:
- [ ] metrics.json exists
- [ ] Accuracy > 0 (model trained)
- [ ] Accuracy < 1.0 (not overfitted to toy data)
- [ ] logs.txt exists and has training output
- [ ] events.jsonl exists (optional)

**Exit Criteria**: Valid metrics.json with non-zero accuracy

---

#### Task 4.3: Execute CharCNN & DenseNet
Repeat Task 4.1 and 4.2 for:
- CharCNN + AG News
- DenseNet + CIFAR-10

**Expected Runtimes**:
- CharCNN: 10-15 minutes
- DenseNet: 15-20 minutes (CIFAR-10 download + training)

**Exit Criteria**: All 3 papers executed successfully with metrics

---

### **Phase 5: Documentation** (4 hours)

#### Task 5.1: Create Demo Script
```markdown
# File: docs/Claudedocs/Current_Active/MVP_DEMO_SCRIPT.md

# P2N MVP Demo Script

## Prerequisites
- API server running on port 8000
- .env configured with Supabase + OpenAI credentials
- 3 target papers ingested (TextCNN, CharCNN, DenseNet)

## Demo Flow (15 minutes)

### 1. Show Paper (2 min)
- Open TextCNN PDF
- Highlight Table 1 with SST-2 results
- "We want to reproduce this experiment automatically"

### 2. Show Extracted Claim (1 min)
- Query claims table
- Show structured claim with dataset, metric, value

### 3. Generate Plan (3 min)
- POST /api/v1/plans/generate
- Show plan JSON:
  - Dataset: SST-2 (resolved)
  - Model: CNN with embeddings
  - Config: 10 epochs, batch_size=32
  - Policy: 20-minute budget
- Highlight data_resolution: "resolved"

### 4. Materialize Notebook (2 min)
- POST /api/v1/plans/{id}/materialize
- Download notebook
- Show generated code:
  - load_dataset("glue", "sst2")
  - Model architecture
  - Training loop
  - Metrics capture

### 5. Execute Notebook (5 min)
- POST /api/v1/plans/{id}/run
- Stream SSE events (live progress bar)
- Show log lines (training epochs)
- Wait for completion

### 6. Show Results (2 min)
- Display metrics.json
- Compare to paper's reported accuracy
- "Reproduction complete in 8 minutes!"

## Talking Points
- Fully automated: PDF → executable notebook
- Deterministic: same results every run
- Budget-constrained: 20-minute CPU limit
- Multi-domain: NLP and vision papers
```

**Exit Criteria**: Demo script documented and rehearsed

---

#### Task 5.2: Troubleshooting Guide
```markdown
# File: docs/Claudedocs/Current_Active/MVP_TROUBLESHOOTING.md

# MVP Troubleshooting Guide

## Common Issues

### Plan Generation Failures

**Symptom**: HTTP 422, "Dataset not found"
**Cause**: Claim references blocked dataset (e.g., ImageNet)
**Fix**: Select different claim with registry dataset

**Symptom**: HTTP 500, "Planner timeout"
**Cause**: OpenAI API slow or rate-limited
**Fix**: Retry after 30 seconds, check API key quota

### Materialize Failures

**Symptom**: Notebook uses synthetic data instead of real dataset
**Cause**: Dataset resolution failed or sanitizer fallback triggered
**Fix**: Check data_resolution status in plan response, investigate sanitizer warnings

### Execution Failures

**Symptom**: "metrics.json not produced by notebook"
**Cause**: Training crashed before metrics capture
**Fix**: Check logs.txt for error, reduce epochs or batch_size

**Symptom**: "Run exceeded allotted time" (timeout)
**Cause**: Model too large or dataset too big for 20-min budget
**Fix**: Use smaller model variant, reduce MAX_TRAIN_SAMPLES

**Symptom**: "GPU requested but CPU-only mode enforced"
**Cause**: Notebook tries to use CUDA
**Fix**: Bug in model generator, ensure device='cpu' in notebook

## Pre-flight Checks

Before demo:
- [ ] .env variables set
- [ ] Supabase DB reachable
- [ ] Supabase Storage has write permissions
- [ ] OpenAI API key valid (check quota)
- [ ] API server responding to /health
- [ ] Test papers ingested
- [ ] Test claims exist
```

**Exit Criteria**: Known issues documented with fixes

---

#### Task 5.3: Update Project Documentation
```bash
# Update docs/current/status_overview.md
- Mark Phase 4 (Executor) as COMPLETE
- Add "MVP Validated" section
- Update risks (dataset coverage → LOW)

# Update docs/current/changelog.md
| 2025-10-31 | MVP | **3-Paper MVP Complete**: TextCNN, CharCNN, DenseNet executed end-to-end | All stages validated, metrics verified |

# Update docs/current/milestones/
- Create executor_complete.md milestone
- Document test results
```

**Exit Criteria**: All docs updated and committed

---

## 📊 Success Metrics

### Quantitative
- ✅ 3/3 papers processed end-to-end (100%)
- ✅ 3/3 plans use real datasets (no synthetic fallback)
- ✅ 3/3 notebooks execute successfully
- ✅ 3/3 runs complete within 20-minute budget
- ✅ 3/3 metrics.json files show accuracy > 0.5

### Qualitative
- ✅ Demo script runs smoothly without manual intervention
- ✅ No critical bugs discovered
- ✅ Documentation is clear and complete
- ✅ Team confident in pipeline reliability

---

## 🚧 Known Limitations (Acceptable for MVP)

1. **Model Accuracy**: Using baseline models, not SOTA architectures
   - TextCNN: ~70-75% (paper: 87%)
   - CharCNN: ~80-85% (paper: 87%)
   - DenseNet: ~80-85% (paper: 94%)
   - **Reason**: Tiny models for speed, not full reproductions

2. **Single Claim Per Paper**: Testing 1 claim each, not all claims
   - **Reason**: MVP validation, not exhaustive testing

3. **No UI**: API-only demo with curl commands
   - **Reason**: Focus on backend pipeline first

4. **No Batch Processing**: Sequential execution
   - **Reason**: Simplifies debugging for MVP

5. **Limited Error Recovery**: Manual intervention required for failures
   - **Reason**: Happy-path validation first

---

## 🔄 Rollback Plan

If critical blocker discovered:

### Scenario 1: Executor Fails
**Symptom**: Notebooks won't execute (nbclient errors)
**Fallback**: Demo materialize only, show generated notebook code
**Impact**: No live execution, but proves planning works

### Scenario 2: Plans Fail to Generate
**Symptom**: Planner returns 500 errors consistently
**Fallback**: Use pre-generated plan JSONs from previous sessions
**Impact**: Demo still works, but can't show live planning

### Scenario 3: Dataset Issues
**Symptom**: Registry datasets fail to load (HuggingFace/Torchvision down)
**Fallback**: Use synthetic fallback, explain as degraded mode
**Impact**: Demo works but less impressive

---

## 📅 Daily Standup Template

### Morning Standup (5 min)
- ✅ Yesterday: [completed tasks]
- 🎯 Today: [planned tasks]
- 🚧 Blockers: [issues encountered]

### Evening Retrospective (5 min)
- ✅ Completed: [tasks done]
- ❌ Incomplete: [tasks deferred]
- 💡 Learnings: [insights gained]
- 🔧 Action Items: [fixes needed tomorrow]

---

## 🎉 Definition of Done

Sprint is **COMPLETE** when:
- [x] All 3 papers execute end-to-end
- [x] Metrics validated and documented
- [x] Demo script created and tested
- [x] Troubleshooting guide written
- [x] Status docs updated
- [x] Retrospective completed
- [x] Next steps roadmap created

---

## 🚀 Post-MVP Next Steps

After this sprint:
1. **Expand Coverage**: Test on 5-10 more papers
2. **Add "Wow" Paper**: Implement taxi+weather adapter
3. **Improve Models**: Add real TextCNN/ResNet generators
4. **Build UI**: Create web interface for demos
5. **Batch Execution**: Process multiple papers in parallel
6. **Gap Analysis**: Implement Phase 5 (comparison to paper claims)

See: `docs/Claudedocs/Current_Active/POST_MVP_ROADMAP.md` (to be created)

---

**Last Updated**: 2025-10-29
**Sprint Owner**: [Your Name]
**Status**: 🚀 ACTIVE
