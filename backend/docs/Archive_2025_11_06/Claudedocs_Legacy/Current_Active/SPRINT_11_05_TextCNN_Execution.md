# Sprint Plan: TextCNN Notebook Execution (11/5)

**Sprint Start**: 2025-11-05
**Sprint Goal**: Execute the TextCNN/SST-2 notebook end-to-end and produce valid metrics
**Status**: 🚀 ACTIVE
**Estimated Duration**: 2-3 hours

---

## 🎯 Sprint Objective

Get the **TextCNN SST-2 notebook running successfully** with correct imports, dependencies, and execution flow. This validates that the Phase 2 smart dataset generator system works end-to-end.

**Success Criteria**:
- ✅ Notebook executes without import errors
- ✅ Real SST-2 dataset loads from HuggingFace (not synthetic fallback)
- ✅ Training completes within 15 minutes
- ✅ `metrics.json` produced with accuracy > 0.5
- ✅ `events.jsonl` produced with execution logs
- ✅ Accuracy gap documented vs. paper's 88.1% claim

---

## 📋 Context: Current System Architecture

### Smart Generator System (Phase 2) ✅

The notebook generation system **already uses smart model generators**:

**Factory Pattern** ([factory.py:47-128](../../../api/app/materialize/generators/factory.py#L47-L128)):
- `GeneratorFactory.get_dataset_generator()` - Intelligently selects dataset generator
- Looks up dataset in registry via `lookup_dataset()`
- Returns appropriate generator based on source:
  - **HuggingFaceDatasetGenerator** for SST-2, AG News, IMDB, etc.
  - **TorchvisionDatasetGenerator** for CIFAR-10, MNIST, Fashion-MNIST
  - **SklearnDatasetGenerator** for bundled sklearn datasets (digits, iris, wine)
  - **SyntheticDatasetGenerator** as graceful fallback if dataset not found

**Dataset Registry** ([dataset_registry.py](../../../api/app/materialize/generators/dataset_registry.py)):
- 30+ datasets registered with metadata
- Handles normalization and aliases (e.g., "SST-2" → "sst2")
- Tracks source, download size, and load functions

### Current TextCNN Notebook

**Plan ID**: `0d4f0ff4-730f-47dc-a387-7943806fe990`
**Location**: `backend/notebooks_mvp/textcnn_sst2.ipynb`

**What the Generator Produces**:
1. **HuggingFaceDatasetGenerator** ([dataset.py:242-362](../../../api/app/materialize/generators/dataset.py#L242-L362)):
   - Loads SST-2 from HuggingFace using `load_dataset("glue", "sst2")`
   - Caches dataset to avoid re-downloads
   - Converts text to bag-of-words using `CountVectorizer`
   - Subsamples to 5000 samples for CPU budget

2. **SklearnLogisticGenerator** ([model.py:17-87](../../../api/app/materialize/generators/model.py#L17-L87)):
   - Trains LogisticRegression (fast, deterministic)
   - Computes accuracy, precision, recall
   - Writes metrics.json with accuracy gap

**Why LogisticRegression?**
- Phase 2 uses sklearn baselines for speed (< 15 min execution)
- Phase 3 will add real CNN models (TextCNN architecture)
- Validates end-to-end pipeline before adding model complexity

---

## 🐛 Issues Found in Current Notebook

### Issue 1: Missing Import Statements ❌

**Location**: Cell 2 (dataset loading)
**Problem**: The HuggingFaceDatasetGenerator produces code that uses:
- `load_dataset` (from `datasets`)
- `CountVectorizer` (from `sklearn.feature_extraction.text`)
- `train_test_split` (from `sklearn.model_selection`)

But these imports are **never added to the notebook**!

**Root Cause**: The `build_notebook_bytes()` function in [notebook.py](../../../api/app/materialize/notebook.py) doesn't call `.generate_imports()` on the generators.

**Evidence**: Looking at the notebook cell 2, it jumps straight to:
```python
# Dataset: sst2 (HuggingFace - cached download)
dataset = load_dataset(...)  # ❌ NameError: load_dataset not defined
```

### Issue 2: Missing Requirements ❌

**Location**: `backend/notebooks_mvp/textcnn_requirements.txt`
**Problem**: Missing `datasets` library

**Current requirements**:
```
matplotlib==3.9.0
numpy==1.26.4
pandas==2.2.2
scikit-learn==1.5.1
torch==2.2.2
torchvision==0.17.2
```

**Needed**:
```
datasets==2.19.0  # ← Missing!
```

### Issue 3: GOAL_VALUE Mismatch ⚠️

**Location**: Cell 3 (model evaluation)
**Problem**: Code has `GOAL_VALUE = 87.200000` but test plan shows target is `88.1%`

**Expected**: Should match the claim from the paper (88.1% accuracy on SST-2)

---

## 📝 Sprint Tasks

### Task 1: Fix Notebook Import Generation ✅ (Code Change Needed)

**File**: `backend/api/app/materialize/notebook.py`
**Function**: `build_notebook_bytes()`

**Change Required**: Collect and add imports from generators

**Before**:
```python
# Generate dataset and model code sections
dataset_code = dataset_gen.generate_code(plan)
model_code = model_gen.generate_code(plan)
```

**After**:
```python
# Collect imports from generators
dataset_imports = dataset_gen.generate_imports(plan)
model_imports = model_gen.generate_imports(plan)
all_imports = sorted(set(dataset_imports + model_imports))

# Generate dataset and model code sections
dataset_code = dataset_gen.generate_code(plan)
model_code = model_gen.generate_code(plan)
```

**Then** add imports to setup cell or create new imports cell.

### Task 2: Update Requirements Generation ✅ (Code Change Needed)

**File**: `backend/api/app/materialize/notebook.py`
**Function**: `build_requirements()`

**Change Required**: Collect requirements from generators

**Current Logic**:
```python
requirements = set(DEFAULT_REQUIREMENTS)
# ... adds torch/datasets based on string matching in framework/dataset name
```

**Better Logic**:
```python
requirements = set(DEFAULT_REQUIREMENTS)
dataset_reqs = dataset_gen.generate_requirements(plan)
model_reqs = model_gen.generate_requirements(plan)
requirements.update(dataset_reqs)
requirements.update(model_reqs)
```

### Task 3: Fix GOAL_VALUE in Model Generator ⚠️

**File**: `backend/api/app/materialize/generators/model.py`
**Line**: 72

The model generator already uses `plan.metrics[0].goal`, so this should be correct. The issue is likely in the **plan JSON itself** having wrong goal value.

**Action**: Check the plan in database or regenerate plan with correct claim value (88.1 instead of 87.2).

### Task 4: Regenerate TextCNN Notebook 🔄

After fixing the generator code, regenerate the notebook:

```bash
# Start API server
cd backend
python -m uvicorn app.main:app --app-dir api --log-level info

# Regenerate notebook (will use fixed generators)
curl -X POST http://localhost:8000/api/v1/plans/0d4f0ff4-730f-47dc-a387-7943806fe990/materialize
```

### Task 5: Execute Notebook Locally 🚀

```bash
cd backend/notebooks_mvp

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install requirements
pip install -r textcnn_requirements.txt

# Execute notebook
jupyter nbconvert --to notebook --execute textcnn_sst2.ipynb --output textcnn_sst2_executed.ipynb
```

**Monitor for**:
- Import errors (should be fixed now)
- SST-2 download progress (~67 MB)
- Training progress (should take 5-10 minutes)
- Final accuracy in metrics.json

### Task 6: Verify Outputs 📊

Check that execution produces:

**1. metrics.json**:
```json
{
  "metrics": {
    "accuracy": 0.75,  // Expected ~70-80% for bag-of-words baseline
    "precision": 0.73,
    "recall": 0.72,
    "accuracy_gap": -13.1  // 75% - 88.1% = -13.1%
  }
}
```

**2. events.jsonl**:
```jsonl
{"event": "stage_update", "stage": "seed_check", "seed": 42}
{"event": "stage_update", "stage": "dataset_load", "dataset": "sst2"}
{"event": "metric_update", "metric": "dataset_samples", "value": 5000}
{"event": "stage_update", "stage": "model_build", "model": "Convolutional Neural Network"}
{"event": "stage_update", "stage": "train"}
{"event": "stage_update", "stage": "evaluate"}
{"event": "metric_update", "metric": "accuracy", "value": 0.75}
{"event": "sample_pred", "label": 1, "stage": "evaluate"}
{"event": "stage_update", "stage": "complete"}
```

### Task 7: Document Results 📝

Create execution summary:
- Execution time
- Dataset loaded (SST-2, not synthetic)
- Final accuracy
- Accuracy gap vs. paper
- Any warnings or issues

---

## 🔍 Expected Results

### Performance Expectations

**Baseline Model (LogisticRegression + Bag-of-Words)**:
- Expected accuracy: **70-80%** on SST-2
- Paper's TextCNN accuracy: **88.1%**
- Expected gap: **-10% to -18%**

**Why the gap?**
- Paper uses real CNN with word embeddings
- We use simple bag-of-words + logistic regression
- This is **expected for Phase 2 baseline validation**
- Phase 3 will implement real TextCNN architecture

### Validation Checklist

- ✅ Real dataset loads (not synthetic)
- ✅ Training completes without errors
- ✅ Accuracy > 0.5 (better than random)
- ✅ Accuracy < 0.95 (not overfitting to toy data)
- ✅ metrics.json exists and is valid JSON
- ✅ events.jsonl exists with all expected stages
- ✅ Execution time < 15 minutes

---

## 🚧 Known Risks

### Risk 1: HuggingFace Download Timeout
**Probability**: Low
**Impact**: Medium
**Mitigation**: SST-2 is small (67MB), should download quickly. If timeout occurs, manually pre-download to cache.

### Risk 2: Import Errors After Fix
**Probability**: Low
**Impact**: High
**Mitigation**: Test generator import collection logic carefully. Add unit test for import aggregation.

### Risk 3: Low Accuracy (< 50%)
**Probability**: Low
**Impact**: Medium
**Mitigation**: If accuracy is too low, check that:
- Dataset loaded correctly (inspect `X_train.shape`)
- Labels are balanced (check `np.bincount(y_train)`)
- Vectorizer has reasonable features (check `len(vectorizer.vocabulary_)`)

---

## 📊 Success Metrics

### Quantitative
- ✅ Notebook executes without errors
- ✅ Execution time < 15 minutes
- ✅ Accuracy between 0.65 and 0.85
- ✅ Both metrics.json and events.jsonl produced

### Qualitative
- ✅ Code is readable and well-structured
- ✅ Logs show clear progress (dataset → train → evaluate → complete)
- ✅ Results are deterministic (re-run produces same accuracy)

---

## 🎯 Definition of Done

Sprint is **COMPLETE** when:
- [x] Code fixes implemented and tested
- [x] Notebook regenerated with fixes
- [x] Notebook executes successfully
- [x] metrics.json shows reasonable accuracy (0.65-0.85)
- [x] events.jsonl shows all stages
- [x] Results documented in this file
- [x] Sprint retrospective completed

---

## 🔄 Next Steps After Sprint

Once TextCNN baseline works:
1. **Execute CharCNN** (AG News dataset) - validate NLP pipeline diversity
2. **Execute DenseNet** (CIFAR-10) - validate vision pipeline
3. **Implement Phase 3 Models** - Add real TextCNN/CNN architectures
4. **Gap Analysis** - Compare all results to paper claims
5. **UI Integration** - Connect to frontend for demos

---

## 📁 Related Documentation

- [MVP Sprint Plan](./MVP_SPRINT__3_BENCHMARK_PAPERS.md) - Overall 3-paper sprint
- [Current Work Tracker](./CURRENT_WORK_TRACKER.md) - Daily progress log
- [Dataset Registry](../../../api/app/materialize/generators/dataset_registry.py) - Available datasets
- [Generator Factory](../../../api/app/materialize/generators/factory.py) - Smart selection logic

---

**Last Updated**: 2025-11-05
**Sprint Owner**: Development Team
**Status**: 🚀 ACTIVE - Task 1 in progress
