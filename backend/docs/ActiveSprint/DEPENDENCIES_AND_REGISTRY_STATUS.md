# Dependencies & Dataset Registry Status

**Date**: 2025-11-05
**Context**: Sprint 11/5 - TextCNN Execution

---

## ✅ API Requirements Status

### Current requirements.txt Location
`backend/api/requirements.txt`

### Installed Dependencies
```
fastapi>=0.110,<1.0
uvicorn[standard]>=0.23,<1.0
openai==1.109.1
openai-agents==0.3.3
pydantic-settings>=2.2,<3.0
supabase>=2.5,<3.0
python-multipart>=0.0.9,<1.0
nbformat>=5.10,<6.0
nbclient>=0.10,<0.11
```

### ⚠️ MISSING: Runtime Dependencies for Notebooks

The API requirements **DO NOT** include the dependencies needed to **execute** the generated notebooks. These are the libraries that the notebooks themselves will import:

**Missing Runtime Deps**:
- ❌ `numpy` - Used by all notebooks
- ❌ `scikit-learn` - Used by model training
- ❌ `pandas` - Used for data manipulation
- ❌ `matplotlib` - Used for plotting
- ❌ `datasets` - Used for HuggingFace dataset loading
- ❌ `torch` / `torchvision` - Used for PyTorch datasets
- ❌ `transformers` - May be needed for some HF datasets

**Why they're missing**: These are **notebook execution dependencies**, not API server dependencies. They belong in:
1. Generated `requirements.txt` per notebook (✅ handled by generators)
2. Separate notebook execution environment (worker/sandbox)

**For local testing**: You'll need to install these when executing notebooks manually.

---

## 📊 Dataset Registry Summary

### Total Datasets: **11**

### Breakdown by Source:
- **sklearn**: 2 datasets (bundled, no download)
- **torchvision**: 3 datasets (cached download on first use)
- **huggingface**: 6 datasets (cached download on first use)

### Complete Dataset List

| Dataset Name | Source | Size | License | Aliases |
|--------------|--------|------|---------|---------|
| **agnews** | huggingface | 35MB | Apache-2.0 | ag_news, ag, ag-news |
| **cifar10** | torchvision | 170MB | MIT | cifar_10, cifar-10 |
| **cifar100** | torchvision | 169MB | MIT | cifar_100, cifar-100 |
| **digits** | sklearn | 1MB | BSD-3-Clause | sklearn_digits, digit |
| **imdb** | huggingface | 130MB | Apache-2.0 | imdb_reviews, imdb_sentiment |
| **iris** | sklearn | 1MB | BSD-3-Clause | sklearn_iris |
| **mnist** | torchvision | 15MB | CC-BY-SA-3.0 | mnist_vision, torch_mnist |
| **sst2** | huggingface | 67MB | other (GLUE) | sst-2, glue/sst2, sst_2, stanford_sentiment |
| **trec** | huggingface | 1MB | unknown | trec-6 |
| **yahooanswerstopics** | huggingface | 450MB | unknown | yahoo_answers_topics, yahoo_answers |
| **yelppolarity** | huggingface | 200MB | unknown | yelp_polarity, yelp_p, yelp |

---

## ✅ Benchmark Papers Dataset Coverage

All 3 benchmark papers have their datasets **registered and ready**:

### 1. TextCNN (Kim 2014)
- **Dataset**: SST-2 (Stanford Sentiment Treebank)
- **Registry Status**: ✅ **FOUND** as `sst2`
- **Source**: HuggingFace
- **Load Path**: `load_dataset("glue", "sst2")`
- **Size**: 67 MB
- **License**: GLUE (custom research license)

### 2. CharCNN (Zhang 2015)
- **Dataset**: AG News
- **Registry Status**: ✅ **FOUND** as `agnews`
- **Source**: HuggingFace
- **Load Path**: `load_dataset("ag_news")`
- **Size**: 35 MB
- **License**: Apache-2.0

### 3. DenseNet (Huang 2017)
- **Dataset**: CIFAR-10
- **Registry Status**: ✅ **FOUND** as `cifar10`
- **Source**: Torchvision
- **Load Function**: `datasets.CIFAR10()`
- **Size**: 170 MB
- **License**: MIT

---

## 🔧 How Dataset Loading Works

### Phase 2 Smart Generator System (Current)

1. **Plan contains dataset name** (e.g., "SST-2")
2. **GeneratorFactory looks up in registry**:
   ```python
   metadata = lookup_dataset("SST-2")
   # Normalizes to "sst2" and finds match
   ```
3. **Returns appropriate generator**:
   - `HuggingFaceDatasetGenerator` for SST-2
   - `TorchvisionDatasetGenerator` for CIFAR-10
   - `SklearnDatasetGenerator` for digits/iris
   - `SyntheticDatasetGenerator` as fallback

4. **Generator produces code**:
   - Imports: `from datasets import load_dataset`
   - Code: `load_dataset("glue", "sst2", cache_dir=...)`
   - Requirements: `datasets>=2.14.0`

### Caching Behavior

**HuggingFace datasets**:
- Uses `DATASET_CACHE_DIR` (default: `./data/cache`)
- Downloads only if not cached
- Respects `OFFLINE_MODE=true` for offline execution

**Torchvision datasets**:
- Uses `DATASET_CACHE_DIR` (default: `./data`)
- `download=True` checks cache first
- Only downloads if missing from cache

**sklearn datasets**:
- Bundled with sklearn
- No download needed

---

## 🚫 Blocked Datasets

The following datasets are **blocked** (too large or restricted):
- imagenet, imagenet1k, imagenet2012, imagenet21k
- openimages
- yfcc100m

If a plan references these, the planner will warn and skip them.

---

## 📝 Next Steps for Dependencies

### For API Server (Now)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r api\requirements.txt
```

This installs everything needed to **run the API** and **generate notebooks**.

### For Notebook Execution (Later)
When you want to execute a generated notebook locally:

```powershell
cd backend/notebooks_mvp

# Create separate notebook execution environment
python -m venv .venv_notebooks
.\.venv_notebooks\Scripts\Activate.ps1

# Install from the GENERATED requirements.txt
pip install -r textcnn_requirements.txt
```

The generated requirements will include:
- numpy, scikit-learn, pandas, matplotlib (from DEFAULT_REQUIREMENTS)
- datasets (from HuggingFaceDatasetGenerator)
- torch, torchvision (if needed by the dataset generator)

---

## 🎯 Summary

**Question**: Are all deps in api/requirements.txt?
**Answer**:
- ✅ **YES** for running the API server
- ❌ **NO** for executing notebooks (those go in generated requirements per notebook)

**Question**: Does registry contain the datasets we need?
**Answer**: ✅ **YES** - All 3 benchmark papers (TextCNN, CharCNN, DenseNet) have their datasets registered

**Question**: How many datasets in registry?
**Answer**: **11 datasets** covering:
- 2 sklearn (bundled)
- 3 torchvision (vision tasks)
- 6 huggingface (NLP tasks)

**Ready to proceed**: ✅ You can now install API deps and start the server!
