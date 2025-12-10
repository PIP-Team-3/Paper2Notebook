# Paper2Notebook Frontend

A Next.js web application that transforms research papers into interactive Jupyter notebooks using AI.

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and configure the API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using with Docker

```bash
# From project root
docker-compose up frontend
```

The frontend will be available at `http://localhost:3000`

## Key Features

- **Paper Upload** - Upload research papers and track processing status
- **Claims Extraction** - AI-powered extraction of scientific claims
- **Plan Generation** - Create reproduction plans from extracted claims
- **Test Execution** - Run generated Jupyter notebooks
- **Storybook Mode** - Kid-friendly explanations of research papers
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Next.js 15** with React 19 Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Zod** for schema validation

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Run production server
npm run lint     # Check code quality
npm run format   # Auto-format code
``` 
