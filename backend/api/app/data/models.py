from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, HttpUrl


class PaperCreate(BaseModel):
    id: str
    title: str
    source_url: Optional[HttpUrl] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None
    pdf_storage_path: str
    vector_store_id: str
    pdf_sha256: str
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Dataset upload fields (Phase A.5)
    dataset_storage_path: Optional[str] = None
    dataset_format: Optional[str] = None
    dataset_original_filename: Optional[str] = None

    model_config = {
        "extra": "ignore",
    }


class PaperRecord(PaperCreate):
    model_config = {
        "extra": "ignore",
    }


class ClaimCreate(BaseModel):
    """Model for creating a claim record in the database."""
    paper_id: str
    dataset_name: Optional[str] = None
    split: Optional[str] = None
    metric_name: str
    metric_value: float
    units: Optional[str] = None
    method_snippet: Optional[str] = None
    source_citation: str
    confidence: float = Field(ge=0.0, le=1.0)
    created_by: Optional[str] = None
    created_at: datetime

    # Phase 1: Dataset metadata fields (Sprint 1)
    dataset_format: Optional[str] = None       # "huggingface", "excel", "csv", "torchvision"
    target_column: Optional[str] = None        # "Win", "sentiment", "default"
    preprocessing_notes: Optional[str] = None  # Free text preprocessing hints
    dataset_url: Optional[str] = None          # Optional download URL (future)

    model_config = {
        "extra": "ignore",
    }


class ClaimRecord(ClaimCreate):
    """Model for a claim record from the database (includes id)."""
    id: str

    model_config = {
        "extra": "ignore",
    }


class StorageArtifact(BaseModel):
    bucket: str
    path: str
    signed_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class PlanCreate(BaseModel):
    id: str
    paper_id: str
    version: str
    plan_json: dict[str, Any]
    env_hash: Optional[str] = None
    budget_minutes: Optional[int] = None
    status: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Two-stage planner: verbose reasoning from Stage 1 (o3-mini)
    stage1_reasoning: Optional[str] = None

    model_config = {
        "extra": "ignore",
    }


class PlanRecord(PlanCreate):
    model_config = {
        "extra": "ignore",
    }


class RunCreate(BaseModel):
    id: str
    plan_id: str
    paper_id: str
    status: str
    env_hash: str
    seed: int = 42
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_sec: int | None = None
    error_code: str | None = None
    error_message: str | None = None

    model_config = {
        "extra": "ignore",
    }


class RunRecord(RunCreate):
    model_config = {
        "extra": "ignore",
    }


class RunEventCreate(BaseModel):
    id: str
    run_id: str
    ts: datetime
    type: str
    payload: dict[str, Any]

    model_config = {
        "extra": "ignore",
    }


class StoryboardCreate(BaseModel):
    id: str
    paper_id: str
    run_id: Optional[str] = None
    storyboard_json: dict[str, Any]
    storage_path: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "extra": "ignore",
    }


class StoryboardRecord(StoryboardCreate):
    model_config = {
        "extra": "ignore",
    }


class AssetCreate(BaseModel):
    id: str
    paper_id: Optional[str] = None
    run_id: Optional[str] = None
    plan_id: Optional[str] = None
    kind: str  # 'pdf', 'notebook', 'requirements', 'metrics', 'logs', 'events', 'storyboard'
    storage_path: str
    size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    created_at: datetime

    model_config = {
        "extra": "ignore",
    }


class AssetRecord(AssetCreate):
    model_config = {
        "extra": "ignore",
    }


__all__ = [
    "PaperCreate",
    "PaperRecord",
    "PlanCreate",
    "PlanRecord",
    "RunCreate",
    "RunRecord",
    "RunEventCreate",
    "StorageArtifact",
    "StoryboardCreate",
    "StoryboardRecord",
    "AssetCreate",
    "AssetRecord",
]
