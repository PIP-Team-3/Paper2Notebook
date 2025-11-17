# Paper2Notebook (P2N)

**Turn research papers into executable, reproducible Jupyter notebooks automatically.**

Paper2Notebook is an AI-powered system that converts machine learning research papers (PDFs) into deterministic, executable Jupyter notebooks with minimal human intervention. The system uses OpenAI Agents to extract claims, generate execution plans, and materialize runnable code.

---

## Contributors

- **Justin**: Primary Frontend Contributor
- **Jake**: Primary Backend Contributor
- **Daewoong**: Primary REST API Contributor
- **Ray**: Primary Storybook Generator Contributor

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Running the Full Pipeline](#running-the-full-pipeline)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Architecture Overview

Paper2Notebook consists of **three main services** that work together:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ───> │ API Server  │ ───> │   Backend   │
│  (Next.js)  │      │  (FastAPI)  │      │  (FastAPI)  │
│   Port 3000 │      │  Port 3001  │      │  Port 8000  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                     │
       │                    │                     │
       └────────────────────┴─────────────────────┘
                            │
                    ┌───────┴────────┐
                    │   Supabase     │
                    │ (Storage + DB) │
                    └────────────────┘
```

### Components

1. **Backend** (`backend/`) - Core P2N pipeline service
   - OpenAI Agents SDK for paper analysis
   - 6-stage pipeline: Ingest → Extract → Plan → Materialize → Execute → Report
   - Notebook generation and execution
   - Supabase integration for storage/database

2. **API Server** (`api/`) - Frontend proxy and middleware
   - Transforms backend SSE streams into frontend-friendly format
   - Handles CORS and authentication
   - Proxies requests to backend service
   - Provides simplified endpoints for UI

3. **Frontend** (`frontend/`) - User interface
   - Next.js 16 + React 19 + TypeScript
   - Real-time SSE streaming for extraction/execution
   - Modular step-by-step pipeline UI
   - Download generated notebooks and requirements

---

## Tech Stack

### Backend
- **Python 3.12.5**
- **FastAPI** - REST API framework
- **OpenAI Agents SDK 0.3.3** - LLM-powered extraction and planning
- **Supabase** - PostgreSQL database + storage
- **nbformat/nbclient** - Jupyter notebook generation and execution

### API Server
- **Python 3.x**
- **FastAPI** - Lightweight proxy server
- **python-dotenv** - Environment configuration

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible component primitives
- **Zod** - Schema validation

### Infrastructure
- **Supabase** - Hosted PostgreSQL + object storage
- **OpenAI API** - GPT-4o for agents

---

## Prerequisites

Before you begin, ensure you have:

- **Python 3.12.x** (recommended - tested with 3.12.5)
- **Node.js 18+** (for frontend)
- **Git**
- **Supabase Account** 
- **OpenAI API Key** 


### Verify Python Version
```bash
python --version  # Should show 3.12.x
```

If you have multiple Python versions:
```bash
# Windows
py -3.12 --version

# macOS/Linux with pyenv
pyenv install 3.12.5
pyenv local 3.12.5
```

---

## Current Project Status

**Phase**: Phase 2 - Smart Baselines (MVP)
**Last Updated**: November 2025

### What Works
- Complete pipeline: Ingest → Extract → Plan → Materialize → Execute
- **TextCNN paper** processing (end-to-end tested with SST-2 dataset)
- Autonomous validation system (syntax + sklearn parameter checks)
- LogisticRegression baseline execution (72.2% accuracy, ~30 seconds)

### Current Limitations
- **Only 1 paper fully tested**: "Convolutional Neural Networks for Sentence Classification" (Kim 2014)
- **Only SST-2 dataset confirmed working** (HuggingFace GLUE sentiment classification)
- Phase 2 uses **sklearn baselines**, not real CNN/ResNet architectures
- Accuracy gap: 72.2% achieved vs 88.1% paper claim (expected for simplified baseline)

### Next Phase (Phase 3)
- Implement real PyTorch model architectures (TextCNN, CharCNN, DenseNet)
- Match paper accuracy claims (88.1% target for TextCNN)
- Add more datasets (AG News, CIFAR-10)

---

## Quick Start

### Option A: Run All Services (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/PIP-Team-3/Paper2Notebook.git
   cd Paper2Notebook
   ```

2. **Set up environment files** (see [Detailed Setup](#detailed-setup))

3. **Run the backend**
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1  # Windows PowerShell
   # OR: source .venv/bin/activate  # macOS/Linux
   pip install -r api/requirements.txt

   # Load environment variables (Windows PowerShell)
   Get-Content .env | % { if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path ('Env:' + $matches[1].Trim()) -Value ($matches[2].Trim().Trim('"')) } }
   # OR (macOS/Linux): export $(grep -v '^#' .env | xargs)

   python -m uvicorn app.main:app --app-dir api --port 8000
   ```

4. **Run the API server** (new terminal)
   ```powershell
   cd api
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn main:app --port 3001
   ```

5. **Run the frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Server: http://localhost:3001
   - Backend: http://localhost:8000

---

## Detailed Setup

### 1. Backend Setup

#### Create `.env` file

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Required: OpenAI API Configuration
OPENAI_API_KEY=sk-proj-...   # Your OpenAI API key

# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key (secret!)
SUPABASE_ANON_KEY=eyJhbGc...  # Anon key (can be public)


```

#### Install dependencies

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
# OR: source .venv/bin/activate  # macOS/Linux

pip install -r api/requirements.txt
```

#### Load environment variables

**Important**: The backend does not use `python-dotenv` for automatic .env loading. You must manually load environment variables into your shell.

**Windows PowerShell** (run this in the terminal where you'll start the backend):

```powershell
# From backend/ directory
Get-Content .env | % { if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path ('Env:' + $matches[1].Trim()) -Value ($matches[2].Trim().Trim('"')) } }
```

**macOS/Linux** (bash/zsh):

```bash
# From backend/ directory
export $(grep -v '^#' .env | xargs)
```

**Note**: You need to run this command in each new terminal session before starting the backend.

#### Run the backend

```powershell
# From backend/ directory with venv activated and env vars loaded
python -m uvicorn app.main:app --app-dir api --port 8000 --log-level info
```

**Backend will be available at**: http://localhost:8000

---

### 2. API Server Setup

#### Create `.env` file

```bash
cd api
cp .env.example .env
```

Edit `api/.env`:

```env
# Required: Backend URL
BACKEND_URL=http://localhost:8000

# Required: Supabase Configuration (same as backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGc...  # Use ANON key here (not service role)
```

#### Install dependencies

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
# OR: source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

#### Run the API server

```powershell
# From api/ directory with venv activated
uvicorn main:app --port 3001
```

**API Server will be available at**: http://localhost:3001

---

### 3. Frontend Setup

#### Create `.env.local` file

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
# Required: API Server URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Install dependencies

```bash
cd frontend
npm install
```

#### Run the development server

```bash
npm run dev
```

**Frontend will be available at**: http://localhost:3000

---

## Running the Full Pipeline

### Via Web UI (Recommended)

1. **Navigate to** http://localhost:3000
2. **Upload a paper** - Click "Upload Paper" and select a PDF
3. **Extract claims** - Click "Extract Claims" to analyze the paper
4. **Review claims** - Table shows detected datasets, metrics, and values
5. **Generate plan** - Click "Generate Plan" to create execution plan
6. **Materialize notebook** - Click "Generate Tests" to create notebook
7. **Download artifacts** - Download notebook.ipynb and requirements.txt
8. **Execute notebook** - Click "Run Tests" to execute (optional)

### Via API (Advanced)

#### 1. Ingest a Paper

```powershell
# Upload PDF
curl.exe -X POST http://localhost:3001/papers/ `
  -F "title=TextCNN Paper" `
  -F "file=@C:\path\to\paper.pdf"

# Returns: { "paper_id": "uuid-here", ... }
```

#### 2. Extract Claims

```powershell
# Stream extraction (SSE)
curl.exe -N http://localhost:3001/papers/{paper_id}/extract

# Get extracted claims
curl.exe http://localhost:3001/papers/{paper_id}/claims
```

#### 3. Generate Plan

```powershell
# Trigger plan generation
curl.exe -X POST http://localhost:3001/papers/{paper_id}/plan

# Returns: { "plan_id": "uuid-here", ... }
```

#### 4. Materialize Notebook

```powershell
# Generate notebook and requirements
curl.exe -X POST http://localhost:3001/plans/{plan_id}/materialize

# Get download URLs
curl.exe http://localhost:3001/plans/{plan_id}/assets
```

#### 5. Execute Notebook (Optional)

```powershell
# Trigger execution
curl.exe -X POST http://localhost:3001/plans/{plan_id}/run

# Returns: { "run_id": "uuid-here", ... }
```

---

## API Documentation

### Base URLs

- **Frontend**: `http://localhost:3000`
- **API Server**: `http://localhost:3001`
- **Backend**: `http://localhost:8000/api/v1`

### API Server Endpoints (Port 3001)

**Note**: The frontend uses these endpoints. They proxy to the backend service.

#### Papers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/papers` | List all papers |
| GET | `/papers/{id}` | Get paper details |
| POST | `/papers/` | Upload a new paper |
| GET | `/papers/{id}/claims` | Get extracted claims |
| GET | `/papers/{id}/extract` | Extract claims (SSE stream) |
| GET | `/papers/{id}/plan` | Generate execution plan |

#### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans/{id}/materialize` | Generate notebook |
| GET | `/plans/{id}/assets` | Get download URLs |
| GET | `/plans/{id}/run` | Execute notebook |

**Backend API Documentation**: For detailed backend API (port 8000) documentation, see `backend/docs/ProjectOverview/API_REFERENCE.md`

### Example Response: Extract Claims

```json
[
  {
    "id": "claim-uuid",
    "paper_id": "paper-uuid",
    "dataset_name": "SST-2",
    "split": "test",
    "metric_name": "accuracy",
    "metric_value": 88.1,
    "units": "percent",
    "citation": "We achieve 88.1% accuracy on SST-2 test set (Section 4.2)",
    "confidence": 0.95,
    "created_at": "2025-11-16T12:00:00Z"
  }
]
```

### Example Response: Plan Assets

```json
{
  "notebook_signed_url": "https://supabase.co/storage/v1/object/sign/plans/abc-123/notebook.ipynb?token=...",
  "env_signed_url": "https://supabase.co/storage/v1/object/sign/plans/abc-123/requirements.txt?token=...",
  "expires_at": "2025-11-16T12:02:00Z"
}
```

### SSE Stream Format

Extraction and execution endpoints stream Server-Sent Events:

```
event: stage_update
data: {"stage": "extract_start", "message": "Starting extraction..."}

event: token
data: {"delta": "We evaluate on ", "agent": "extractor"}

event: result
data: {"claims": [...], "count": 3}
```

**Complete API Reference**: See `backend/docs/ProjectOverview/API_REFERENCE.md`

---

## Database Schema

### Papers Table

```sql
CREATE TABLE papers (
    id UUID PRIMARY KEY,
    title TEXT,
    pdf_storage_path TEXT,
    vector_store_id TEXT,
    stage TEXT,  -- 'ingest', 'extract', 'plan', 'generate_test', 'run_test', 'report'
    status TEXT,  -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Claims Table

```sql
CREATE TABLE claims (
    id UUID PRIMARY KEY,
    paper_id UUID,  -- Reference to papers.id (no FK constraint)
    dataset_name TEXT,
    split TEXT,
    metric_name TEXT,
    metric_value FLOAT,
    units TEXT,
    citation TEXT,
    confidence FLOAT,
    created_at TIMESTAMP
);
```

### Plans Table

```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    paper_id UUID,  -- Reference to papers.id
    plan_json JSONB,  -- Plan Document v1.1
    env_hash TEXT,
    budget_minutes INTEGER,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Runs Table

```sql
CREATE TABLE runs (
    id UUID PRIMARY KEY,
    plan_id UUID,  -- Reference to plans.id
    status TEXT,  -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    exit_code INTEGER,
    created_at TIMESTAMP
);
```

**Note**: Currently using "No-Rules v0" schema with no foreign keys or constraints for rapid iteration.

---

## Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'openai_agents'`

**Solution**: Ensure Python 3.12.5 is being used:
```powershell
python --version  # Must be 3.12.x
pip install -r api/requirements.txt
```

---

### API Server can't connect to backend

**Error**: `Connection refused to localhost:8000`

**Solution**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `BACKEND_URL` in `api/.env`: `BACKEND_URL=http://localhost:8000`

---

### Frontend can't reach API

**Error**: `Network request failed`

**Solution**:
1. Check API server is running: `curl http://localhost:3001/papers`
2. Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Check CORS is enabled in `api/main.py` (it should be by default)

---

### Supabase connection errors

**Error**: `Invalid Supabase credentials`

**Solution**:
1. Log into https://supabase.com/dashboard
2. Go to Project Settings → API
3. Copy:
   - **URL**: `https://your-project.supabase.co`
   - **anon public key**: For `SUPABASE_ANON_KEY`
   - **service_role secret key**: For `SUPABASE_SERVICE_ROLE_KEY`
4. Update both `backend/.env` and `api/.env`

---

### OpenAI API errors

**Error**: `Incorrect API key provided`

**Solution**:
1. Check API key in `backend/.env`: `OPENAI_API_KEY=sk-proj-...`
2. Verify key is valid: https://platform.openai.com/api-keys
3. Ensure you have credits: https://platform.openai.com/usage

**Error**: `Model gpt-4o not found`

**Solution**: Your API key may not have GPT-4o access. Upgrade at https://platform.openai.com/settings/organization/billing

---

### Notebook execution fails

**Error**: `ModuleNotFoundError` during execution

**Solution**:
1. Check `requirements.txt` was generated correctly
2. Ensure all dependencies are installed in execution environment
3. Review `backend/notebooks_mvp/` for examples

---

## Development

### Running Tests

#### Backend Tests
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -v
```

#### Specific Test Files
```powershell
# Test ingestion
python -m pytest api/tests/test_papers_ingest.py -v

# Test extraction
python -m pytest api/tests/test_papers_extract.py -v

# Test materialization
python -m pytest api/tests/test_plans_materialize.py -v
```

### Code Quality

#### Frontend Linting
```bash
cd frontend
npm run lint      # Check with Biome
npm run format    # Auto-format
```

#### Backend Type Checking
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
mypy api/app  # If mypy is installed
```

### Project Structure

```
Paper2Notebook/
├── backend/              # Core P2N pipeline service
│   ├── api/
│   │   ├── app/
│   │   │   ├── agents/       # OpenAI agent definitions
│   │   │   ├── routers/      # FastAPI route handlers
│   │   │   ├── materialize/  # Notebook generation
│   │   │   ├── run/          # Execution engine
│   │   │   └── data/         # Supabase models
│   │   ├── tests/            # Pytest test suite
│   │   └── requirements.txt
│   ├── docs/                 # Technical documentation
│   ├── notebooks_mvp/        # Example executed notebooks
│   └── .env.example
│
├── api/                  # Frontend proxy server
│   ├── main.py           # FastAPI proxy
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/             # Next.js UI
│   ├── src/
│   │   └── app/
│   │       └── dashboard/
│   │           └── papers/   # Paper pipeline UI
│   ├── package.json
│   └── .env.example
│
├── storybookGenerator/   # Storybook image generation
│   ├── download_paper.py
│   ├── extract_claims.py
│   └── generate_storybook.py
│
└── README.md            # This file
```

---

## Additional Documentation

- **Backend Technical Guide**: `backend/docs/ProjectOverview/BACKEND_TECHNICAL_GUIDE_PART1.md`
- **API Reference**: `backend/docs/ProjectOverview/API_REFERENCE.md`
- **Sprint Progress**: `backend/docs/ActiveSprint/README.md`
- **Project Roadmap**: `backend/docs/ProjectOverview/ROADMAP.md`

---
