# Paper2Notebook

**Transform research papers into executable, reproducible Jupyter notebooks automatically.**

Paper2Notebook is an AI-powered system that converts machine learning research papers into deterministic, executable Jupyter notebooks. The system uses OpenAI Agents to extract claims, generate execution plans, and materialize runnable code.

---

## Contributors

- **Justin**: Primary Frontend Contributor
- **Jake**: Primary Backend Contributor
- **Daewoong**: Primary REST API Contributor
- **Ray**: Primary Storybook Generator Contributor

---

## Architecture Overview

Paper2Notebook consists of **four main services** that work together:

```
                    ┌─────────────┐
                    │   Frontend  │
                    │  (Next.js)  │
                    │   Port 3000 │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ API Gateway │
                    │  (FastAPI)  │
                    │   Port 3001 │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
         ┌─────────────┐      ┌─────────────┐
         │   Backend   │      │  Storybook  │
         │  (FastAPI)  │      │  Generator  │
         │   Port 8000 │      │   Port 8001 │
         └──────┬──────┘      └──────┬──────┘
                │                    │
                └────────┬───────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Supabase   │
                  │(Storage+DB) │
                  └─────────────┘
```

### Services

1. **Frontend** (`frontend/`) - User interface
   - Next.js with React Server Components
   - Real-time SSE streaming for extraction/execution
   - Paper upload and management
   - Storybook mode for kid-friendly explanations

2. **API Gateway** (`api/`) - Request routing
   - Routes requests between frontend and backend services
   - Handles CORS and proxying
   - Simplifies frontend integration

3. **Backend** (`backend/`) - Core pipeline service
   - OpenAI Agents SDK for paper analysis
   - Claims extraction and plan generation
   - Notebook generation and execution
   - Supabase integration

4. **Storybook Generator** (`storybook-generator/`) - Kid-mode service
   - Standalone FastAPI service
   - Generates kid-friendly storybooks from papers
   - Image generation for visual explanations

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Python 3.12, FastAPI, OpenAI Agents SDK
- **API Gateway**: FastAPI, httpx
- **Storybook Generator**: FastAPI, OpenAI API, Pillow
- **Infrastructure**: Supabase (PostgreSQL + Storage), Docker

---

## Prerequisites

Before you begin, ensure you have:

- **Docker** and **Docker Compose**
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com)
- **OpenAI API Key** - [Get from platform.openai.com](https://platform.openai.com/api-keys)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/PIP-Team-3/Paper2Notebook.git
cd Paper2Notebook
```

### 2. Set Up Environment Files

Create `.env` files for each service:

```bash
# Backend
cp backend/.env.example backend/.env

# API Gateway
cp api/.env.example api/.env

# Storybook Generator
cp storybook-generator/.env.example storybook-generator/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit each `.env` file with your credentials:

**backend/.env**:
```env
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**api/.env**:
```env
BACKEND_URL=http://backend:8000
STORYBOOK_GENERATOR_URL=http://storybook-generator:8001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**storybook-generator/.env**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

**frontend/.env**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

The services will be available at:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Backend**: http://localhost:8000
- **Storybook Generator**: http://localhost:8001

---

## Using the Application

### Upload and Process a Paper

1. Navigate to **http://localhost:3000**
2. Click **"Upload Paper"** and select a PDF
3. Click **"Extract Claims"** to analyze the paper with AI
4. Review the extracted claims (datasets, metrics, values)
5. Click **"Generate Plan"** to create a reproduction plan
6. Click **"Generate Tests"** to create a Jupyter notebook
7. Download the notebook and requirements.txt
8. Click **"Run Tests"** to execute the notebook (optional)

### Kid Mode (Storybook)

1. Navigate to a paper's detail page
2. Click **"Kid Mode"** to generate a kid-friendly explanation
3. View the storybook with simplified language and images

---

## Deployed Version

Paper2Notebook is deployed on Google Cloud Run as four separate microservices (Frontend, API Gateway, Backend, Storybook Generator). Each service runs independently and can be scaled, updated, or replaced without affecting the others.

**The production URL will be included in the project submission.**

To use the deployed version, navigate to the Frontend URL - it connects to all backend services automatically.

### How to Use

1. **Upload a Paper**: Click "Upload Paper" and select a PDF of a machine learning research paper. Optionally attach a dataset file (.csv, .xlsx).

2. **Extract Claims**: Once uploaded, click "Extract Claims" to have the AI analyze the paper and identify reproducible claims (datasets, metrics, reported values).

3. **Generate Plan**: Select the claims you want to reproduce and click "Generate Plan" to create an execution strategy.

4. **Generate Tests**: Click "Generate Tests" to materialize a Jupyter notebook with executable code.

5. **Run Tests**: Execute the notebook directly in the cloud and view real-time streaming logs.

6. **Download Artifacts**: Download the generated notebook and requirements.txt for local use.

### Recommended Test Papers

We will provide two papers in the project submission that we recommend for testing:

1. **TextCNN Paper** - Does not require a dataset file. The system will automatically fetch the required data during execution.
   - **Note (Deployed Version)**: The TextCNN paper cannot currently be executed on the deployed version due to Google Cloud Run's IP being banned from sending too many requests to external data sources. However, you can still upload the paper, extract its claims, and generate a test notebook.
   - **Important**: When extracting claims from the TextCNN paper, only **SST-2** is available in the dataset registry. This is the only dataset claim that can be selected for reproduction.

2. **Soccer Paper** - Requires the accompanying dataset file (included in submission). Upload this dataset along with the paper.

These papers were the primary focus of our testing and provide the most reliable demonstration of the system's capabilities.

### Important Notes

- **One Upload Per Paper**: Each paper can only be uploaded once. Re-uploading the same paper requires manual database cleanup. This is by design to prevent duplicate processing.

- **Pipeline is Sequential**: After upload, you must complete each step in order: Extract Claims → Generate Plan → Generate Tests → Run Tests.

- **Processing Times**: Claim extraction takes 1-2 minutes. Notebook execution varies based on the complexity of the reproduction (typically 2-10 minutes).

---

## Storybook Mode (Prototype)

The "Kid Mode" storybook feature is currently in **prototype phase**. It demonstrates the system's modularity by showing how additional services can be plugged into the architecture.

**Current Capabilities**:
- Generates simplified explanations of research papers
- Creates AI-generated illustrations for each concept
- Presents content in a kid-friendly storybook format

**Architectural Significance**: The storybook generator runs as a completely separate microservice, demonstrating how the Paper2Notebook architecture supports:
- **Service Independence**: Each service can be developed, deployed, and scaled independently
- **Pluggable Modules**: New analysis or presentation modes can be added without modifying core services
- **API-First Design**: All services communicate through well-defined REST APIs

This modularity means Paper2Notebook can be extended with additional output formats (video explanations, interactive tutorials, etc.) by simply adding new microservices.

---

## Key Features

- **Paper Upload** - Drag and drop PDF uploads with progress tracking
- **AI Claims Extraction** - Automatic extraction of datasets, metrics, and results
- **Plan Generation** - Create reproducible experiment plans from claims
- **Notebook Generation** - Generate executable Jupyter notebooks automatically
- **Test Execution** - Run notebooks and capture metrics
- **Kid Mode** - Generate kid-friendly storybook explanations with images
- **Real-time Streaming** - SSE streams for live extraction and execution updates

---

## Database Schema

The application uses Supabase (PostgreSQL) for data persistence. Below are the main tables:

### Papers Table

Stores uploaded research papers and their processing status.

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

Stores extracted scientific claims from papers.

```sql
CREATE TABLE claims (
    id UUID PRIMARY KEY,
    paper_id UUID,
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

Stores generated reproduction plans.

```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    paper_id UUID,
    plan_json JSONB,  -- Plan Document JSON
    env_hash TEXT,
    budget_minutes INTEGER,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Runs Table

Stores notebook execution runs and their results.

```sql
CREATE TABLE runs (
    id UUID PRIMARY KEY,
    plan_id UUID,
    status TEXT,  -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    exit_code INTEGER,
    created_at TIMESTAMP
);
```

---

## Service Documentation

Each service has detailed setup instructions in its README:

- **Frontend**: [frontend/README.md](frontend/README.md)
- **API Gateway**: [api/README.md](api/README.md)
- **Backend**: [backend/README.md](backend/README.md)
- **Storybook Generator**: [storybook-generator/README.md](storybook-generator/README.md)

---
