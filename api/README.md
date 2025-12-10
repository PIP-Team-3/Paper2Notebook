# Paper2Notebook API Gateway

A FastAPI gateway service that routes requests between the frontend and backend services.

## Quick Start

### 1. Create Virtual Environment

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and configure service URLs:

```
BACKEND_URL=http://localhost:8000
STORYBOOK_GENERATOR_URL=http://localhost:8001
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
```

### 4. Run the Server

```bash
uvicorn main:app --reload --port 3001
```

The service will start on `http://localhost:3001`

## Using with Docker

```bash
# From project root
docker-compose up api
```

The API gateway will be available at `http://localhost:3001`

## What It Does

1. Routes frontend requests to the appropriate backend services
2. Handles paper uploads and forwards to the backend
3. Proxies claims extraction with SSE streaming
4. Manages plan generation and execution requests
5. Routes storybook generation to the dedicated storybook service
6. Provides a unified API interface for the frontend

## API Endpoints

### Papers
```
GET  /papers                    # List all papers
GET  /papers/{id}              # Get paper details
POST /papers/                  # Upload paper
GET  /papers/{id}/extract      # Extract claims (SSE)
GET  /papers/{id}/claims       # Get extracted claims
```

### Plans
```
POST /papers/{id}/plan         # Generate plan
GET  /papers/{id}/plans        # List plans for paper
GET  /papers/{id}/plans/{plan_id}  # Get specific plan
GET  /plans/{plan_id}/materialize  # Generate notebook
GET  /plans/{plan_id}/download-urls # Get signed URLs
GET  /plans/{plan_id}/run      # Execute notebook
```

### Execution
```
GET /runs/{run_id}/events      # Stream execution events (SSE)
```

### Storybook
```
POST /explain/kid              # Generate storybook
POST /explain/kid/{id}/refresh # Update storybook with results
```

## Tech Stack

- **FastAPI** for REST API
- **httpx** for service-to-service communication
- **Supabase** for database queries
- **Server-Sent Events** for streaming
