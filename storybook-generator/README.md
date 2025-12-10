# Storybook Generator Service

A standalone FastAPI service that generates kid-friendly storybooks from research papers.

## Quick Start

### 1. Create Virtual Environment

```bash
cd storybook-generator
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

Edit `.env` and add your credentials:

```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### 4. Run the Server

```bash
python api.py
```

The service will start on `http://localhost:8001`

## API Endpoints

### Health Check
```
GET http://localhost:8001/health
```

### Generate Storybook
```
POST http://localhost:8001/generate
Content-Type: application/json

{
  "internal_path": "papers/dev/2025/12/02/example.pdf",
  "bucket": "papers",
  "generate_images": true
}
```

## Using with Docker

```bash
# From project root
docker-compose up storybook-generator
```

## What It Does

1. Downloads a PDF from Supabase storage
2. Extracts scientific claims using GPT
3. Generates a kid-friendly storybook in JSON format
4. Optionally creates images for each page