# Paper2Notebook Frontend

Transform research papers into interactive Jupyter notebooks using AI-powered analysis.

## Prerequisites

Before starting the frontend, ensure the backend REST API is running. See the [backend repository](https://github.com/PIP-Team-3/BackendAPI) for setup instructions.

## Quick Start

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env` and configure the API endpoint:

```bash
cp .env.example .env
```

Then edit `.env` and set the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Make sure the backend REST API is running before starting the frontend.

3. **Start the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Landing Page** - Hero, features showcase, how-it-works, modules
- **Dashboard** - Responsive layout with desktop sidebar + mobile bottom drawer
- **Papers Management** - Grid view, upload dialog, status indicators, dynamic details page
- **Responsive Design** - Mobile-first, adapts to all screen sizes

## Tech Stack

- **Next.js 16** with React 19 & TypeScript
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Headless component primitives
- **Zod** - Schema validation
- **Biome** - Linting & formatting

## Team & Contributions
- **Justin**: Built website base
- **Daewoong**: Built individual paper fetch functionality
- **Jake**: Built paper upload functionality
- **Ray**: Built dashboard homepage

## npm Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run linter
npm run format   # Auto-format code
```

## Mock Data
Currently, the app uses a mix of mocked and live data. Data is fetched from the backend and properties are added as the backend is still being developed. 
