"""
Pydantic schemas for the Storybook Generator API.

These are independent from the backend schemas to avoid cross-imports.
"""

from pydantic import BaseModel, Field


class StoryboardGenerateRequest(BaseModel):
    """Request to generate a storyboard from a paper."""

    internal_path: str = Field(..., description="Internal path in Supabase storage bucket")
    bucket: str = Field(default="papers", description="Supabase storage bucket name")
    generate_images: bool = Field(default=False, description="Whether to generate images")


class StoryboardGenerateResponse(BaseModel):
    """Response containing the generated storyboard data."""

    storyboard_data: dict = Field(..., description="The generated storyboard JSON")
    pages_count: int = Field(..., description="Number of pages in the storyboard")
