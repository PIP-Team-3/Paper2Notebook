# Paper2Notebook API Reference

**Last Updated**: 2025-11-08
**API Version**: v1
**Base URL**: `/api/v1`

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Papers Endpoints](#papers-endpoints)
4. [Plans Endpoints](#plans-endpoints)
5. [Runs Endpoints](#runs-endpoints)
6. [Explain Endpoints](#explain-endpoints)
7. [Reports Endpoints](#reports-endpoints)
8. [Internal Endpoints](#internal-endpoints)
9. [Database Schema](#database-schema)
10. [Error Codes](#error-codes)

---

## API Overview

The P2N API provides a RESTful interface for the 6-stage pipeline:

| Stage | Purpose | Primary Endpoints |
|-------|---------|-------------------|
| 1. Ingest | Upload PDF, create vector store | `POST /papers/ingest` |
| 2. Verify | Check ingestion artifacts | `GET /papers/{paper_id}/verify` |
| 3. Extract | Extract claims via LLM | `POST /papers/{paper_id}/extract` |
| 4. Plan | Generate execution plan | `POST /papers/{paper_id}/plan` |
| 5. Materialize | Generate notebook | `POST /plans/{plan_id}/materialize` |
| 6. Execute | Run notebook | `POST /plans/{plan_id}/run` |

### Key Characteristics

- **SSE Streaming**: Extract and Execute endpoints use Server-Sent Events for real-time progress
- **Asynchronous Execution**: Notebook execution runs in background tasks
- **Signed URLs**: Temporary authenticated URLs for storage artifacts (TTL: 120-3600s)
- **Idempotency**: Ingesting same PDF (by SHA256) returns existing paper
- **Cascade Deletes**: Deleting a paper removes all associated claims, plans, runs

---

## Authentication

**Current (MVP)**: No authentication required. Service role has full database access (RLS disabled).

**Future**: Will implement user-scoped access with `created_by` fields and RLS policies.

---

## Papers Endpoints

### POST /api/v1/papers/ingest

Upload a research paper PDF and create an OpenAI vector store for File Search.

**Request**:
```http
POST /api/v1/papers/ingest
Content-Type: multipart/form-data

file: [PDF file] (max 15 MiB)
title: "Optional paper title"
created_by: "Optional UUID"
```

OR

```http
POST /api/v1/papers/ingest
Content-Type: application/json

{
  "url": "https://arxiv.org/pdf/2301.12345.pdf",
  "title": "Optional paper title",
  "created_by": "Optional UUID"
}
```

**Response** (201 Created):
```json
{
  "paper_id": "550e8400-e29b-41d4-a716-446655440000",
  "vector_store_id": "vs_68e3324f8c7a4d9e9e1f2b3c4d5e6f7a",
  "storage_path": "papers/dev/2025/11/08/550e8400-e29b-41d4-a716-446655440000.pdf"
}
```

**Idempotency**: Uploading same PDF (by SHA256) returns existing `paper_id`

**Errors**:
- `415 E_UNSUPPORTED_MEDIA_TYPE`: Not a PDF
- `413 E_FILE_TOO_LARGE`: Exceeds 15 MiB limit
- `502 E_FILESEARCH_INDEX_FAILED`: OpenAI vector store creation failed
- `500 E_DB_INSERT_FAILED`: Database persistence failed

**Location**: [papers.py:131-289](../api/app/routers/papers.py#L131-L289)

---

### GET /api/v1/papers/{paper_id}/verify

Verify that ingested paper artifacts exist in storage and vector store.

**Request**:
```http
GET /api/v1/papers/{paper_id}/verify
```

**Response** (200 OK):
```json
{
  "storage_path_present": true,
  "vector_store_present": true
}
```

**Errors**:
- `404`: Paper not found

**Location**: [papers.py:292-308](../api/app/routers/papers.py#L292-L308)

---

### POST /api/v1/papers/{paper_id}/extract

Extract quantitative performance claims from the paper using LLM + File Search.

**Request**:
```http
POST /api/v1/papers/{paper_id}/extract
```

**Response** (200 OK - SSE Stream):
```
event: stage_update
data: {"agent": "extractor", "stage": "extract_start"}

event: stage_update
data: {"agent": "extractor", "stage": "file_search_call"}

event: token
data: {"agent": "extractor", "delta": "...", "agent": "extractor"}

event: stage_update
data: {"agent": "extractor", "stage": "persist_start", "count": 3}

event: stage_update
data: {"agent": "extractor", "stage": "persist_done", "count": 3}

event: stage_update
data: {"agent": "extractor", "stage": "extract_complete"}

event: result
data: {
  "agent": "extractor",
  "claims": [
    {
      "dataset": "SST-2",
      "split": "test",
      "metric": "accuracy",
      "value": 88.1,
      "units": "%",
      "citation": "Table 1, p.3",
      "confidence": 0.95
    }
  ]
}
```

**Claims Saved**: Claims are automatically persisted to `claims` table (replace policy: deletes old claims first)

**Errors**:
- `404`: Paper not ready (no vector_store_id)
- `429 E_POLICY_CAP_EXCEEDED`: File Search usage cap exceeded
- `502 E_EXTRACT_RUN_FAILED`: Extractor agent failed
- `502 E_EXTRACT_NO_OUTPUT`: No structured output produced
- `422 E_EXTRACT_LOW_CONFIDENCE`: Guardrail rejected low-confidence claims
- `502 E_EXTRACT_OPENAI_ERROR`: OpenAI API request failed

**Location**: [papers.py:311-739](../api/app/routers/papers.py#L311-L739)

---

### GET /api/v1/papers/{paper_id}/claims

Retrieve all extracted claims for a paper.

**Request**:
```http
GET /api/v1/papers/{paper_id}/claims
```

**Response** (200 OK):
```json
{
  "paper_id": "550e8400-e29b-41d4-a716-446655440000",
  "claims_count": 3,
  "claims": [
    {
      "id": "claim-uuid-1",
      "dataset_name": "SST-2",
      "split": "test",
      "metric_name": "accuracy",
      "metric_value": 88.1,
      "units": "%",
      "source_citation": "Table 1, p.3",
      "confidence": 0.95,
      "created_at": "2025-11-08T10:30:00Z"
    }
  ]
}
```

**Location**: [papers.py:742-770](../api/app/routers/papers.py#L742-L770)

---

## Plans Endpoints

### POST /api/v1/papers/{paper_id}/plan

Generate a reproduction execution plan using LLM reasoning.

**Request**:
```http
POST /api/v1/papers/{paper_id}/plan
Content-Type: application/json

{
  "claims": [
    {
      "dataset": "SST-2",
      "split": "test",
      "metric": "accuracy",
      "value": 88.1,
      "units": "%",
      "citation": "Table 1, p.3",
      "confidence": 0.95
    }
  ],
  "budget_minutes": 20
}
```

**Response** (200 OK):
```json
{
  "plan_id": "plan-uuid",
  "plan_version": "1.1",
  "plan_json": {
    "version": "1.1",
    "dataset": {
      "name": "sst2",
      "source": "huggingface",
      "splits": ["train", "validation"]
    },
    "model": {
      "name": "TextCNN",
      "architecture": "baseline_logistic"
    },
    "config": {
      "batch_size": 32,
      "learning_rate": 0.001,
      "epochs": 5,
      "seed": 42
    },
    "metrics": ["accuracy"],
    "visualizations": ["confusion_matrix"],
    "policy": {
      "budget_minutes": 20,
      "max_retries": 1
    },
    "justifications": {
      "dataset": {
        "quote": "We use SST-2 for sentiment classification...",
        "citation": "Section 3.1"
      },
      "model": {
        "quote": "TextCNN architecture with...",
        "citation": "Section 3.2"
      },
      "config": {
        "quote": "Training hyperparameters...",
        "citation": "Section 4.1"
      }
    },
    "estimated_runtime_minutes": 10,
    "license_compliant": true
  },
  "warnings": [],
  "data_resolution": {
    "status": "resolved",
    "dataset": "SST-2",
    "canonical_name": "sst2",
    "reason": null,
    "suggestions": []
  }
}
```

**Two-Stage Planning** (when `PLANNER_TWO_STAGE_ENABLED=true` and model is `o3-mini`):
1. **Stage 1 (o3-mini)**: Deep reasoning about reproduction strategy (may return natural language or malformed JSON)
2. **Stage 2 (GPT-4o)**: Convert Stage 1 output to valid Plan v1.1 schema
3. **Sanitizer**: Post-processing for type coercion, dataset resolution, pruning

**Errors**:
- `404 E_PLAN_NOT_READY`: Paper not ready (no vector_store_id)
- `502 E_PLAN_RUN_FAILED`: Planner agent failed
- `502 E_PLAN_NO_OUTPUT`: No output produced
- `400 E_PLAN_SCHEMA_INVALID`: JSON doesn't match Plan v1.1 schema
- `422 E_PLAN_GUARDRAIL_FAILED`: Guardrail rejected plan (missing justifications)
- `422 E_PLAN_NO_ALLOWED_DATASETS`: All datasets blocked or unknown
- `502 E_PLAN_OPENAI_ERROR`: OpenAI API request failed

**Location**: [plans.py:238-843](../api/app/routers/plans.py#L238-L843)

---

### POST /api/v1/plans/{plan_id}/materialize

Generate notebook and requirements.txt from plan (template-based, NO LLMs).

**Request**:
```http
POST /api/v1/plans/{plan_id}/materialize
```

**Response** (200 OK):
```json
{
  "notebook_asset_path": "plan-uuid/notebook.ipynb",
  "env_asset_path": "plan-uuid/requirements.txt",
  "env_hash": "sha256:abc123..."
}
```

**Code Generation Process**:
1. Select dataset generator via factory (HuggingFace, Torchvision, Synthetic)
2. Select model generator via factory (SklearnLogistic for Phase 2 baselines)
3. Collect imports and requirements from generators
4. Assemble notebook cells (markdown, setup, imports, dataset, model, training, evaluation)
5. **Validate** notebook (syntax check, sklearn parameter check)
6. Persist to Supabase Storage (`plans/{plan_id}/notebook.ipynb`, `plans/{plan_id}/requirements.txt`)
7. Update plan record with `env_hash`

**Errors**:
- `404 E_PLAN_NOT_FOUND`: Plan doesn't exist
- `400 E_PLAN_SCHEMA_INVALID`: Stored plan failed validation
- `422 NOTEBOOK_VALIDATION_FAILED`: Generated notebook failed validation checks

**Location**: [plans.py:849-925](../api/app/routers/plans.py#L849-L925)

---

### GET /api/v1/plans/{plan_id}/assets

Get signed URLs for materialized plan artifacts (notebook, requirements.txt).

**Request**:
```http
GET /api/v1/plans/{plan_id}/assets
```

**Response** (200 OK):
```json
{
  "notebook_signed_url": "https://supabase.co/storage/v1/object/sign/plans/plan-uuid/notebook.ipynb?token=...",
  "env_signed_url": "https://supabase.co/storage/v1/object/sign/plans/plan-uuid/requirements.txt?token=...",
  "expires_at": "2025-11-08T12:30:00Z"
}
```

**TTL**: 120 seconds

**Errors**:
- `404 E_PLAN_NOT_FOUND`: Plan doesn't exist
- `404 E_PLAN_ASSET_MISSING`: Assets not materialized yet

**Location**: [plans.py:928-971](../api/app/routers/plans.py#L928-L971)

---

## Runs Endpoints

### POST /api/v1/plans/{plan_id}/run

Execute a materialized plan's notebook in background task.

**Request**:
```http
POST /api/v1/plans/{plan_id}/run
```

**Response** (202 Accepted):
```json
{
  "run_id": "run-uuid"
}
```

**Execution Flow**:
1. Validate plan is materialized (`env_hash` must exist)
2. Create run record in database (status: `pending`)
3. Launch async background task
4. Download notebook from storage
5. Execute with nbclient (timeout: `policy.budget_minutes`, max 25 minutes)
6. Emit SSE events to `/api/v1/runs/{run_id}/events`
7. Persist artifacts to storage (`runs/{run_id}/metrics.json`, `runs/{run_id}/events.jsonl`, `runs/{run_id}/logs.txt`)
8. Update run record (status: `succeeded` or `failed`)

**Errors**:
- `404 E_PLAN_NOT_FOUND`: Plan doesn't exist
- `400 E_PLAN_NOT_MATERIALIZED`: Plan not materialized yet (no `env_hash`)

**Location**: [runs.py:223-272](../api/app/routers/runs.py#L223-L272)

---

### GET /api/v1/runs/{run_id}/events

Stream real-time execution events via SSE.

**Request**:
```http
GET /api/v1/runs/{run_id}/events
Accept: text/event-stream
```

**Response** (200 OK - SSE Stream):
```
event: stage_update
data: {"stage": "run_start", "run_id": "run-uuid"}

event: progress
data: {"percent": 0}

event: log_line
data: {"message": "Installing dependencies..."}

event: log_line
data: {"message": "Loading dataset..."}

event: progress
data: {"percent": 50}

event: log_line
data: {"message": "Training model..."}

event: stage_update
data: {"stage": "run_complete", "run_id": "run-uuid"}

event: progress
data: {"percent": 100}
```

**Event Types**:
- `stage_update`: Stage transitions (`run_start`, `run_complete`, `run_error`)
- `progress`: Progress percentage (0-100)
- `log_line`: Execution logs
- `error`: Execution errors

**Errors** (emitted as events):
- `E_RUN_TIMEOUT`: Exceeded budget_minutes
- `E_GPU_REQUESTED`: Notebook tried to use GPU (blocked)
- `E_RUN_FAILED`: Notebook execution failed

**Location**: [runs.py:275-278](../api/app/routers/runs.py#L275-L278)

---

## Explain Endpoints

### POST /api/v1/explain/kid

Generate a kid-friendly storyboard (grade-3 reading level) for a paper.

**Request**:
```http
POST /api/v1/explain/kid
Content-Type: application/json

{
  "paper_id": "paper-uuid"
}
```

**Response** (201 Created):
```json
{
  "storyboard_id": "story-uuid",
  "paper_id": "paper-uuid",
  "pages_count": 6,
  "signed_url": "https://supabase.co/storage/v1/object/sign/storyboards/story-uuid.json?token=...",
  "expires_at": "2025-11-08T11:30:00Z"
}
```

**Storyboard JSON Structure**:
```json
{
  "pages": [
    {
      "number": 1,
      "title": "What's This Paper About?",
      "content": "Grade-3 level explanation...",
      "alt_text": "Description for screen readers",
      "scene": "setup"
    }
  ]
}
```

**Errors**:
- `404 E_PAPER_NOT_FOUND`: Paper doesn't exist
- `400 E_STORY_MISSING_ALT_TEXT`: Generated storyboard missing alt_text
- `400 E_STORY_TOO_FEW_PAGES`: Less than 5 pages generated

**Location**: [explain.py:41-131](../api/app/routers/explain.py#L41-L131)

---

### POST /api/v1/explain/kid/{storyboard_id}/refresh

Update storyboard's final page with actual run results.

**Request**:
```http
POST /api/v1/explain/kid/{storyboard_id}/refresh
```

**Response** (200 OK):
```json
{
  "storyboard_id": "story-uuid",
  "run_id": "run-uuid",
  "scoreboard": {
    "metric_name": "accuracy",
    "claimed_value": 88.1,
    "observed_value": 72.2,
    "gap_percent": -18.05
  },
  "signed_url": "https://supabase.co/storage/v1/object/sign/storyboards/story-uuid.json?token=..."
}
```

**Errors**:
- `404 E_STORY_NOT_FOUND`: Storyboard doesn't exist
- `404 E_STORY_NO_RUN`: No successful runs found for paper
- `400 E_STORY_UPDATE_NOT_POSSIBLE`: Can't compute gap (missing metrics)

**Location**: [explain.py:134-235](../api/app/routers/explain.py#L134-L235)

---

## Reports Endpoints

### GET /api/v1/papers/{paper_id}/report

Compute reproduction gap for a paper (claimed vs observed metric).

**Request**:
```http
GET /api/v1/papers/{paper_id}/report
```

**Response** (200 OK):
```json
{
  "paper_id": "paper-uuid",
  "run_id": "run-uuid",
  "claimed": 88.1,
  "observed": 72.2,
  "gap_percent": -18.05,
  "metric_name": "accuracy",
  "citations": [
    {
      "source": "Table 1, p.3",
      "confidence": 0.95
    }
  ],
  "artifacts": {
    "metrics_url": "https://supabase.co/storage/v1/object/sign/runs/run-uuid/metrics.json?token=...",
    "events_url": "https://supabase.co/storage/v1/object/sign/runs/run-uuid/events.jsonl?token=...",
    "logs_url": "https://supabase.co/storage/v1/object/sign/runs/run-uuid/logs.txt?token=..."
  }
}
```

**Gap Calculation**:
```
gap_percent = ((observed - claimed) / claimed) * 100
```
- Positive: Exceeded claim
- Negative: Fell short of claim
- 0: Matched claim exactly

**Errors**:
- `404 E_REPORT_NO_RUNS`: No successful runs found
- `404 E_REPORT_NO_CLAIM`: Plan not found for run
- `400 E_REPORT_METRIC_NOT_FOUND`: Metrics.json missing or invalid

**Location**: [reports.py:43-121](../api/app/routers/reports.py#L43-L121)

---

## Internal Endpoints

### GET /internal/config/doctor

Get redacted environment configuration snapshot (dev tool).

**Request**:
```http
GET /internal/config/doctor
```

**Response** (200 OK):
```json
{
  "openai_api_key_present": true,
  "supabase_url_present": true,
  "supabase_service_role_key_present": true,
  "p2n_dev_user_id": "user-uuid",
  "environment": "development"
}
```

**Location**: [internal.py:23-27](../api/app/routers/internal.py#L23-L27)

---

### POST /internal/storage/signed-url

Mint a short-lived signed URL for manual testing (dev only).

**Request**:
```http
POST /internal/storage/signed-url
Content-Type: application/json

{
  "bucket": "papers",
  "path": "papers/dev/2025/11/08/paper-uuid.pdf",
  "ttl_seconds": 300
}
```

**Response** (200 OK):
```json
{
  "signed_url": "https://supabase.co/storage/v1/object/sign/papers/...",
  "expires_at": "2025-11-08T10:35:00Z"
}
```

**Location**: [internal.py:41-60](../api/app/routers/internal.py#L41-L60)

---

### POST /internal/db/smoke

Run CRUD smoke test on papers table (dev only).

**Request**:
```http
POST /internal/db/smoke
```

**Response** (200 OK):
```json
{
  "inserted": 1,
  "read": 1,
  "deleted": 1
}
```

**Location**: [internal.py:69-96](../api/app/routers/internal.py#L69-L96)

---

## Database Schema

### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `papers` | Ingested PDFs with vector stores | One-to-many: claims, plans, storyboards |
| `claims` | Extracted performance claims | Many-to-one: papers |
| `plans` | Execution plans (Plan v1.1) | Many-to-one: papers; One-to-many: runs |
| `runs` | Notebook execution records | Many-to-one: plans, papers; One-to-many: run_events |
| `run_events` | SSE event stream history | Many-to-one: runs |
| `storyboards` | Kid-friendly explanations | Many-to-one: papers |
| `assets` | Storage artifact metadata | Many-to-one: plans, runs |
| `evals` | Human evaluations | Many-to-one: runs |

### Schema Features

- **Cascade Deletes**: Deleting a paper removes all claims, plans, runs, events
- **Unique Constraints**: SHA256 deduplication, one vector store per paper, monotonic event sequences
- **Check Constraints**: Status enums, confidence ranges (0.0-1.0), budget limits (1-120 minutes)
- **Indexes**: Foreign keys, composite indexes (runs by paper+status), partial indexes (non-ready papers)
- **Triggers**: Auto-update `updated_at`, auto-calculate `runs.duration_sec`

**Full Schema**: See [sql/README.md](../../sql/README.md)

---

## Error Codes

### Ingest Errors (Stage 1)

| Code | HTTP Status | Description | Remediation |
|------|-------------|-------------|-------------|
| `E_UNSUPPORTED_MEDIA_TYPE` | 415 | Not a PDF | Upload PDF file |
| `E_FILE_TOO_LARGE` | 413 | Exceeds 15 MiB | Compress PDF |
| `E_FETCH_FAILED` | 400 | URL download failed | Check URL accessibility |
| `E_FILESEARCH_INDEX_FAILED` | 502 | OpenAI vector store creation failed | Verify OpenAI API key |
| `E_DB_INSERT_FAILED` | 500 | Database persistence failed | Check Supabase credentials |

### Extract Errors (Stage 3)

| Code | HTTP Status | Description | Remediation |
|------|-------------|-------------|-------------|
| `E_EXTRACT_LOW_CONFIDENCE` | 422 | Guardrail rejected low-confidence claims | Manual claim editor |
| `E_EXTRACT_RUN_FAILED` | 502 | Extractor agent failed | Retry extraction |
| `E_EXTRACT_NO_OUTPUT` | 502 | No structured output | Check prompt/schema |
| `E_EXTRACT_OPENAI_ERROR` | 502 | OpenAI API failure | Verify API credentials |
| `E_POLICY_CAP_EXCEEDED` | 429 | File Search usage cap exceeded | Adjust usage cap |

### Plan Errors (Stage 4)

| Code | HTTP Status | Description | Remediation |
|------|-------------|-------------|-------------|
| `E_PLAN_NOT_READY` | 404 | Paper not ready | Ingest paper first |
| `E_PLAN_RUN_FAILED` | 502 | Planner agent failed | Retry planning |
| `E_PLAN_NO_OUTPUT` | 502 | No output produced | Adjust prompts |
| `E_PLAN_SCHEMA_INVALID` | 400 | JSON doesn't match schema | Refine planner prompt |
| `E_PLAN_GUARDRAIL_FAILED` | 422 | Missing justifications | Review planner prompt |
| `E_PLAN_NO_ALLOWED_DATASETS` | 422 | All datasets blocked/unknown | Add datasets to registry |

### Materialize Errors (Stage 5)

| Code | HTTP Status | Description | Remediation |
|------|-------------|-------------|-------------|
| `E_PLAN_NOT_FOUND` | 404 | Plan doesn't exist | Create plan first |
| `NOTEBOOK_VALIDATION_FAILED` | 422 | Generated notebook failed validation | Check generator code |

### Run Errors (Stage 6)

| Code | HTTP Status | Description | Remediation |
|------|-------------|-------------|-------------|
| `E_PLAN_NOT_MATERIALIZED` | 400 | Plan not materialized | Materialize plan first |
| `E_RUN_TIMEOUT` | (event) | Exceeded budget_minutes | Increase budget or optimize |
| `E_GPU_REQUESTED` | (event) | GPU usage detected | Use CPU-only code |
| `E_RUN_FAILED` | (event) | Notebook execution failed | Check logs |

### Report Errors

| Code | HTTP Status | Description | Remediation |
|------|-------------|-------------|-------------|
| `E_REPORT_NO_RUNS` | 404 | No successful runs found | Execute plan first |
| `E_REPORT_NO_CLAIM` | 404 | Plan not found | Ensure plan exists |
| `E_REPORT_METRIC_NOT_FOUND` | 400 | Metrics.json missing | Check run artifacts |

---

## Navigation

- [Project Overview](./PROJECT_OVERVIEW.md)
- [Backend Technical Guide Part 1](./BACKEND_TECHNICAL_GUIDE_PART1.md) - Stages 1-4 deep dive
- [Backend Technical Guide Part 2](./BACKEND_TECHNICAL_GUIDE_PART2.md) - Stages 5-6 deep dive
- [Roadmap](./ROADMAP.md)
- [Database Schema](../../sql/README.md)
- [Active Sprint](../ActiveSprint/)
