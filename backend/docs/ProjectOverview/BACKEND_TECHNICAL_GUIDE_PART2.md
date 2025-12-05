# Backend Technical Deep-Dive - Part 2: Materialize, Execute & Architecture

**Last Updated**: 2025-11-08
**For**: Team members learning the backend architecture
**Covers**: Stages 5-6 of the pipeline + system architecture

---

## Table of Contents

1. [Stage 5: Materialize](#stage-5-materialize)
2. [Stage 6: Execute](#stage-6-execute)
3. [Generator Architecture](#generator-architecture)
4. [Validation System](#validation-system)
5. [Database Schema](#database-schema)
6. [Error Handling](#error-handling)
7. [Configuration & Environment](#configuration--environment)
8. [System Architecture Patterns](#system-architecture-patterns)

---

## Stage 5: Materialize

### Purpose
Convert Plan JSON v1.1 into **executable artifacts**: Jupyter Notebook + requirements.txt

### Critical Concept: NO LLMs

**This stage uses ZERO LLMs**. All code generation is **template-based Python**.

**Why no LLMs?**
- Reliability: No hallucinated code
- Validation: Can check generated code before execution
- Speed: Instant generation (no API calls)
- Cost: Free (no LLM tokens)
- Maintainability: Easy to fix bugs in generators

### API Endpoint
```http
POST /api/v1/plans/{plan_id}/materialize
```

**Response**: JSON (synchronous, ~1-3 seconds)

### Code Location
- **Router**: `api/app/routers/plans.py`
- **Endpoint function**: `materialize_plan_assets()`
- **Lines**: ~849-925
- **Notebook builder**: `api/app/materialize/notebook.py`
- **Generators**: `api/app/materialize/generators/`

### Step-by-Step Process

#### 1. Load Plan from Database
```python
plan_record = db.get_plan(plan_id)
if not plan_record:
    raise HTTPException(404, "E_PLAN_NOT_FOUND")

plan = PlanDocumentV11.model_validate(plan_record.plan_json)
```

#### 2. Select Generators (Factory Pattern)
```python
from app.materialize.generators.factory import GeneratorFactory

dataset_gen = GeneratorFactory.get_dataset_generator(plan)
model_gen = GeneratorFactory.get_model_generator(plan)
```

**How the factory works**:
```python
class GeneratorFactory:
    @staticmethod
    def get_dataset_generator(plan: PlanDocumentV11) -> CodeGenerator:
        # Look up dataset in registry
        dataset_name = plan.dataset.name
        metadata = DATASET_REGISTRY.get(dataset_name)

        if not metadata:
            # Unknown dataset → Synthetic fallback
            return SyntheticDatasetGenerator()

        # Match on source type
        if metadata.source == DatasetSource.HUGGINGFACE:
            return HuggingFaceDatasetGenerator()
        elif metadata.source == DatasetSource.TORCHVISION:
            return TorchvisionDatasetGenerator()
        elif metadata.source == DatasetSource.SKLEARN:
            return SklearnDatasetGenerator()
        else:
            return SyntheticDatasetGenerator()

    @staticmethod
    def get_model_generator(plan: PlanDocumentV11) -> CodeGenerator:
        # Phase 2: Always returns LogisticRegression baseline
        return SklearnLogisticGenerator()

        # Phase 3: Will check plan.model.name
        # if plan.model.name == "TextCNN":
        #     return TorchTextCNNGenerator()
        # elif plan.model.name == "CharCNN":
        #     return TorchCharCNNGenerator()
        # ...
```

**Key insight**: Factory pattern allows **smart selection** based on plan content.

#### 3. Generate Notebook
```python
from app.materialize.notebook import build_notebook_bytes

notebook_bytes = build_notebook_bytes(plan, plan_id)
```

**Notebook structure** (5 main cells):

##### Cell 1: Title & Description (Markdown)
```markdown
# Reproduction Plan: {plan.dataset.name} with {plan.model.name}

**Paper**: {paper_title}
**Plan ID**: {plan_id}
**Dataset**: {plan.dataset.name} ({plan.dataset.source})
**Model**: {plan.model.name}
**Target Metric**: {plan.metrics.primary} = {plan.metrics.goal_value}

---

## Justifications

**Dataset**: "{plan.justifications.dataset.quote}"
*Source: {plan.justifications.dataset.citation}*

**Model**: "{plan.justifications.model.quote}"
*Source: {plan.justifications.model.citation}*
```

##### Cell 2: Setup & Seed Configuration (Code)
```python
import json
import os
import random
import sys
from pathlib import Path

import numpy as np

# Reproducibility seed
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# Check for GPU (must be CPU-only)
def check_cpu_only():
    if 'CUDA_VISIBLE_DEVICES' in os.environ and os.environ['CUDA_VISIBLE_DEVICES'] != '-1':
        raise RuntimeError("GPU detected! This plan requires CPU-only execution.")

check_cpu_only()

# Event logging helper
def log_event(event_type, payload):
    with open('events.jsonl', 'a') as f:
        f.write(json.dumps({"type": event_type, "payload": payload}) + '\n')

log_event("run_start", {"plan_id": "{plan_id}", "seed": SEED})
```

##### Cell 3: Imports (Code)
```python
# Collect imports from generators
dataset_imports = dataset_gen.generate_imports(plan)
model_imports = model_gen.generate_imports(plan)
all_imports = sorted(set(dataset_imports + model_imports))

# Example for SST-2 + LogisticRegression:
# from datasets import load_dataset
# from sklearn.feature_extraction.text import CountVectorizer
# from sklearn.linear_model import LogisticRegression
# from sklearn.metrics import accuracy_score
```

##### Cell 4: Load Dataset (Code)
```python
# Generated by dataset generator
dataset_code = dataset_gen.generate_code(plan)

# Example for SST-2 (HuggingFaceDatasetGenerator):
"""
from datasets import load_dataset

# Load dataset
dataset = load_dataset("glue", "sst2")

# Extract train/test splits
X_train = [x['sentence'] for x in dataset['train']]
y_train = [x['label'] for x in dataset['train']]
X_test = [x['sentence'] for x in dataset['validation']]
y_test = [x['label'] for x in dataset['validation']]

print(f"Train samples: {len(X_train)}")
print(f"Test samples: {len(X_test)}")
log_event("dataset_loaded", {"train_size": len(X_train), "test_size": len(X_test)})

# Vectorize text (bag-of-words for Phase 2)
vectorizer = CountVectorizer(max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

print(f"Feature dimensions: {X_train_vec.shape[1]}")
"""
```

##### Cell 5: Train Model & Evaluate (Code)
```python
# Generated by model generator
model_code = model_gen.generate_code(plan)

# Example for LogisticRegression (SklearnLogisticGenerator):
"""
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Train model
print("Training LogisticRegression...")
model = LogisticRegression(random_state=SEED, max_iter=1000)
model.fit(X_train_vec, y_train)
log_event("training_complete", {"model": "LogisticRegression"})

# Evaluate
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)

print(f"Accuracy: {accuracy:.4f}")
log_event("evaluation_complete", {"accuracy": accuracy})

# Save metrics
with open('metrics.json', 'w') as f:
    json.dump({
        "accuracy": accuracy,
        "model": "LogisticRegression",
        "dataset": "sst2",
        "goal_value": 0.881,
        "gap": ((accuracy - 0.881) / 0.881) * 100
    }, f)

print(f"Metrics saved to metrics.json")
"""
```

#### 4. Build Requirements.txt
```python
from app.materialize.notebook import build_requirements

requirements_text, env_hash = build_requirements(plan)
```

**How requirements are built**:
```python
def build_requirements(plan: PlanDocumentV11) -> Tuple[str, str]:
    # Start with defaults
    requirements = set([
        "numpy==1.26.4",
        "scikit-learn==1.5.1",
        "pandas==2.2.2",
        "matplotlib==3.9.2"
    ])

    # Add generator-specific requirements
    dataset_gen = GeneratorFactory.get_dataset_generator(plan)
    model_gen = GeneratorFactory.get_model_generator(plan)

    requirements.update(dataset_gen.generate_requirements(plan))
    requirements.update(model_gen.generate_requirements(plan))

    # Sort and format
    sorted_reqs = sorted(requirements)
    requirements_text = "\n".join(sorted_reqs) + "\n"

    # Compute hash for environment fingerprint
    env_hash = hashlib.sha256(requirements_text.encode()).hexdigest()

    return requirements_text, env_hash
```

**Example requirements.txt** (SST-2 + LogisticRegression):
```
datasets==3.0.1
matplotlib==3.9.2
numpy==1.26.4
pandas==2.2.2
scikit-learn==1.5.1
transformers==4.45.1
```

#### 5. Validate Notebook
```python
from app.materialize.validation import NotebookValidator

validator = NotebookValidator()
validation_result = validator.validate(notebook_bytes)

if not validation_result.valid:
    raise HTTPException(422, {
        "code": "NOTEBOOK_VALIDATION_FAILED",
        "errors": validation_result.errors
    })
```

**Validation checks** (see [Validation System](#validation-system) for details):
1. Syntax: All cells compile without errors
2. sklearn parameters: No forbidden parameters (e.g., `CountVectorizer(random_state=...)`)
3. Imports: (Future) All imports are available

#### 6. Store Artifacts in Supabase
```python
notebook_key = f"{plan_id}/notebook.ipynb"
env_key = f"{plan_id}/requirements.txt"

plans_storage.store_text(notebook_key, notebook_bytes.decode('utf-8'), "text/plain")
plans_storage.store_text(env_key, requirements_text, "text/plain")
```

**Storage bucket**: `plans` (separate from `papers` bucket)

**Storage structure**:
```
plans/
├── plan_abc123/
│   ├── notebook.ipynb
│   └── requirements.txt
├── plan_def456/
│   ├── notebook.ipynb
│   └── requirements.txt
```

#### 7. Update Plan Record
```python
db.set_plan_env_hash(plan_id, env_hash)
```

**env_hash purpose**:
- Fingerprint of requirements.txt
- Ensures notebook is materialized before execution
- Allows checking if environment needs rebuild

#### 8. Return Response
```json
{
  "notebook_asset_path": "plan_abc123/notebook.ipynb",
  "env_asset_path": "plan_abc123/requirements.txt",
  "env_hash": "sha256:a1b2c3d4..."
}
```

### Get Signed URLs
```http
GET /api/v1/plans/{plan_id}/assets
```

**Returns**:
```json
{
  "notebook_signed_url": "https://xxx.supabase.co/storage/v1/object/sign/plans/plan_abc123/notebook.ipynb?token=...",
  "env_signed_url": "https://xxx.supabase.co/storage/v1/object/sign/plans/plan_abc123/requirements.txt?token=...",
  "expires_at": "2025-11-08T12:35:00Z"
}
```

**TTL**: 120 seconds (short-lived for security)

### Error Handling

| Error Code | Cause | Remediation |
|------------|-------|-------------|
| `E_PLAN_NOT_FOUND` | Plan record missing | Create plan first |
| `NOTEBOOK_VALIDATION_FAILED` | Syntax or parameter errors | Check generator code, fix bugs |
| `E_DB_UPDATE_FAILED` | Database write failed | Retry |

---

## Stage 6: Execute

### Purpose
Run the generated Jupyter Notebook and capture results (metrics, logs, events).

### API Endpoint
```http
POST /api/v1/plans/{plan_id}/run
```

**Response**: `{"run_id": "..."}` (202 Accepted)

**Stream events**:
```http
GET /api/v1/runs/{run_id}/events
```

### Code Location
- **Router**: `api/app/routers/runs.py`
- **Endpoint function**: `start_run()` (lines ~223-272)
- **Background task**: `_run_plan()` (lines ~66-220)
- **Execution**: `api/app/run/runner_local.py`

### Step-by-Step Process

#### 1. Validate Plan is Materialized
```python
plan_record = db.get_plan(plan_id)
env_hash = getattr(plan_record, "env_hash", None)

if not env_hash:
    raise HTTPException(400, "E_PLAN_NOT_MATERIALIZED")
```

**Why check env_hash?**
- Ensures materialize ran successfully
- Notebook and requirements.txt exist
- Prevents execution of non-existent artifacts

#### 2. Create Run Record
```python
run_id = str(uuid4())

db.insert_run(RunCreate(
    id=run_id,
    plan_id=plan_id,
    paper_id=plan_record.paper_id,
    status="pending",
    env_hash=env_hash,
    seed=42,
    created_at=datetime.now(timezone.utc)
))
```

**Database table**: `runs`

#### 3. Launch Background Task
```python
from app.run.manager import run_stream_manager

run_stream_manager.register(run_id)
asyncio.create_task(_run_plan(plan_record, run_id, db, storage))

return {"run_id": run_id}
```

**Why async task?**
- Notebook execution takes 30 seconds - 20 minutes
- Don't block HTTP request
- Return immediately with run_id
- Client polls/streams for progress

#### 4. Background Task: `_run_plan()`

##### Step 4a: Download Notebook
```python
notebook_key = f"plans/{plan_id}/notebook.ipynb"
notebook_bytes = storage.download(notebook_key)
```

##### Step 4b: Execute Notebook
```python
from app.run.runner_local import execute_notebook

result = await execute_notebook(
    notebook_bytes=notebook_bytes,
    emit=emit_event_fn,
    timeout_minutes=budget_minutes,
    seed=42
)
```

**What `execute_notebook` does** (see below for detailed flow).

##### Step 4c: Persist Artifacts
```python
# Save metrics (required)
storage.store_text(
    f"runs/{run_id}/metrics.json",
    result.metrics_text,
    "application/json"
)

# Save events (optional)
if result.events_text:
    storage.store_text(
        f"runs/{run_id}/events.jsonl",
        result.events_text,
        "application/jsonl"
    )

# Save logs (captured stdout/stderr)
storage.store_text(
    f"runs/{run_id}/logs.txt",
    result.logs_text,
    "text/plain"
)
```

**Artifact storage**: `papers` bucket (runs are tied to papers)

##### Step 4d: Update Run Status
```python
db.update_run(
    run_id,
    status="completed",
    completed_at=datetime.now(timezone.utc),
    duration_sec=(completed_at - started_at).total_seconds()
)
```

### Notebook Execution Flow (runner_local.py)

#### 1. Enforce CPU-Only
```python
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

# Also check inside notebook (Cell 2 checks this)
if 'CUDA_VISIBLE_DEVICES' in os.environ and os.environ['CUDA_VISIBLE_DEVICES'] != '-1':
    raise GPURequestedError("GPU detected, execution blocked")
```

**Why CPU-only?**
- Phase 2/3: No GPU dependencies
- Cost control (CPU is free)
- Reproducibility (GPU randomness harder to control)

#### 2. Set Deterministic Seeds
```python
import random
import numpy as np

random.seed(seed)
np.random.seed(seed)

# If torch is imported, also seed it
try:
    import torch
    torch.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
except ImportError:
    pass
```

#### 3. Create Temporary Directory
```python
import tempfile

with tempfile.TemporaryDirectory() as tmpdir:
    notebook_path = os.path.join(tmpdir, "notebook.ipynb")

    # Write notebook to temp dir
    with open(notebook_path, 'wb') as f:
        f.write(notebook_bytes)
```

**Why temp directory?**
- Isolate execution (no file conflicts)
- Automatic cleanup on completion
- Safe parallel execution (multiple runs don't interfere)

#### 4. Initialize nbclient
```python
import nbformat
from nbclient import NotebookClient

nb = nbformat.read(notebook_path, as_version=4)

client = NotebookClient(
    nb,
    timeout=timeout_minutes * 60,  # Convert to seconds
    kernel_name="python3",
    resources={"metadata": {"path": tmpdir}}
)
```

**nbclient**: Official Jupyter notebook execution library

#### 5. Execute Cells
```python
cell_count = len(nb.cells)

for i, cell in enumerate(nb.cells):
    if cell.cell_type != "code":
        continue

    emit("progress", {"percent": int((i / cell_count) * 100)})
    emit("log_line", {"message": f"Executing cell {i+1}/{cell_count}..."})

    try:
        client.execute_cell(cell, cell_index=i)
    except CellExecutionError as e:
        raise NotebookExecutionError(f"Cell {i} failed: {str(e)}")

    # Flush events.jsonl to SSE
    _flush_notebook_events(tmpdir, emit)
```

**Cell execution** (nbclient):
1. Starts Python kernel
2. Executes cell code
3. Captures stdout/stderr
4. Stores outputs in cell metadata
5. Raises `CellExecutionError` if cell fails

#### 6. Flush Notebook Events
```python
def _flush_notebook_events(tmpdir, emit):
    events_path = os.path.join(tmpdir, "events.jsonl")
    if not os.path.exists(events_path):
        return

    with open(events_path, 'r') as f:
        for line in f:
            try:
                event = json.loads(line)
                emit(event["type"], event["payload"])
            except json.JSONDecodeError:
                pass
```

**Why flush events?**
- Notebook emits events via `log_event()` helper
- Events written to events.jsonl
- Flush to SSE stream for real-time progress
- Client sees: "dataset_loaded", "training_complete", etc.

#### 7. Validate Artifacts
```python
# Check metrics.json exists
metrics_path = os.path.join(tmpdir, "metrics.json")
if not os.path.exists(metrics_path):
    raise NotebookExecutionError("metrics.json not found")

# Load metrics
with open(metrics_path, 'r') as f:
    metrics = json.load(f)

# Validate required fields
if "accuracy" not in metrics:
    raise NotebookExecutionError("metrics.json missing 'accuracy' field")
```

**Required artifacts**:
- `metrics.json` - REQUIRED (contains results)
- `events.jsonl` - OPTIONAL (event log)
- Logs captured from stdout/stderr - AUTOMATIC

#### 8. Apply Size Caps & Truncation
```python
MAX_LOG_SIZE = 2 * 1024 * 1024  # 2 MiB
MAX_EVENTS_SIZE = 5 * 1024 * 1024  # 5 MiB

# Truncate logs if too large
logs_text = capture_logs()
if len(logs_text) > MAX_LOG_SIZE:
    logs_text = logs_text[:MAX_LOG_SIZE] + "\n\n__TRUNCATED__\n"

# Truncate events if too large
events_text = read_events_jsonl()
if len(events_text) > MAX_EVENTS_SIZE:
    events_text = events_text[:MAX_EVENTS_SIZE] + "\n__TRUNCATED__\n"
```

**Why cap sizes?**
- Prevent storage bloat
- Database insertion limits
- Client download limits

#### 9. Return Result
```python
return NotebookRunResult(
    metrics_text=metrics_json,
    events_text=events_jsonl,
    logs_text=captured_logs
)
```

### Event Stream (SSE)

**Events emitted during execution**:

| Event | Payload | When |
|-------|---------|------|
| `stage_update` | `{stage: "run_start"}` | Execution begins |
| `progress` | `{percent: 0-100}` | Per cell |
| `log_line` | `{message: "..."}` | Stdout/stderr |
| `dataset_loaded` | `{train_size, test_size}` | From notebook |
| `training_complete` | `{model: "..."}` | From notebook |
| `evaluation_complete` | `{accuracy: 0.722}` | From notebook |
| `stage_update` | `{stage: "complete"}` | Execution done |
| `error` | `{message, code}` | On failure |

**Client-side streaming**:
```javascript
const eventSource = new EventSource('/api/v1/runs/abc123/events');

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  updateProgressBar(data.percent);
});

eventSource.addEventListener('evaluation_complete', (e) => {
  const data = JSON.parse(e.data);
  showResults(data.accuracy);
});

eventSource.addEventListener('stage_update', (e) => {
  const data = JSON.parse(e.data);
  if (data.stage === 'complete') {
    eventSource.close();
  }
});
```

### Error Handling

| Error Code | Cause | Remediation |
|------------|-------|-------------|
| `E_PLAN_NOT_MATERIALIZED` | env_hash missing | Run materialize first |
| `E_RUN_TIMEOUT` | Exceeded budget_minutes | Increase timeout or optimize notebook |
| `E_RUN_FAILED` | Cell execution error | Check logs, fix notebook |
| `E_GPU_REQUESTED` | CUDA detected | Remove GPU code |

### Execution Guarantees

1. **Deterministic**: Same seed → same results
2. **CPU-only**: GPU usage blocked
3. **Timeout-enforced**: Budget respected
4. **Artifact-validated**: metrics.json required
5. **Size-capped**: Logs/events truncated if too large

---

## Generator Architecture

### Base Generator Interface
```python
from abc import ABC, abstractmethod
from typing import List

class CodeGenerator(ABC):
    @abstractmethod
    def generate_imports(self, plan: PlanDocumentV11) -> List[str]:
        """Return list of import statements."""
        pass

    @abstractmethod
    def generate_code(self, plan: PlanDocumentV11) -> str:
        """Return Python code for this component."""
        pass

    @abstractmethod
    def generate_requirements(self, plan: PlanDocumentV11) -> List[str]:
        """Return list of pip requirements."""
        pass
```

### Dataset Generators

#### HuggingFaceDatasetGenerator
**Purpose**: Load HuggingFace datasets (SST-2, AG News, IMDB, etc.)

**Example code generation**:
```python
def generate_code(self, plan):
    dataset_id = DATASET_REGISTRY["sst2"]["hf_dataset"]  # "glue"
    config = DATASET_REGISTRY["sst2"]["hf_config"]      # "sst2"

    return f'''
from datasets import load_dataset

# Load dataset
dataset = load_dataset("{dataset_id}", "{config}")

# Extract splits
X_train = [x['sentence'] for x in dataset['train']]
y_train = [x['label'] for x in dataset['train']]
X_test = [x['sentence'] for x in dataset['validation']]
y_test = [x['label'] for x in dataset['validation']]

# Vectorize text
from sklearn.feature_extraction.text import TfidfVectorizer
vectorizer = TfidfVectorizer(max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)
'''
```

**Requirements**:
```python
def generate_requirements(self, plan):
    return ["datasets==3.0.1", "transformers==4.45.1"]
```

#### TorchvisionDatasetGenerator
**Purpose**: Load torchvision datasets (CIFAR-10, MNIST, etc.)

**Example code generation** (CIFAR-10):
```python
def generate_code(self, plan):
    return '''
import torchvision
from torchvision import transforms

# Download and load dataset
transform = transforms.ToTensor()
train_dataset = torchvision.datasets.CIFAR10(
    root='./data',
    train=True,
    download=True,
    transform=transform
)
test_dataset = torchvision.datasets.CIFAR10(
    root='./data',
    train=False,
    download=True,
    transform=transform
)

# Convert to numpy (for sklearn compatibility)
X_train = train_dataset.data.reshape(50000, -1)
y_train = np.array(train_dataset.targets)
X_test = test_dataset.data.reshape(10000, -1)
y_test = np.array(test_dataset.targets)
'''
```

**Requirements**:
```python
def generate_requirements(self, plan):
    return ["torch==2.4.1", "torchvision==0.19.1"]
```

#### SklearnDatasetGenerator
**Purpose**: Load bundled sklearn datasets (20newsgroups)

**Example code generation**:
```python
def generate_code(self, plan):
    return '''
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer

# Load dataset
train = fetch_20newsgroups(subset='train')
test = fetch_20newsgroups(subset='test')

X_train = train.data
y_train = train.target
X_test = test.data
y_test = test.target

# Vectorize
vectorizer = CountVectorizer(max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)
'''
```

#### SyntheticDatasetGenerator
**Purpose**: Fallback for unknown datasets

**Example code generation**:
```python
def generate_code(self, plan):
    return '''
from sklearn.datasets import make_classification

# Generate synthetic data
X_train, y_train = make_classification(
    n_samples=10000,
    n_features=100,
    n_informative=50,
    n_redundant=10,
    random_state=SEED
)
X_test, y_test = make_classification(
    n_samples=2000,
    n_features=100,
    n_informative=50,
    n_redundant=10,
    random_state=SEED + 1
)
'''
```

### Model Generators

#### SklearnLogisticGenerator (Phase 2)
**Purpose**: Fast sklearn baseline for all models

**Example code generation**:
```python
def generate_code(self, plan):
    return '''
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Train model
model = LogisticRegression(random_state=SEED, max_iter=1000)
model.fit(X_train_vec, y_train)

# Evaluate
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)

print(f"Accuracy: {accuracy:.4f}")

# Save metrics
with open('metrics.json', 'w') as f:
    json.dump({"accuracy": accuracy}, f)
'''
```

**Requirements**:
```python
def generate_requirements(self, plan):
    return ["scikit-learn==1.5.1"]
```

#### TorchTextCNNGenerator (Phase 3 - Future)
**Purpose**: Real TextCNN implementation

**Example code generation** (planned):
```python
def generate_code(self, plan):
    return '''
import torch
import torch.nn as nn

class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.conv1 = nn.Conv1d(embed_dim, 100, kernel_size=3)
        self.conv2 = nn.Conv1d(embed_dim, 100, kernel_size=4)
        self.conv3 = nn.Conv1d(embed_dim, 100, kernel_size=5)
        self.fc = nn.Linear(300, num_classes)

    def forward(self, x):
        x = self.embedding(x).permute(0, 2, 1)
        c1 = torch.relu(self.conv1(x)).max(dim=2)[0]
        c2 = torch.relu(self.conv2(x)).max(dim=2)[0]
        c3 = torch.relu(self.conv3(x)).max(dim=2)[0]
        out = torch.cat([c1, c2, c3], dim=1)
        return self.fc(out)

# Training loop
model = TextCNN(vocab_size=5000, embed_dim=300, num_classes=2)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

for epoch in range(10):
    # Training code...
    pass

# Evaluation
accuracy = evaluate(model, test_loader)
'''
```

### Dataset Registry

**Purpose**: Metadata catalog for supported datasets

**Structure**:
```python
@dataclass
class DatasetMetadata:
    name: str                    # Canonical name (e.g., "sst2")
    source: DatasetSource        # SKLEARN | TORCHVISION | HUGGINGFACE
    split_available: List[str]   # ["train", "test", "validation"]
    aliases: Set[str]            # {"SST-2", "sst2", "Stanford Sentiment"}
    typical_size_mb: int         # Download size estimate
    description: str             # Human-readable description

    # HuggingFace-specific
    hf_dataset: Optional[str]    # "glue"
    hf_config: Optional[str]     # "sst2"

DATASET_REGISTRY: Dict[str, DatasetMetadata] = {
    "sst2": DatasetMetadata(
        name="sst2",
        source=DatasetSource.HUGGINGFACE,
        split_available=["train", "validation"],
        aliases={"sst-2", "sst2", "stanford sentiment treebank"},
        typical_size_mb=5,
        description="Stanford Sentiment Treebank (binary classification)",
        hf_dataset="glue",
        hf_config="sst2"
    ),
    "ag_news": DatasetMetadata(
        name="ag_news",
        source=DatasetSource.HUGGINGFACE,
        split_available=["train", "test"],
        aliases={"ag news", "agnews"},
        typical_size_mb=30,
        description="AG News topic classification (4 classes)",
        hf_dataset="ag_news",
        hf_config=None
    ),
    # ... 11 total datasets
}
```

**Lookup functions**:
```python
def normalize_dataset_name(name: str) -> str:
    """Lowercase, strip punctuation."""
    return name.lower().replace("-", "").replace("_", "")

def lookup_dataset(name: str) -> Optional[DatasetMetadata]:
    """Find dataset by name or alias."""
    normalized = normalize_dataset_name(name)

    # Exact match
    if normalized in DATASET_REGISTRY:
        return DATASET_REGISTRY[normalized]

    # Alias match
    for metadata in DATASET_REGISTRY.values():
        if normalized in {normalize_dataset_name(a) for a in metadata.aliases}:
            return metadata

    return None
```

---

## Validation System

### Purpose
Catch bugs in generated notebooks **before** execution.

### NotebookValidator Class
```python
class NotebookValidator:
    def validate(self, notebook_bytes: bytes) -> ValidationResult:
        """Run all validation checks."""
        nb = nbformat.reads(notebook_bytes.decode('utf-8'), as_version=4)

        errors = []
        errors.extend(self._check_syntax(nb))
        errors.extend(self._check_sklearn_params(nb))
        # Future: errors.extend(self._check_imports(nb))

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors
        )
```

### Validation Rules

#### 1. Syntax Checking
```python
def _check_syntax(self, nb) -> List[str]:
    """Compile each code cell to catch syntax errors."""
    errors = []
    for i, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue

        try:
            compile(cell.source, f"<cell-{i}>", "exec")
        except SyntaxError as e:
            errors.append(
                f"Syntax error in cell {i} at line {e.lineno}: {e.msg}"
            )
    return errors
```

**Catches**:
- `IndentationError`
- `SyntaxError`
- Invalid Python syntax

**Example caught error**:
```python
# Cell 2 has unexpected indentation
    import json  # 4 spaces at start
    import os
```
→ Validation error: "Syntax error in cell 2: unexpected indent"

#### 2. sklearn Parameter Validation
```python
SKLEARN_PARAM_RULES = {
    'CountVectorizer': {
        'forbidden_params': {'random_state'},
        'reason': 'CountVectorizer is deterministic, does not accept random_state'
    },
    'TfidfVectorizer': {
        'forbidden_params': {'random_state'},
        'reason': 'TfidfVectorizer is deterministic, does not accept random_state'
    }
}

def _check_sklearn_params(self, nb) -> List[str]:
    """Check for invalid sklearn class parameters using regex."""
    errors = []
    for i, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue

        for class_name, rules in SKLEARN_PARAM_RULES.items():
            if class_name not in cell.source:
                continue

            for param in rules['forbidden_params']:
                pattern = rf'{class_name}\s*\([^)]*{param}\s*='
                if re.search(pattern, cell.source):
                    errors.append(
                        f"Cell {i}: {class_name} uses invalid parameter '{param}'. "
                        f"Reason: {rules['reason']}"
                    )
    return errors
```

**Catches**:
```python
# Invalid: CountVectorizer doesn't accept random_state
vectorizer = CountVectorizer(max_features=5000, random_state=42)
```
→ Validation error: "Cell 4: CountVectorizer uses invalid parameter 'random_state'"

#### 3. Import Checking (Future - Phase 3)
```python
def _check_imports(self, nb) -> List[str]:
    """Use AST to check for undefined names."""
    # Parse all cells into AST
    # Check for NameError (undefined variables)
    # Check for ImportError (missing imports)
    pass
```

### Validation Integration

**In materialize endpoint**:
```python
# Generate notebook
notebook_bytes = build_notebook_bytes(plan, plan_id)

# Validate BEFORE storage
validator = NotebookValidator()
result = validator.validate(notebook_bytes)

if not result.valid:
    raise HTTPException(422, {
        "code": "NOTEBOOK_VALIDATION_FAILED",
        "message": "Generated notebook failed validation checks",
        "errors": result.errors,
        "remediation": "Check generator code for bugs..."
    })

# Only store if validation passes
storage.store_text(notebook_key, notebook_bytes.decode('utf-8'))
```

### Success Metrics

**Before validation** (Phase 2 early):
- Bugs: 4 discovered during execution
- Regeneration cycles: 4 required
- Human intervention: Required at each failure

**After validation** (Phase 2 current):
- Bugs: 0 (validation catches them)
- Regeneration cycles: 0 (first-try success)
- Human intervention: None (autonomous operation)

---

## Database Schema

### Tables

#### `papers`
```sql
CREATE TABLE papers (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    source_url TEXT,
    doi TEXT,
    arxiv_id TEXT,
    pdf_storage_path TEXT NOT NULL,
    vector_store_id TEXT,
    pdf_sha256 TEXT UNIQUE,
    status TEXT DEFAULT 'ingested',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `claims`
```sql
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
    dataset_name TEXT NOT NULL,
    split TEXT,
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    units TEXT,
    method_snippet TEXT,
    source_citation TEXT NOT NULL,
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `plans`
```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    plan_json JSONB NOT NULL,
    env_hash TEXT,
    budget_minutes INT,
    status TEXT DEFAULT 'planned',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    stage1_reasoning TEXT  -- Verbose o3-mini output from Stage 1 (two-stage planner)
);
```

**Note**: `stage1_reasoning` stores the raw verbose output from o3-mini (Stage 1) before it's transformed by GPT-4o (Stage 2). This preserves the model's reasoning for debugging and display to users. NULL for single-stage plans (gpt-4o only).

#### `runs`
```sql
CREATE TABLE runs (
    id UUID PRIMARY KEY,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    env_hash TEXT NOT NULL,
    seed INT DEFAULT 42,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_sec FLOAT,
    error_code TEXT,
    error_message TEXT
);
```

#### `run_events`
```sql
CREATE TABLE run_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL,
    payload JSONB
);
```

### Indexes

```sql
-- Papers
CREATE INDEX idx_papers_sha256 ON papers(pdf_sha256);
CREATE INDEX idx_papers_created_at ON papers(created_at DESC);

-- Claims
CREATE INDEX idx_claims_paper_id ON claims(paper_id);
CREATE INDEX idx_claims_dataset ON claims(dataset_name);

-- Plans
CREATE INDEX idx_plans_paper_id ON plans(paper_id);
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);

-- Runs
CREATE INDEX idx_runs_plan_id ON runs(plan_id);
CREATE INDEX idx_runs_paper_id ON runs(paper_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);

-- Run events
CREATE INDEX idx_run_events_run_id ON run_events(run_id);
CREATE INDEX idx_run_events_ts ON run_events(ts DESC);
```

---

## Error Handling

### Error Code Hierarchy

```
E_UNSUPPORTED_MEDIA_TYPE      # 415 - Only PDFs allowed
E_FETCH_FAILED                 # 400 - URL download failed
E_FILE_TOO_LARGE               # 413 - PDF > 15 MiB
E_FILESEARCH_INDEX_FAILED      # 500 - OpenAI File Search error
E_DB_INSERT_FAILED             # 500 - Database write failed

E_EXTRACT_LOW_CONFIDENCE       # 422 - Claims below threshold
E_EXTRACT_RUN_FAILED           # 500 - Extraction crashed
E_EXTRACT_NO_OUTPUT            # 500 - No JSON produced
E_EXTRACT_OPENAI_ERROR         # 500 - OpenAI API failure
E_POLICY_CAP_EXCEEDED          # 429 - Tool usage cap hit

E_PLAN_NOT_READY               # 404 - Paper not ready
E_PLAN_OPENAI_ERROR            # 500 - OpenAI API failure
E_PLAN_RUN_FAILED              # 500 - Planning crashed
E_PLAN_NO_OUTPUT               # 500 - No output
E_PLAN_SCHEMA_INVALID          # 422 - Pydantic validation failed
E_PLAN_GUARDRAIL_FAILED        # 422 - Guardrails rejected
E_PLAN_NO_ALLOWED_DATASETS     # 422 - All datasets blocked
E_SCHEMA_FIX_FAILED            # 500 - Stage 2 failed
E_TWO_STAGE_FAILED             # 500 - Both stages failed
E_PLAN_NOT_FOUND               # 404 - Plan missing
E_PLAN_ASSET_MISSING           # 404 - Artifacts not materialized
NOTEBOOK_VALIDATION_FAILED     # 422 - Generated notebook invalid

E_PLAN_NOT_MATERIALIZED        # 400 - env_hash missing
E_RUN_TIMEOUT                  # 500 - Exceeded budget_minutes
E_RUN_FAILED                   # 500 - Notebook execution error
E_GPU_REQUESTED                # 500 - GPU detected
```

### Error Response Format

**Standard error response**:
```json
{
  "code": "E_EXTRACT_LOW_CONFIDENCE",
  "message": "Extractor guardrail rejected the claims",
  "remediation": "Use manual claim editor to supply citations or boost confidence"
}
```

**Fields**:
- `code`: Machine-readable error identifier
- `message`: Human-readable error description
- `remediation`: Suggested user action (optional)

---

## Configuration & Environment

### Environment Variables

#### OpenAI
```bash
OPENAI_API_KEY=sk-...
OPENAI_PROJECT=proj_...
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional

# Models
OPENAI_EXTRACTOR_MODEL=gpt-4o
OPENAI_PLANNER_MODEL=o3-mini
OPENAI_SCHEMA_FIXER_MODEL=gpt-4o
OPENAI_MODEL=gpt-4o  # Default

# Agent settings
OPENAI_TEMPERATURE=0.1
OPENAI_MAX_OUTPUT_TOKENS=4096
OPENAI_MAX_TURNS=6

# Two-stage planner
PLANNER_TWO_STAGE_ENABLED=true
PLANNER_STRICT_SCHEMA=false

# Tracing
OPENAI_TRACING_ENABLED=true
```

#### Supabase
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_BUCKET_PAPERS=papers
SUPABASE_BUCKET_PLANS=plans
ALLOW_MISSING_SUPABASE=false
```

#### Tool Caps
```bash
TOOL_CAP_FILE_SEARCH_PER_RUN=10
TOOL_CAP_WEB_SEARCH_PER_RUN=5
TOOL_CAP_CODE_INTERPRETER_SECONDS=60
```

#### User Context
```bash
P2N_DEV_USER_ID=00000000-0000-0000-0000-000000000000
```

### Configuration Loading

**Pydantic BaseSettings**:
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    openai_api_key: str
    supabase_url: str
    # ... all env vars

    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**Usage**:
```python
from app.config.settings import get_settings

settings = get_settings()
api_key = settings.openai_api_key
```

---

## System Architecture Patterns

### 1. Agent-Centric Design

**Agents as first-class abstractions**:
- Each stage has a dedicated agent (Extractor, Planner, etc.)
- Agents defined via registry pattern
- Guardrails enforce contracts
- Tool usage tracked per agent

**Benefits**:
- Clear separation of concerns
- Easy to add new agents
- Testable (mock agents in tests)
- Reusable across endpoints

### 2. Factory Pattern (Generators)

**Smart generator selection**:
- Dataset generators selected via registry lookup
- Model generators (Phase 1: always LogisticRegression)
- Future: Smart model selection based on plan

**Benefits**:
- Extensible (add new generators without changing factory)
- Maintainable (generators isolated)
- Testable (mock generators)

### 3. Two-Stage Planning

**Separate reasoning from formatting**:
- Stage 1: Deep reasoning (o3-mini)
- Stage 2: Schema conformance (GPT-4o)
- Sanitizer: Post-Stage-2 cleanup

**Benefits**:
- Robust to LLM format variations
- Better schema conformance
- Clear separation of concerns

### 4. Event-Driven Execution

**SSE streaming for real-time progress**:
- In-memory event broker (RunStreamManager)
- Notebook-emitted events → SSE bridge
- Replay historical events on reconnect

**Benefits**:
- Real-time progress updates
- Client-side progress bars
- Event log persistence

### 5. Validation Layers

**Multiple validation stages**:
1. Request validation (Pydantic models)
2. Agent guardrails (input/output contracts)
3. Schema validation (Plan v1.1 Pydantic)
4. Notebook validation (syntax + parameters)
5. Runtime validation (CPU-only, deterministic)

**Benefits**:
- Fail fast (catch errors early)
- Clear error messages
- Prevent bad data propagation

### 6. Dataset Resolution

**Phase A: Classification**:
- RESOLVED: In registry, ready to use
- BLOCKED: Too large/restricted
- UNKNOWN: Not in registry (might be acquirable)
- COMPLEX: Needs custom adapter

**Benefits**:
- Clear feedback on dataset availability
- Automatic fallbacks (synthetic data)
- Future: Acquisition workflow

---

## Performance Characteristics

### Latency

| Stage | Typical Time | LLM Calls |
|-------|--------------|-----------|
| Ingest | 10-30s | 0 (File Search indexing) |
| Verify | N/A | N/A (not implemented) |
| Extract | 20-60s | 1 (gpt-4o) |
| Plan | 30-90s | 2 (o3-mini + gpt-4o) |
| Materialize | 1-3s | 0 |
| Execute | 30s - 20min | 0 |

### Storage

| Artifact | Typical Size | Retention |
|----------|--------------|-----------|
| PDF | 1-15 MiB | Permanent |
| Vector store | ~2x PDF | Permanent (OpenAI) |
| Notebook | 5-20 KB | Permanent |
| Requirements | 0.5-2 KB | Permanent |
| Metrics | 0.5-1 KB | Permanent |
| Events | 1-100 KB | Permanent |
| Logs | 10-2000 KB | Capped at 2 MiB |

### Cost (Rough Estimates)

| Operation | OpenAI Cost | Supabase Cost |
|-----------|-------------|---------------|
| Ingest (File Search) | $0.10 | $0.001 (storage) |
| Extract (gpt-4o) | $0.05-0.20 | $0.001 (DB) |
| Plan (o3-mini + gpt-4o) | $0.10-0.50 | $0.001 (DB) |
| Execute | $0 | $0.005 (storage) |
| **Total per paper** | **$0.25-0.80** | **$0.008** |

---

## Quick Reference

### File Structure
```
api/app/
├── routers/
│   ├── papers.py          # Ingest, Verify, Extract
│   ├── plans.py           # Plan, Materialize
│   ├── runs.py            # Execute
│   ├── reports.py         # Reproduction gap
│   └── explain.py         # Kid-mode storybooks
├── agents/
│   ├── registry.py        # Agent registry
│   ├── definitions.py     # Agent configs
│   ├── tooling.py         # Tool usage tracking
│   └── jsonizer.py        # JSON rescue
├── materialize/
│   ├── notebook.py        # Notebook builder
│   ├── sanitizer.py       # Plan sanitization
│   ├── validation.py      # Notebook validation
│   ├── generators/
│   │   ├── factory.py     # Generator factory
│   │   ├── base.py        # Base classes
│   │   ├── dataset.py     # Dataset generators
│   │   ├── model.py       # Model generators
│   │   └── dataset_registry.py  # Dataset metadata
│   └── dataset_resolution.py  # Dataset classification
├── run/
│   ├── runner_local.py    # Notebook execution
│   └── manager.py         # SSE event manager
├── data/
│   ├── models.py          # Pydantic models
│   └── supabase.py        # Database/storage
├── schemas/
│   └── plan_v1_1.py       # Plan JSON schema
└── config/
    ├── settings.py        # Environment config
    └── llm.py             # OpenAI client
```

### Common Tasks

**Create a new dataset generator**:
1. Add metadata to `DATASET_REGISTRY`
2. Create generator class in `generators/dataset.py`
3. Update factory in `generators/factory.py`
4. Add validation rules (if needed)

**Create a new model generator**:
1. Create generator class in `generators/model.py`
2. Update factory in `generators/factory.py`
3. Add validation rules (if needed)

**Add a new validation rule**:
1. Add rule to `SKLEARN_PARAM_RULES` (or create new category)
2. Implement check method in `NotebookValidator`
3. Add tests

**Debug execution failure**:
1. Check run logs: `GET /api/v1/runs/{run_id}/events`
2. Download notebook: `GET /api/v1/plans/{plan_id}/assets`
3. Run notebook locally to reproduce error
4. Fix generator code
5. Re-materialize and re-execute

---

## Navigation

- [Part 1: Ingest, Verify, Extract, Plan](./BACKEND_TECHNICAL_GUIDE_PART1.md)
- [Project Overview](./PROJECT_OVERVIEW.md)
- [Roadmap](./ROADMAP.md)
- [Active Sprint](../ActiveSprint/)

---

**Last Updated**: 2025-11-08
**Created by**: Claude (Sonnet 4.5)
**For**: Paper2Notebook Team
