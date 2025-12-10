# Paper2Notebook Backend

A FastAPI service that transforms research papers into reproducible Jupyter notebooks using AI agents.

## Quick Start

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r api/requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**Important**: The backend does not automatically load `.env` files. You must manually load environment variables before starting the server.

### 4. Load Environment Variables

**macOS/Linux**:
```bash
export $(grep -v '^#' .env | xargs)
```

**Windows PowerShell**:
```powershell
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), 'Process')
    }
}
```

**Windows CMD**:
```cmd
for /f "tokens=*" %i in (.env) do set %i
```

### 5. Run the Server

```bash
uvicorn app.main:app --app-dir api --reload
```

The service will start on `http://localhost:8000`

**Note**: You need to reload environment variables in each new terminal session before starting the backend.

## Using with Docker

```bash
# From project root
docker-compose up backend
```

The backend will be available at `http://localhost:8000`

## Key Features

- **Paper Ingestion** - Upload PDFs and store in Supabase with vector search
- **Claims Extraction** - AI-powered extraction of scientific claims from papers
- **Plan Generation** - Create reproducible experiment plans using LLM reasoning
- **Notebook Materialization** - Generate executable Jupyter notebooks from plans
- **Test Execution** - Run notebooks and capture metrics/results
- **SSE Streaming** - Real-time progress updates for long-running operations

## API Endpoints

### Health Check
```
GET http://localhost:8000/health
```

### Paper Management
```
POST /api/v1/papers/ingest          # Upload a paper
GET  /api/v1/papers/{paper_id}      # Get paper details
POST /api/v1/papers/{paper_id}/extract  # Extract claims (SSE)
```

### Plan Generation
```
POST /api/v1/papers/{paper_id}/plan     # Generate reproduction plan
GET  /api/v1/plans/{plan_id}            # Get plan details
POST /api/v1/plans/{plan_id}/materialize # Generate notebook
GET  /api/v1/plans/{plan_id}/assets     # Get signed URLs
```

### Execution
```
POST /api/v1/plans/{plan_id}/run        # Execute notebook
GET  /api/v1/runs/{run_id}/events       # Stream execution events (SSE)
```

## Running Tests

```bash
python -m pytest
```

## Tech Stack

- **FastAPI** for REST API
- **OpenAI Agents SDK** for AI orchestration
- **Supabase** for database and storage
- **Pydantic** for data validation
- **Server-Sent Events** for streaming updates
