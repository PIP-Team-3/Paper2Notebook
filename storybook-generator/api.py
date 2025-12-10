"""
Lightweight FastAPI service for Storybook Generation.

This service is independent from the main backend API and handles
all storybook generation logic.
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from pipeline import run_pipeline_and_return_storybook
from schemas import StoryboardGenerateRequest, StoryboardGenerateResponse

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Storybook Generator API...")

    # Validate required environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
    else:
        logger.info("All required environment variables are set")

    yield

    # Shutdown
    logger.info("Shutting down Storybook Generator API...")


# Create FastAPI app
app = FastAPI(
    title="Storybook Generator API",
    description="Lightweight API for generating kid-friendly storybooks from research papers",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "storybook-generator",
    }


@app.post("/generate", response_model=StoryboardGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_storyboard(payload: StoryboardGenerateRequest) -> StoryboardGenerateResponse:
    """
    Generate a storyboard from a paper in Supabase storage.

    This endpoint:
    1. Downloads the PDF from Supabase storage
    2. Extracts claims and generates storybook JSON
    3. Optionally generates images
    4. Returns the storyboard data
    """
    try:
        logger.info(
            "Generating storyboard for internal_path=%s bucket=%s generate_images=%s",
            payload.internal_path,
            payload.bucket,
            payload.generate_images,
        )

        # Run the pipeline
        storyboard_data = run_pipeline_and_return_storybook(
            internal_path=payload.internal_path,
            bucket=payload.bucket,
            generate_images=payload.generate_images,
        )

        pages_count = len(storyboard_data.get("pages", []))

        logger.info(
            "Successfully generated storyboard with %d pages for internal_path=%s",
            pages_count,
            payload.internal_path,
        )

        return StoryboardGenerateResponse(
            storyboard_data=storyboard_data,
            pages_count=pages_count,
        )

    except Exception as exc:
        logger.error(
            "Failed to generate storyboard for internal_path=%s: %s",
            payload.internal_path,
            str(exc),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "STORYBOARD_GENERATION_FAILED",
                "message": f"Failed to generate storyboard: {str(exc)}",
            },
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
