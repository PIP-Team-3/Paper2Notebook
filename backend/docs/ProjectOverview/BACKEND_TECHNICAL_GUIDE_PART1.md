# Backend Technical Deep-Dive - Part 1: Ingest, Verify, Extract, Plan

**Last Updated**: 2025-11-08
**For**: Team members learning the backend architecture
**Covers**: Stages 1-4 of the 6-stage pipeline

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Stage 1: Ingest](#stage-1-ingest)
3. [Stage 2: Verify](#stage-2-verify)
4. [Stage 3: Extract](#stage-3-extract)
5. [Stage 4: Plan](#stage-4-plan)
6. [Common Patterns](#common-patterns)

---

## Pipeline Overview

### The 6-Stage Pipeline

```
PDF → [1] Ingest → [2] Verify → [3] Extract → [4] Plan → [5] Materialize → [6] Execute
```

**This document covers stages 1-4 (PDF → Plan JSON)**

### Key Concept: LLMs vs Templates

| Stage | Uses LLM? | Output Type | Purpose |
|-------|-----------|-------------|---------|
| **1. Ingest** | ❌ No | Database record + vector store | File processing |
| **2. Verify** | ✅ Yes | JSON: `{reproducible: bool}` | Check if paper is reproducible |
| **3. Extract** | ✅ Yes | JSON: Claims array | Extract metrics from paper |
| **4. Plan** | ✅ Yes | **Plan JSON v1.1** | Create execution plan |
| 5. Materialize | ❌ No | Jupyter Notebook | Template-based code gen |
| 6. Execute | ❌ No | Metrics + outputs | Run notebook |

**Critical insight**: LLMs create structured JSON plans. Python generators create code.

---

## Stage 1: Ingest

### Purpose
Upload a research paper PDF and prepare it for AI processing.

### API Endpoint
```http
POST /api/v1/papers/ingest
Content-Type: multipart/form-data

{
  "file": <PDF binary>,
  "title": "Convolutional Neural Networks for Sentence Classification"
}
```

**OR**

```http
POST /api/v1/papers/ingest
Content-Type: application/json

{
  "url": "https://arxiv.org/pdf/1408.5882.pdf",
  "title": "Convolutional Neural Networks for Sentence Classification"
}
```

### Code Location
- **Router**: `api/app/routers/papers.py`
- **Endpoint function**: `ingest_paper()`
- **Lines**: ~50-150

### Step-by-Step Process

#### 1. Validate Input
```python
# Check content type
if file:
    if file.content_type != "application/pdf":
        raise HTTPException(400, "E_UNSUPPORTED_MEDIA_TYPE")
    pdf_bytes = await file.read()
elif url:
    # Download from URL with timeout
    response = requests.get(url, timeout=30)
    pdf_bytes = response.content
```

**Validations**:
- Must be PDF format
- Size limit: 15 MiB (15,728,640 bytes)
- URL downloads timeout after 30 seconds

#### 2. Compute Checksum (Deduplication)
```python
pdf_sha256 = hashlib.sha256(pdf_bytes).hexdigest()

# Check if paper already exists
existing = db.get_paper_by_checksum(pdf_sha256)
if existing:
    return {"paper_id": existing.id, "already_exists": True}
```

**Why**: Prevent duplicate uploads of the same paper.

#### 3. Store PDF in Supabase Storage
```python
# Hierarchical path: papers/dev/YYYY/MM/DD/{paper_id}.pdf
storage_path = f"papers/{env}/{date_parts}/{paper_id}.pdf"

supabase_storage.store_pdf(storage_path, pdf_bytes)
```

**Storage structure**:
```
papers/
├── dev/
│   ├── 2025/
│   │   ├── 11/
│   │   │   ├── 06/
│   │   │   │   ├── abc123.pdf
│   │   │   │   ├── def456.pdf
```

**Why hierarchical**: Easier to browse by date, better performance at scale.

#### 4. Create OpenAI Vector Store
```python
from app.services.file_search import FileSearchService

file_search = FileSearchService(openai_client)

# Upload PDF to OpenAI File Search
vector_store_id = await file_search.create_vector_store_from_bytes(
    pdf_bytes,
    filename=f"{paper_id}.pdf",
    metadata={"paper_id": paper_id}
)
```

**What is a vector store?**
- OpenAI's vector database for RAG (Retrieval-Augmented Generation)
- Chunks PDF into passages (~500 tokens each)
- Creates embeddings for semantic search
- Used in Verify, Extract, Plan stages for `file_search` tool

**Indexing time**: ~10-30 seconds depending on PDF size

#### 5. Persist to Database
```python
paper = PaperCreate(
    id=paper_id,
    title=title,
    source_url=url if url else None,
    pdf_storage_path=storage_path,
    vector_store_id=vector_store_id,
    pdf_sha256=pdf_sha256,
    status="ingested",
    created_by=current_user_id,
    created_at=datetime.now(timezone.utc)
)

db.insert_paper(paper)
```

**Database table**: `papers`

**Key fields**:
- `id` (UUID) - Paper identifier
- `vector_store_id` (string) - OpenAI vector store ID (e.g., `vs_abc123`)
- `pdf_sha256` (string) - Checksum for deduplication
- `pdf_storage_path` (string) - Supabase storage path

#### 6. Return Response
```json
{
  "paper_id": "abc123-def456-...",
  "vector_store_id": "vs_xyz789",
  "storage_path": "papers/dev/2025/11/06/abc123-def456.pdf"
}
```

### Error Handling

| Error Code | HTTP Status | Cause | User Action |
|------------|-------------|-------|-------------|
| `E_UNSUPPORTED_MEDIA_TYPE` | 415 | Non-PDF uploaded | Upload PDF file |
| `E_FETCH_FAILED` | 400 | URL download failed | Check URL, try direct upload |
| `E_FILE_TOO_LARGE` | 413 | PDF > 15 MiB | Compress PDF or contact support |
| `E_FILESEARCH_INDEX_FAILED` | 500 | OpenAI File Search error | Retry or contact support |
| `E_DB_INSERT_FAILED` | 500 | Database write failed | Retry |

### Configuration

**Environment variables**:
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_BUCKET_PAPERS=papers

OPENAI_API_KEY=sk-...
OPENAI_PROJECT=proj_...
```

### Testing the Endpoint

**Using curl**:
```bash
# File upload
curl -X POST http://localhost:8000/api/v1/papers/ingest \
  -F "file=@textcnn.pdf" \
  -F "title=TextCNN Paper"

# URL upload
curl -X POST http://localhost:8000/api/v1/papers/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://arxiv.org/pdf/1408.5882.pdf", "title": "TextCNN"}'
```

### Dependencies

**External services**:
- Supabase Storage (PDF storage)
- Supabase Database (metadata)
- OpenAI File Search (vector store)

**Python packages**:
- `requests` - URL downloads
- `hashlib` - SHA256 checksums
- `fastapi` - HTTP framework
- `openai` - OpenAI SDK

---

## Stage 2: Verify

### Purpose
Use an LLM to check if the paper is reproducible (has datasets, results, and enough detail).

### API Endpoint
```http
GET /api/v1/papers/{paper_id}/verify
```

**Note**: This is a **synchronous** request (no streaming).

### Code Location
- **Router**: `api/app/routers/papers.py`
- **Endpoint function**: `verify_paper()`
- **Agent**: `AgentRole.VERIFIER` (not yet implemented - planned for future)

### Current Status (Phase 2)

**As of Nov 2025**: Verify stage is **not implemented** in production.

**Planned implementation**:
1. Fetch paper from database
2. Use OpenAI Agents SDK with `file_search` tool
3. Ask LLM: "Is this paper reproducible?"
4. LLM calls `file_search` to read PDF
5. LLM returns structured output:
   ```json
   {
     "reproducible": true,
     "reasoning": "Paper uses SST-2 dataset (publicly available), reports 88.1% accuracy with clear experimental setup, and describes TextCNN architecture in detail."
   }
   ```
6. Store result in `papers` table (`reproducible` column)

### Why This Stage Exists

**Problem**: Not all papers are reproducible.

**Examples of non-reproducible papers**:
- Proprietary datasets (e.g., internal company data)
- Missing hyperparameters (e.g., "we trained for several epochs")
- No reported metrics (e.g., only qualitative results)
- Theoretical papers with no experiments

**Verify catches these early** before wasting time on extraction/planning.

### LLM Agent Design (Future)

**System prompt** (planned):
```
You are a reproducibility checker for machine learning papers.

Your task:
1. Use file_search to read the paper
2. Check if the paper has:
   - Public dataset (or clear data collection process)
   - Quantitative results (accuracy, F1, etc.)
   - Model architecture description
   - Training configuration (epochs, batch size, learning rate)
3. Call emit_reproducibility_verdict with your assessment

Return:
{
  "reproducible": boolean,
  "reasoning": string (explain your decision),
  "missing_elements": [array of what's missing, if any]
}
```

**Tools available**:
- `file_search` - Read PDF via vector store (max 10 calls)
- `emit_reproducibility_verdict` - Structured output function

**Output guardrails**:
- Must provide reasoning
- If `reproducible=false`, must list `missing_elements`

### Skip Logic (Current)

Since Verify is not implemented, the current flow is:

```
Ingest → [Skip Verify] → Extract
```

All papers are assumed reproducible and proceed to extraction.

---

## Stage 3: Extract

### Purpose
Use an LLM to extract **structured claims** (metrics, datasets, methods) from the paper.

### API Endpoint
```http
POST /api/v1/papers/{paper_id}/extract
```

**Response**: Server-Sent Events (SSE) stream

### Code Location
- **Router**: `api/app/routers/papers.py`
- **Endpoint function**: `run_extractor()`
- **Lines**: ~311-500
- **Agent**: `AgentRole.EXTRACTOR`
- **Agent definition**: `api/app/agents/definitions.py`

### Step-by-Step Process

#### 1. Load Agent Configuration
```python
from app.agents import get_agent, AgentRole

agent = get_agent(AgentRole.EXTRACTOR)
```

**Agent configuration**:
- **Model**: `gpt-4o` (default, configurable via `OPENAI_EXTRACTOR_MODEL`)
- **Tools**: `file_search` (max 10 calls per run)
- **Function tools**: `emit_extractor_output`
- **Temperature**: 0.1 (low randomness for consistency)

#### 2. Build Tools List
```python
tool_payloads = build_tool_payloads(agent)
tools = [
    {
        "type": "file_search",
        "max_num_results": 10,
        "vector_store_ids": [paper.vector_store_id]
    },
    {
        "type": "function",
        "name": "emit_extractor_output",
        "strict": True,
        "parameters": ExtractorOutputSchema  # Pydantic JSON schema
    }
]
```

**What is `file_search`?**
- OpenAI's hosted RAG tool
- Searches the PDF vector store for relevant passages
- LLM uses this to "read" the paper
- Each call returns top 10 most relevant chunks

**What is `emit_extractor_output`?**
- Pydantic function tool for structured output
- Forces LLM to call this function with valid JSON
- Schema enforces required fields (dataset_name, metric_name, metric_value, etc.)

#### 3. Create System + User Messages
```python
system_msg = {
    "type": "message",
    "role": "system",
    "content": [{"type": "input_text", "text": agent.system_prompt}]
}

user_msg = {
    "type": "message",
    "role": "user",
    "content": [{
        "type": "input_text",
        "text": json.dumps({"paper_id": paper_id, "sections": ["all"]})
    }]
}
```

**System prompt** (simplified):
```
You are an expert at extracting quantitative claims from ML papers.

Your task:
1. Use file_search to read the paper
2. Find all reported metrics (accuracy, F1, BLEU, etc.)
3. For each metric, extract:
   - Dataset name
   - Dataset split (train/test/validation)
   - Metric name (accuracy, F1, etc.)
   - Metric value (as float, e.g., 0.881 for 88.1%)
   - Units (if applicable, e.g., "%", "seconds")
   - Source citation (section/table where found)
4. Call emit_extractor_output with ALL claims

Requirements:
- Every claim must have a source citation
- Confidence >= 0.5 (skip uncertain claims)
- Convert percentages to decimals (88.1% → 0.881)
```

#### 4. Stream Agent Execution
```python
client = get_client()  # OpenAI client

stream_manager = client.responses.stream(
    model=agent.model,
    input=[system_msg, user_msg],
    tools=tools,
    temperature=0.1,
    max_output_tokens=4096
)

with stream_manager as stream:
    for event in stream:
        event_type = event.type

        if event_type == "response.file_search_call.searching":
            # LLM is calling file_search
            tracker.record_call("file_search")
            emit_sse("file_search_call", {"query": "..."})

        elif event_type == "response.output_text.delta":
            # LLM is thinking (text generation)
            emit_sse("token", {"delta": event.delta})

        elif event_type == "response.function_call_arguments.delta":
            # LLM is calling emit_extractor_output
            function_args_buffer.append(event.delta)

        elif event_type == "response.completed":
            # Extraction complete
            final_response = event
```

**Event types emitted to client**:
- `extract_start` - Extraction begins
- `file_search_call` - LLM searches paper
- `token` - LLM reasoning text
- `stage_update` - Progress updates
- `persist_start` - Saving to database
- `persist_done` - Save complete
- `extract_complete` - Final result

#### 5. Parse Function Call Output
```python
# Collect all function call argument chunks
full_args = "".join(function_call_chunks)

# Parse as JSON
output_data = json.loads(full_args)

# Validate against Pydantic schema
from app.agents.definitions import ExtractorOutput
extractor_output = ExtractorOutput(**output_data)
```

**ExtractorOutput schema**:
```python
@dataclass
class ExtractorOutput:
    claims: List[Claim]

@dataclass
class Claim:
    dataset_name: str
    split: str                    # "train", "test", "validation"
    metric_name: str               # "accuracy", "f1", "bleu", etc.
    metric_value: float            # 0.881 (not 88.1%)
    units: Optional[str]           # "%", "seconds", None
    method_snippet: Optional[str]  # Brief description
    source_citation: str           # "Table 2, page 5"
    confidence: float              # 0.0 - 1.0
```

#### 6. Apply Guardrails
```python
# Check output guardrails
for guardrail in agent.output_guardrails:
    ok, error_msg = guardrail.check(extractor_output)
    if not ok:
        raise OutputGuardrailTripwireTriggered(error_msg)
```

**Guardrails**:
1. **At least one claim**: `len(claims) >= 1`
2. **All claims have citations**: `all(c.source_citation for c in claims)`
3. **Confidence threshold**: `all(c.confidence >= 0.5 for c in claims)`

**Why guardrails?**
- Prevent hallucinated claims (require citations)
- Filter low-confidence extractions
- Ensure useful output (at least one claim)

#### 7. Persist Claims to Database
```python
# Delete existing claims (replace policy)
db.delete_claims_by_paper(paper_id)

# Insert new claims
claim_records = []
for claim in extractor_output.claims:
    claim_records.append(ClaimCreate(
        paper_id=paper_id,
        dataset_name=claim.dataset_name,
        split=claim.split,
        metric_name=claim.metric_name,
        metric_value=claim.metric_value,
        units=claim.units,
        method_snippet=claim.method_snippet,
        source_citation=claim.source_citation,
        confidence=claim.confidence,
        created_by=current_user_id,
        created_at=datetime.now(timezone.utc)
    ))

db.insert_claims(claim_records)
```

**Database table**: `claims`

**Replace policy**: Delete old claims before inserting new ones (allow re-extraction).

#### 8. Return SSE Stream
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: extract_start
data: {"paper_id": "abc123"}

event: file_search_call
data: {"query": "accuracy results"}

event: token
data: {"delta": "I found"}

event: persist_start
data: {"claims_count": 3}

event: persist_done
data: {"claims_count": 3}

event: extract_complete
data: {"claims": [...]}
```

### Example Extraction Output

**Paper**: "Convolutional Neural Networks for Sentence Classification" (TextCNN)

**Extracted claims**:
```json
{
  "claims": [
    {
      "dataset_name": "SST-2",
      "split": "test",
      "metric_name": "accuracy",
      "metric_value": 0.881,
      "units": null,
      "method_snippet": "TextCNN with pre-trained word2vec embeddings",
      "source_citation": "Table 2, SST-2 row",
      "confidence": 0.95
    },
    {
      "dataset_name": "MR",
      "split": "test",
      "metric_name": "accuracy",
      "metric_value": 0.811,
      "units": null,
      "method_snippet": "TextCNN-rand (random embeddings)",
      "source_citation": "Table 1, MR column",
      "confidence": 0.90
    }
  ]
}
```

### Error Handling

| Error Code | HTTP Status | Cause | Remediation |
|------------|-------------|-------|-------------|
| `E_EXTRACT_LOW_CONFIDENCE` | 422 | All claims < 0.5 confidence | Review paper, may need manual claim entry |
| `E_EXTRACT_RUN_FAILED` | 500 | Agent execution crashed | Retry, check OpenAI status |
| `E_EXTRACT_NO_OUTPUT` | 500 | LLM didn't call function | Retry, may need prompt tuning |
| `E_EXTRACT_OPENAI_ERROR` | 500 | OpenAI API failure | Retry, check API key |
| `E_POLICY_CAP_EXCEEDED` | 429 | > 10 file_search calls | Reduce tool usage or increase cap |

### JSONizer Fallback

**Problem**: Sometimes LLMs produce malformed JSON.

**Solution**: JSONizer rescue system
```python
try:
    output_data = json.loads(full_args)
except json.JSONDecodeError:
    # Fallback: Use GPT-4o-mini to fix JSON
    from app.agents.jsonizer import jsonizer_fallback

    output_data = jsonizer_fallback(
        raw_text=full_args,
        expected_schema=ExtractorOutputSchema
    )
```

**JSONizer**:
- Sends malformed text to GPT-4o-mini
- Provides Pydantic schema
- Asks: "Fix this JSON to match the schema"
- Returns valid JSON
- Cheaper/faster than re-running full extraction

### Tool Usage Tracking

**Why track tool usage?**
- OpenAI charges per `file_search` call
- Prevent runaway costs from infinite loops
- Enforce reasonable limits

**Implementation**:
```python
from app.agents.tooling import ToolUsageTracker

tracker = ToolUsageTracker()

# During stream
if event_type == "response.file_search_call.searching":
    tracker.record_call("file_search")  # Increments counter

    if tracker.file_search_count > 10:
        raise ToolUsagePolicyError("Exceeded file_search cap (10)")
```

**Configurable caps** (settings.py):
```bash
TOOL_CAP_FILE_SEARCH_PER_RUN=10
TOOL_CAP_WEB_SEARCH_PER_RUN=5
TOOL_CAP_CODE_INTERPRETER_SECONDS=60
```

---

## Stage 4: Plan

### Purpose
Use an LLM to generate a **detailed execution plan** (Plan JSON v1.1) for reproducing the paper's results.

### API Endpoint
```http
POST /api/v1/papers/{paper_id}/plan
Content-Type: application/json

{
  "claims": [
    {
      "dataset_name": "SST-2",
      "metric_name": "accuracy",
      "metric_value": 0.881
    }
  ],
  "budget_minutes": 10
}
```

**Response**: JSON (synchronous, ~30-60 seconds)

### Code Location
- **Router**: `api/app/routers/plans.py`
- **Endpoint function**: `create_plan()`
- **Lines**: ~238-700
- **Agent**: `AgentRole.PLANNER`
- **Agent definition**: `api/app/agents/definitions.py`

### Two-Stage Planning Architecture

**Critical concept**: Planning uses **TWO LLM calls** (not one).

#### Why Two Stages?

**Problem**: LLMs are good at reasoning BUT bad at exact schema conformance.

**Solution**: Separate concerns
- **Stage 1**: Focus on **reasoning** (o3-mini)
- **Stage 2**: Focus on **schema conformance** (GPT-4o)

#### Stage 1: Deep Reasoning (o3-mini)

**Model**: `o3-mini` (default, configurable via `OPENAI_PLANNER_MODEL`)

**Goal**: Think deeply about the reproduction plan

**System prompt** (simplified):
```
You are a reproduction planner for ML papers.

Your task:
1. Use file_search to read the paper
2. Use dataset_resolver to check dataset availability
3. Use license_checker to verify dataset licensing
4. Use budget_estimator to estimate training time
5. Draft a CPU-only reproduction plan

Focus on:
- Dataset selection (match paper or find CPU-suitable alternative)
- Model architecture (match paper or CPU-adapt if needed)
- Training configuration (epochs, batch size, learning rate)
- Metrics to track (accuracy, F1, loss, etc.)
- Justifications with verbatim quotes from paper

Output format: Any valid JSON or prose (will be cleaned in Stage 2)
```

**Tools available**:
1. **file_search** - Read paper PDF
2. **web_search** - Look up datasets/licenses online
3. **dataset_resolver** - Check if dataset is in registry
4. **license_checker** - Verify dataset license compatibility
5. **budget_estimator** - Estimate CPU training time

**Example Stage 1 output** (may be prose):
```
After reviewing the paper, I found:

Dataset: SST-2 (Stanford Sentiment Treebank)
- Available via HuggingFace: glue/sst2
- License: MIT (compatible)
- Size: ~67k training samples (manageable on CPU)

Model: TextCNN
- Architecture: 1D convolution over word embeddings
- Paper reports: 88.1% accuracy
- CPU adaptation: Use sklearn LogisticRegression baseline for Phase 2

Training config:
- Epochs: 10 (paper doesn't specify, typical for SST-2)
- Batch size: 64
- Learning rate: 0.001 (paper doesn't specify)
- Optimizer: Adam

Justifications:
- Dataset: "We use the SST-2 dataset (Socher et al. 2013)" (Section 4.1)
- Model: "We employ a CNN with filter sizes 3, 4, 5" (Section 3.2)
- Results: "Our model achieves 88.1% accuracy" (Table 2)

Budget: ~30 seconds (sklearn baseline), ~5 minutes (real TextCNN)
```

**Note**: This may not be valid Plan v1.1 JSON. That's okay! Stage 2 fixes it.

#### Stage 2: Schema Conformance (GPT-4o)

**Model**: `gpt-4o` (default, configurable via `OPENAI_SCHEMA_FIXER_MODEL`)

**Goal**: Convert Stage 1 output to valid Plan JSON v1.1

**System prompt** (simplified):
```
You are a schema fixer for reproduction plans.

Input: Output from Stage 1 (may be prose or malformed JSON)
Output: Valid Plan JSON v1.1

Requirements:
- All fields must match PlanDocumentV11 Pydantic schema
- Extract justifications from prose (format: {quote, citation})
- Coerce types (string numbers → int/float)
- Add defaults for missing optional fields
- Ensure version = "1.1"

Return ONLY valid JSON, no prose.
```

**Input to Stage 2**:
```json
{
  "stage1_output": "After reviewing the paper, I found:...",
  "stage1_tool_calls": [
    {"tool": "dataset_resolver", "result": {"available": true, "source": "huggingface"}},
    {"tool": "license_checker", "result": {"license": "MIT", "compatible": true}}
  ],
  "plan_schema": {...}  // PlanDocumentV11 JSON schema
}
```

**Output from Stage 2** (valid Plan JSON):
```json
{
  "version": "1.1",
  "dataset": {
    "name": "SST-2",
    "source": "huggingface",
    "split": "train",
    "test_split": "validation"
  },
  "model": {
    "name": "TextCNN",
    "architecture": "cnn",
    "framework": "pytorch"
  },
  "config": {
    "seed": 42,
    "batch_size": 64,
    "epochs": 10,
    "learning_rate": 0.001,
    "optimizer": "adam"
  },
  "metrics": {
    "primary": "accuracy",
    "goal_value": 0.881
  },
  "justifications": {
    "dataset": {
      "quote": "We use the SST-2 dataset (Socher et al. 2013)",
      "citation": "Section 4.1"
    },
    "model": {
      "quote": "We employ a CNN with filter sizes 3, 4, 5",
      "citation": "Section 3.2"
    },
    "config": {
      "quote": "Training details not specified, using typical defaults for SST-2",
      "citation": "Inferred from related work"
    }
  },
  "policy": {
    "budget_minutes": 10,
    "license": "MIT"
  }
}
```

### Step-by-Step Process

#### 1. Load Planner Agent
```python
agent = get_agent(AgentRole.PLANNER)
```

**Agent configuration**:
- **Stage 1 model**: `o3-mini`
- **Stage 2 model**: `gpt-4o`
- **Tools**: `file_search`, `web_search`, `dataset_resolver`, `license_checker`, `budget_estimator`
- **Temperature**: 0.1 (low randomness)

#### 2. Build Tools List
```python
tools = [
    {
        "type": "file_search",
        "max_num_results": 10,
        "vector_store_ids": [paper.vector_store_id]
    },
    {
        "type": "web_search",
        "max_results": 5
    },
    {
        "type": "function",
        "name": "dataset_resolver",
        "strict": True,
        "parameters": DatasetResolverSchema
    },
    {
        "type": "function",
        "name": "license_checker",
        "strict": True,
        "parameters": LicenseCheckerSchema
    },
    {
        "type": "function",
        "name": "budget_estimator",
        "strict": True,
        "parameters": BudgetEstimatorSchema
    }
]
```

**Tool: dataset_resolver**
```python
def dataset_resolver(name: str) -> dict:
    """Check if dataset is available in registry."""
    from app.materialize.generators.dataset_registry import lookup_dataset

    metadata = lookup_dataset(name)
    if metadata:
        return {
            "available": True,
            "source": metadata.source,
            "typical_size_mb": metadata.typical_size_mb,
            "splits": metadata.split_available
        }
    else:
        return {"available": False}
```

**Tool: license_checker**
```python
def license_checker(dataset: str) -> dict:
    """Check dataset license compatibility."""
    # Simplified - real implementation queries HuggingFace API
    known_licenses = {
        "sst2": "MIT",
        "ag_news": "Apache-2.0",
        "imdb": "Apache-2.0"
    }

    license = known_licenses.get(dataset.lower())
    if license:
        return {
            "license": license,
            "compatible": license in ["MIT", "Apache-2.0", "BSD"]
        }
    else:
        return {"license": "Unknown", "compatible": False}
```

**Tool: budget_estimator**
```python
def budget_estimator(
    dataset_size: int,
    model_type: str,
    epochs: int,
    batch_size: int
) -> dict:
    """Estimate CPU training time."""
    # Simplified estimation
    samples_per_epoch = dataset_size
    batches_per_epoch = samples_per_epoch / batch_size
    seconds_per_batch = 0.1 if model_type == "sklearn" else 2.0

    total_seconds = batches_per_epoch * seconds_per_batch * epochs
    total_minutes = total_seconds / 60

    return {
        "estimated_minutes": round(total_minutes, 1),
        "within_budget": total_minutes <= 20
    }
```

#### 3. Execute Stage 1 (o3-mini)
```python
system_msg = {
    "type": "message",
    "role": "system",
    "content": [{"type": "input_text", "text": agent.system_prompt}]
}

user_msg = {
    "type": "message",
    "role": "user",
    "content": [{
        "type": "input_text",
        "text": json.dumps({
            "paper": {"id": paper_id, "title": paper.title},
            "claims": [c.model_dump() for c in payload.claims],
            "policy": {"budget_minutes": 10}
        })
    }]
}

# Stream Stage 1
stream_manager = client.responses.stream(
    model="o3-mini",
    input=[system_msg, user_msg],
    tools=tools,
    max_output_tokens=8192  # o3-mini needs more tokens for reasoning
)

stage1_output_text = ""
stage1_tool_calls = []

with stream_manager as stream:
    for event in stream:
        if event.type == "response.output_text.delta":
            stage1_output_text += event.delta

        elif event.type == "response.function_call_arguments.done":
            stage1_tool_calls.append({
                "tool": event.name,
                "args": json.loads(event.arguments),
                "result": execute_tool(event.name, event.arguments)
            })
```

**Stage 1 can output**:
- Pure prose (no JSON)
- Malformed JSON
- Valid JSON (but may not match schema)
- Mix of prose + JSON

**All outcomes are acceptable** - Stage 2 will fix it.

#### 4. Execute Stage 2 (GPT-4o)
```python
# Build Stage 2 prompt
stage2_system = """
You are a schema fixer. Convert the Stage 1 output to valid Plan JSON v1.1.

Stage 1 output (may be prose or malformed JSON):
{stage1_output}

Stage 1 tool calls:
{stage1_tool_calls}

Plan JSON v1.1 schema:
{plan_schema}

Return ONLY valid JSON matching the schema. Extract justifications from prose.
"""

stage2_user = {
    "type": "message",
    "role": "user",
    "content": [{
        "type": "input_text",
        "text": "Fix the plan to match Plan v1.1 schema"
    }]
}

# Stream Stage 2
stream_manager = client.responses.stream(
    model="gpt-4o",
    input=[stage2_system_msg, stage2_user],
    tools=[],  # No tools in Stage 2
    temperature=0.1,
    max_output_tokens=4096
)

stage2_output_text = ""
with stream_manager as stream:
    for event in stream:
        if event.type == "response.output_text.delta":
            stage2_output_text += event.delta
```

#### 5. Parse Stage 2 Output
```python
# Extract JSON from Stage 2 output
plan_raw = json.loads(stage2_output_text)
```

**If Stage 2 fails**: Retry once, then fall back to Stage 1 output (attempt to parse directly).

#### 6. Sanitize Plan
```python
from app.materialize.sanitizer import sanitize_plan
from app.materialize.generators.dataset_registry import DATASET_REGISTRY

plan_clean = sanitize_plan(
    raw_plan=plan_raw,
    registry=DATASET_REGISTRY,
    policy={"budget_minutes": 10}
)
```

**Sanitizer does**:
1. **Type coercion**: `"10"` → `10`, `"true"` → `True`
2. **Key pruning**: Remove fields not in Plan v1.1 schema
3. **Dataset resolution**: Map aliases to canonical names (e.g., "SST2" → "sst2")
4. **Epochs capping**: Enforce max 20 epochs (CPU budget)
5. **Justifications fixup**: Ensure `{quote, citation}` structure
6. **Defaults injection**: Add missing required fields

**Example sanitization**:
```python
# Before sanitization
{
  "dataset": {"name": "SST2 Dataset"},  # Alias with postfix
  "config": {"epochs": "25"},            # String number, exceeds cap
  "justifications": "See Table 2"        # Plain string
}

# After sanitization
{
  "dataset": {"name": "sst2"},           # Canonical name
  "config": {"epochs": 20},              # Capped to max
  "justifications": {                    # Structured
    "dataset": {"quote": "See Table 2", "citation": "Inferred"}
  }
}
```

#### 7. Validate Against Schema
```python
from app.schemas.plan_v1_1 import PlanDocumentV11

plan = PlanDocumentV11.model_validate(plan_clean)
```

**Pydantic validation checks**:
- `version` must be `"1.1"`
- `dataset.name` must be string
- `config.epochs` must be int
- `metrics.goal_value` must be float
- All required fields present

**If validation fails**: Return 422 error with details.

#### 8. Dataset Resolution
```python
from app.materialize.dataset_resolution import resolve_dataset_for_plan

resolution = resolve_dataset_for_plan(
    plan_dict=plan_clean,
    registry=DATASET_REGISTRY,
    blocked_list=BLOCKED_DATASETS
)
```

**Resolution outcomes**:
- `RESOLVED` - Dataset in registry, ready to use
- `BLOCKED` - Intentionally blocked (e.g., ImageNet - too large)
- `UNKNOWN` - Not in registry (might be acquirable)
- `COMPLEX` - Needs custom adapter (e.g., multi-dataset)

**Blocked datasets** (too large for CPU):
```python
BLOCKED_DATASETS = {
    "imagenet", "imagenet1k", "imagenet2012",
    "imagenet21k", "openimages", "yfcc100m"
}
```

**If dataset is blocked**: Sanitizer removes it, falls back to synthetic data.

#### 9. Apply Guardrails
```python
for guardrail in agent.output_guardrails:
    ok, error_msg = guardrail.check(plan)
    if not ok:
        raise OutputGuardrailTripwireTriggered(error_msg)
```

**Guardrails**:
1. **Version**: `plan.version == "1.1"`
2. **Runtime**: `plan.policy.budget_minutes <= 20` (CPU cap)
3. **License**: Dataset license compatible (MIT, Apache-2.0, BSD)
4. **Metrics**: At least one metric specified
5. **Justifications**: All required justifications present

#### 10. Persist to Database
```python
plan_record = PlanCreate(
    id=plan_id,
    paper_id=paper_id,
    version="1.1",
    plan_json=plan.model_dump(),
    budget_minutes=plan.policy.budget_minutes,
    status="planned",
    created_by=current_user_id,
    created_at=datetime.now(timezone.utc)
)

db.insert_plan(plan_record)
```

**Database table**: `plans`

#### 11. Return Response
```json
{
  "plan_id": "plan_abc123",
  "plan_version": "1.1",
  "plan_json": {...},
  "warnings": [
    "Dataset 'ImageNet' blocked (too large), using synthetic fallback"
  ],
  "data_resolution": {
    "dataset_name": "sst2",
    "status": "RESOLVED",
    "source": "huggingface",
    "registry_metadata": {...}
  }
}
```

### Plan JSON v1.1 Schema

**Complete example**:
```json
{
  "version": "1.1",
  "dataset": {
    "name": "sst2",
    "source": "huggingface",
    "hf_dataset": "glue",
    "hf_config": "sst2",
    "split": "train",
    "test_split": "validation"
  },
  "model": {
    "name": "TextCNN",
    "architecture": "cnn",
    "framework": "pytorch"
  },
  "config": {
    "seed": 42,
    "batch_size": 64,
    "epochs": 10,
    "learning_rate": 0.001,
    "optimizer": "adam",
    "weight_decay": 0.0,
    "dropout": 0.5
  },
  "metrics": {
    "primary": "accuracy",
    "secondary": ["f1", "precision", "recall"],
    "goal_value": 0.881,
    "loss": "cross_entropy"
  },
  "justifications": {
    "dataset": {
      "quote": "We use the SST-2 dataset (Socher et al. 2013)",
      "citation": "Section 4.1"
    },
    "model": {
      "quote": "We employ a CNN with filter sizes 3, 4, 5 and 100 feature maps each",
      "citation": "Section 3.2, page 3"
    },
    "config": {
      "quote": "We use Adam optimizer with learning rate 0.001",
      "citation": "Section 4.2"
    }
  },
  "policy": {
    "budget_minutes": 10,
    "license": "MIT",
    "cpu_only": true
  },
  "visualizations": {
    "plots": ["loss_curve", "accuracy_curve"],
    "tables": ["confusion_matrix"]
  },
  "explain": {
    "accessible": true,
    "kid_mode": true
  }
}
```

### Error Handling

| Error Code | HTTP Status | Cause | Remediation |
|------------|-------------|-------|-------------|
| `E_PLAN_NOT_READY` | 404 | Paper missing or no vector store | Complete Ingest first |
| `E_PLAN_OPENAI_ERROR` | 500 | OpenAI API failure | Retry, check API key |
| `E_PLAN_RUN_FAILED` | 500 | Planning crashed | Retry, check logs |
| `E_PLAN_NO_OUTPUT` | 500 | No output from planner | Retry with different claims |
| `E_PLAN_SCHEMA_INVALID` | 422 | Pydantic validation failed | Review plan JSON, fix schema issues |
| `E_PLAN_GUARDRAIL_FAILED` | 422 | Guardrails rejected plan | Adjust budget, check dataset licensing |
| `E_PLAN_NO_ALLOWED_DATASETS` | 422 | All datasets blocked/unknown | Manually specify allowed dataset |
| `E_SCHEMA_FIX_FAILED` | 500 | Stage 2 failed | Retry, may need manual plan editing |
| `E_TWO_STAGE_FAILED` | 500 | Both stages failed | Check paper quality, retry |

### Configuration

**Environment variables**:
```bash
# Stage 1 model
OPENAI_PLANNER_MODEL=o3-mini

# Stage 2 model
OPENAI_SCHEMA_FIXER_MODEL=gpt-4o

# Two-stage planner control
PLANNER_TWO_STAGE_ENABLED=true

# Tool caps
TOOL_CAP_FILE_SEARCH_PER_RUN=10
TOOL_CAP_WEB_SEARCH_PER_RUN=5
```

---

## Common Patterns

### 1. Agent Registry Pattern

**All agents are registered in a central registry**:

```python
# api/app/agents/registry.py

from enum import Enum

class AgentRole(str, Enum):
    EXTRACTOR = "extractor"
    PLANNER = "planner"
    VERIFIER = "verifier"
    KID_EXPLAINER = "kid_explainer"

class AgentRegistry:
    _agents: Dict[AgentRole, AgentDefinition] = {}

    @classmethod
    def register(cls, role: AgentRole, definition: AgentDefinition):
        cls._agents[role] = definition

    @classmethod
    def get(cls, role: AgentRole) -> AgentDefinition:
        return cls._agents[role]

# Usage
def get_agent(role: AgentRole) -> AgentDefinition:
    return AgentRegistry.get(role)
```

**Benefits**:
- Single source of truth for agent configs
- Easy to add new agents
- Testable (mock agents in tests)

### 2. Structured Output via Function Tools

**LLMs are bad at formatting, good at content**:

```python
# Define Pydantic schema
class Claim(BaseModel):
    dataset_name: str
    metric_value: float

class ExtractorOutput(BaseModel):
    claims: List[Claim]

# Convert to JSON schema
schema = ExtractorOutput.model_json_schema()

# Create function tool
tools = [
    {
        "type": "function",
        "name": "emit_extractor_output",
        "strict": True,  # Enforce strict schema matching
        "parameters": schema
    }
]

# LLM is forced to call this function with valid JSON
```

**Why this works**:
- OpenAI validates JSON against schema **server-side**
- LLM can't produce invalid output
- No need for error-prone parsing

### 3. Guardrails for Output Validation

**Even with structured output, we need business logic validation**:

```python
@dataclass
class Guardrail:
    name: str
    description: str
    check: Callable[[Any], Tuple[bool, Optional[str]]]

    def enforce(self, value: Any) -> None:
        ok, error_msg = self.check(value)
        if not ok:
            raise OutputGuardrailTripwireTriggered(
                f"Guardrail '{self.name}' failed: {error_msg}"
            )

# Example guardrail
def check_has_claims(output: ExtractorOutput) -> Tuple[bool, Optional[str]]:
    if len(output.claims) == 0:
        return False, "No claims extracted"
    return True, None

guardrail = Guardrail(
    name="has_claims",
    description="Output must have at least one claim",
    check=check_has_claims
)
```

**Benefits**:
- Declarative validation rules
- Reusable across agents
- Clear error messages

### 4. Tool Usage Tracking

**Prevent runaway costs**:

```python
class ToolUsageTracker:
    def __init__(self):
        self.file_search_count = 0
        self.web_search_count = 0
        self.code_interpreter_seconds = 0

    def record_call(self, tool: str):
        if tool == "file_search":
            self.file_search_count += 1
            if self.file_search_count > TOOL_CAP_FILE_SEARCH:
                raise ToolUsagePolicyError(
                    f"Exceeded file_search cap ({TOOL_CAP_FILE_SEARCH})"
                )
```

**Usage**:
```python
tracker = ToolUsageTracker()

for event in stream:
    if event.type == "response.file_search_call.searching":
        tracker.record_call("file_search")
```

### 5. SSE Streaming for Real-Time Feedback

**Long-running operations need progress updates**:

```python
async def stream_sse(generator):
    async for event_type, payload in generator:
        yield f"event: {event_type}\n"
        yield f"data: {json.dumps(payload)}\n\n"

@router.post("/extract")
async def run_extractor():
    return StreamingResponse(
        stream_sse(extract_generator()),
        media_type="text/event-stream"
    )
```

**Client-side**:
```javascript
const eventSource = new EventSource('/api/v1/papers/abc123/extract');

eventSource.addEventListener('file_search_call', (e) => {
  console.log('LLM searching paper:', JSON.parse(e.data));
});

eventSource.addEventListener('extract_complete', (e) => {
  console.log('Claims:', JSON.parse(e.data).claims);
  eventSource.close();
});
```

### 6. Two-Stage Pattern for LLM Reliability

**Separate reasoning from formatting**:

```
Stage 1 (o3-mini):
- Focus: Deep reasoning, use tools, think step-by-step
- Output: Any format (prose, malformed JSON, valid JSON)
- Tools: All tools available

Stage 2 (GPT-4o):
- Focus: Convert Stage 1 output to valid schema
- Output: Valid JSON matching Pydantic schema
- Tools: None (no reasoning, just formatting)
```

**Benefits**:
- Stage 1 can think freely without schema constraints
- Stage 2 ensures schema conformance
- Robust to Stage 1 format variations

### 7. Sanitizer Pattern for Messy Data

**LLMs produce messy output, sanitizers clean it**:

```python
def sanitize_plan(raw_plan: dict) -> dict:
    # 1. Type coercion
    raw_plan = coerce_types(raw_plan)

    # 2. Key pruning
    raw_plan = prune_unknown_keys(raw_plan, allowed_keys)

    # 3. Dataset resolution
    raw_plan["dataset"]["name"] = resolve_dataset_alias(
        raw_plan["dataset"]["name"]
    )

    # 4. Caps enforcement
    if raw_plan["config"]["epochs"] > 20:
        raw_plan["config"]["epochs"] = 20

    # 5. Defaults injection
    if "seed" not in raw_plan["config"]:
        raw_plan["config"]["seed"] = 42

    return raw_plan
```

**When to use**:
- After LLM output, before Pydantic validation
- Handles common LLM mistakes (wrong types, extra keys)
- Applies business logic (caps, defaults)

---

## Next Steps

**Continue to Part 2**: [BACKEND_TECHNICAL_GUIDE_PART2.md](./BACKEND_TECHNICAL_GUIDE_PART2.md)

Part 2 covers:
- Stage 5: Materialize (Notebook generation)
- Stage 6: Execute (Notebook execution)
- Generator architecture
- Validation system
- Error handling
- Database schema
- Configuration

---

## Quick Reference

### Stage Summary

| Stage | Input | Output | LLM Model | Time |
|-------|-------|--------|-----------|------|
| **Ingest** | PDF | Paper record + vector store | None | 10-30s |
| **Verify** | Paper ID | `{reproducible: bool}` | N/A (not implemented) | N/A |
| **Extract** | Paper ID | Claims array | gpt-4o | 20-60s |
| **Plan** | Claims | Plan JSON v1.1 | o3-mini + gpt-4o | 30-90s |

### Key Files

```
api/app/routers/
├── papers.py          # Ingest, Verify, Extract
├── plans.py           # Plan generation
└── ...

api/app/agents/
├── registry.py        # Agent registry
├── definitions.py     # Agent configs
└── tooling.py         # Tool usage tracking

api/app/materialize/
├── sanitizer.py       # Plan sanitization
└── dataset_registry.py # Dataset metadata
```

### Configuration Quick Ref

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EXTRACTOR_MODEL=gpt-4o
OPENAI_PLANNER_MODEL=o3-mini
OPENAI_SCHEMA_FIXER_MODEL=gpt-4o

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_BUCKET_PAPERS=papers

# Tool caps
TOOL_CAP_FILE_SEARCH_PER_RUN=10
TOOL_CAP_WEB_SEARCH_PER_RUN=5
```

---

**Last Updated**: 2025-11-08
**Next**: [Part 2: Materialize & Execute](./BACKEND_TECHNICAL_GUIDE_PART2.md)
