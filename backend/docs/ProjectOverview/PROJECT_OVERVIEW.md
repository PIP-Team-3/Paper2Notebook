# Paper2Notebook (P2N) - Project Overview

**Last Updated**: 2025-11-06

---

## What is Paper2Notebook?

Paper2Notebook (P2N) is an **autonomous system** that transforms machine learning research papers (PDFs) into **executable, reproducible Jupyter notebooks**. The goal is to automatically verify research claims by generating and running experiments with minimal human intervention.

### Core Value Proposition

1. **Automated Reproduction**: Convert PDF → Executable Code
2. **Claim Verification**: Compare notebook results to paper's reported metrics
3. **Autonomous Operation**: Minimal human intervention required
4. **Quality Assurance**: Built-in validation prevents faulty code execution

---

## System Architecture

### 6-Stage Pipeline

```
PDF → Ingest → Verify → Extract → Plan → Materialize → Execute
```

#### 1. **Ingest** (Complete ✅)
- Upload PDF to Supabase storage
- Extract text and create database entry
- **Status**: Production-ready

#### 2. **Verify** (Complete ✅)
- Check if paper is reproducible (has code, datasets, results)
- Uses OpenAI Agents SDK with structured outputs
- **Status**: Production-ready

#### 3. **Extract** (Complete ✅)
- Extract structured information: dataset, model, metrics, hyperparameters
- Uses OpenAI Agents SDK with tool calling
- **Status**: Production-ready

#### 4. **Plan** (Complete ✅)
- Generate execution plan (Plan JSON v1.1)
- Two-stage planner: coarse → detailed
- **Status**: Production-ready

#### 5. **Materialize** (In Progress 🔧)
- Generate Jupyter notebook + requirements.txt from plan
- Smart generator system (Phase 2)
- **NEW**: Autonomous validation before storage
- **Status**: Core functional, Phase 3 models pending

#### 6. **Execute** (Future 🔜)
- Run notebook in sandboxed environment
- Capture metrics and compare to paper claims
- **Status**: Manual execution works, automation pending

---

## Current Implementation Status

### Phase 2: Smart Baselines (Current)

**Goal**: Prove the pipeline works end-to-end with fast sklearn baselines

**What's Working**:
- ✅ Smart dataset selection (HuggingFace, Torchvision, sklearn)
- ✅ Dataset registry with 11 datasets
- ✅ LogisticRegression baseline for all models
- ✅ Autonomous validation system (syntax + sklearn parameters)
- ✅ Full pipeline execution (PDF → Executable Notebook)

**Intentional Limitations**:
- Uses LogisticRegression instead of actual CNN/ResNet architectures
- Fast training (~30 seconds) for rapid iteration
- Accuracy lower than paper claims (expected for baselines)

**Why Baselines?**:
- Validate pipeline infrastructure
- Fast debugging cycles
- Catch generator bugs early
- Build validation framework

### Phase 3: Real Models (Next)

**Goal**: Implement actual model architectures to match paper claims

**To Implement**:
- TextCNN generator (Conv1d + embeddings)
- CharCNN generator
- DenseNet/ResNet generators
- PyTorch training loops
- GPU support (optional)

**Expected Results**:
- Accuracy matches paper claims (±2%)
- Longer training times (5-30 minutes)
- True reproduction of research

---

## Technology Stack

### Backend (Python + FastAPI)
- **Framework**: FastAPI 0.110+
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: OpenAI Agents SDK 0.3.3
- **Notebooks**: nbformat 5.10+, nbclient 0.10+

### ML Libraries
- **sklearn**: Fast baselines (Phase 2)
- **PyTorch**: Deep learning models (Phase 3)
- **HuggingFace**: Dataset loading, transformers
- **torchvision**: Vision datasets

### Key Design Patterns
- **Generator Pattern**: Pluggable dataset/model generators
- **Factory Pattern**: Smart selection based on plan content
- **Validation-First**: Catch bugs before execution
- **Defensive Programming**: Assume generators are buggy

---

## Generator System

### How It Works

```python
# 1. Plan contains dataset/model names
plan.dataset.name = "SST-2"
plan.model.name = "TextCNN"

# 2. Factory selects appropriate generators
dataset_gen = GeneratorFactory.get_dataset_generator(plan)
# Returns: HuggingFaceDatasetGenerator (for SST-2)

model_gen = GeneratorFactory.get_model_generator(plan)
# Phase 2: Returns SklearnLogisticGenerator (baseline)
# Phase 3: Will return TorchTextCNNGenerator (real model)

# 3. Generators produce code
dataset_code = dataset_gen.generate_code(plan)
model_code = model_gen.generate_code(plan)
imports = dataset_gen.generate_imports(plan)
requirements = dataset_gen.generate_requirements(plan)

# 4. Notebook assembled and validated
notebook = assemble_notebook(imports, dataset_code, model_code)
validation_result = validator.validate(notebook)

# 5. Only upload if valid
if validation_result.valid:
    storage.upload(notebook)
```

### Available Generators

**Dataset Generators**:
- `HuggingFaceDatasetGenerator` - For GLUE, IMDB, AG News, etc.
- `TorchvisionDatasetGenerator` - For CIFAR-10, CIFAR-100, MNIST
- `SklearnDatasetGenerator` - For digits, iris
- `SyntheticDatasetGenerator` - Fallback for unknown datasets

**Model Generators** (Phase 2):
- `SklearnLogisticGenerator` - Fast baseline for all models

**Model Generators** (Phase 3 - Planned):
- `TorchTextCNNGenerator`
- `TorchCharCNNGenerator`
- `TorchDenseNetGenerator`
- `TorchResNetGenerator`

---

## Validation System (NEW - 11/6)

### Problem
Generators had bugs that only surfaced during notebook execution:
- Missing imports
- Missing dependencies
- Invalid sklearn parameters
- Syntax errors

This required human intervention at each failure.

### Solution: Autonomous Validation

**Phase 1 (Implemented)**:
1. **Syntax Validation**: Compile all cells to catch IndentationError, SyntaxError
2. **sklearn Parameter Validation**: Regex-based rules for common mistakes
3. **Integration**: Runs before notebook upload, fails fast with 422 error

**Phase 2 (Planned)**:
4. **AST-based Validation**: Parse code structure for deeper analysis
5. **Import Validation**: Verify all used functions are imported
6. **Dry-run Execution**: Execute first 3 cells in sandbox

**Results**:
- Before: 4 regeneration cycles, human intervention required
- After: Validated notebook executes successfully on first try

---

## Dataset Registry

### Purpose
Metadata-only catalog of supported datasets with:
- Source (HuggingFace, torchvision, sklearn)
- Size, license, aliases
- Load path and parameters

### Current Coverage: 11 Datasets

| Dataset | Source | Size | Use Case |
|---------|--------|------|----------|
| SST-2 | HuggingFace | 67MB | Sentiment (TextCNN) |
| AG News | HuggingFace | 35MB | Text classification (CharCNN) |
| CIFAR-10 | torchvision | 170MB | Vision (DenseNet) |
| CIFAR-100 | torchvision | 169MB | Vision |
| MNIST | torchvision | 15MB | Vision |
| IMDB | HuggingFace | 130MB | Sentiment |
| TREC | HuggingFace | 1MB | Question classification |
| Yahoo Answers | HuggingFace | 450MB | Topic classification |
| Yelp Polarity | HuggingFace | 200MB | Sentiment |
| digits | sklearn | 1MB | Classification |
| iris | sklearn | 1MB | Classification |

**Blocked Datasets** (too large):
- ImageNet, OpenImages, YFCC100M

---

## Key Metrics

### Performance (Phase 2 Baseline)
- **TextCNN (SST-2)**: 72.2% accuracy (LogisticRegression baseline)
- **Paper Claim**: 88.1% accuracy (actual TextCNN)
- **Gap**: -15.9% (expected for simplified baseline)
- **Training Time**: ~30 seconds (vs 5-10 min for real model)

### Code Quality
- **Validation Rate**: 100% (all generated notebooks pass validation)
- **Execution Success**: 100% (validated notebooks execute without errors)
- **Test Coverage**: (To be added)

---

## Development Workflow

### For New Developers

1. **Setup Environment**:
   ```bash
   cd backend
   python -m venv .venv
   .venv/Scripts/Activate.ps1  # Windows
   pip install -r api/requirements.txt
   ```

2. **Configure .env**:
   ```bash
   cd backend
   cp .env.example .env
   # Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
   ```

3. **Run API Server**:
   ```bash
   cd backend
   python manage.py start
   # Server runs on http://localhost:8000
   ```

4. **Test Full Pipeline**:
   ```bash
   # Ingest paper → Generate plan → Materialize notebook
   curl -X POST http://localhost:8000/api/v1/papers/ingest -F file=@paper.pdf
   curl -X POST http://localhost:8000/api/v1/plans/{plan_id}/materialize
   ```

### For Adding New Generators

1. Create generator class in `app/materialize/generators/`
2. Implement `CodeGenerator` interface:
   - `generate_code(plan)` → Python code string
   - `generate_imports(plan)` → List of import statements
   - `generate_requirements(plan)` → List of pip packages
3. Add to `GeneratorFactory` selection logic
4. Add validation rules to `validation.py`
5. Write unit tests in `tests/test_generators.py`

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed implementation plan.

**Short Term** (This Sprint):
- ✅ Phase 2 baseline execution
- ✅ Autonomous validation system
- 🔜 Fix GOAL_VALUE calculation bug
- 🔜 Test validation catches all 4 bug types

**Medium Term** (Next Sprint):
- Implement Phase 3 TextCNN generator
- Implement CharCNN and DenseNet generators
- Add AST-based validation
- Add dry-run execution

**Long Term**:
- Automated execution service
- Multi-GPU support
- Distributed training
- Web frontend for monitoring

---

## Contributing

We welcome contributions! Focus areas:
1. New model generators (Phase 3)
2. Additional validation checks
3. Test coverage improvements
4. Documentation updates

See [CONTRIBUTING.md](../Archive_2025_11_06/CONTRIBUTING.md) for archived guidelines.

---

## License

[Add license information]

---

## Contact

[Add contact information]

---

**Navigation**:
- [Roadmap](./ROADMAP.md)
- [Active Sprint](../ActiveSprint/)
- [Archived Docs](../Archive_2025_11_06/)
