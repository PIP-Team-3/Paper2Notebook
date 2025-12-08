"""
Kid-Mode Explanation Router.

POST /api/v1/explain/kid - Create storyboard
POST /api/v1/explain/kid/{storyboard_id}/refresh - Update final page after run
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from .. import dependencies
from ..data.models import StoryboardCreate
from ..data.supabase import SupabaseDatabase, SupabaseStorage
from ..schemas.storybook import (
    Scoreboard,
    Storyboard,
    StoryboardCreateRequest,
    StoryboardCreateResponse,
    StoryboardRefreshResponse,
)
from ..services import explain_kid, reports

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/explain", tags=["explain"])

# Typed errors
E_STORY_MISSING_ALT_TEXT = "E_STORY_MISSING_ALT_TEXT"
E_STORY_TOO_FEW_PAGES = "E_STORY_TOO_FEW_PAGES"
E_STORY_NO_RUN = "E_STORY_NO_RUN"
E_STORY_UPDATE_NOT_POSSIBLE = "E_STORY_UPDATE_NOT_POSSIBLE"
E_STORY_NOT_FOUND = "E_STORY_NOT_FOUND"
E_PAPER_NOT_FOUND = "E_PAPER_NOT_FOUND"


@router.post("/kid", response_model=StoryboardCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_kid_storyboard(
    payload: StoryboardCreateRequest,
    db: SupabaseDatabase = Depends(dependencies.get_supabase_db),
    storage: SupabaseStorage = Depends(dependencies.get_supabase_storage),
) -> StoryboardCreateResponse:
    """
    TEMP STUB IMPLEMENTATION

    For local development / integration testing:
    - Call the kid storyboard generator (currently a stub in explain_kid.py)
    - Do NOT write anything to Supabase DB or storage
    - Just return a synthetic StoryboardCreateResponse so the frontend
      can exercise the full request flow without errors.
    """
    paper_id = payload.paper_id

    # Try to look up the paper title if the DB is working, but don't fail if it isn't.
    paper_title = "Untitled Paper"
    try:
        paper = db.get_paper(paper_id)
        if paper and getattr(paper, "title", None):
            paper_title = paper.title
    except Exception:
        # If Supabase isn't configured locally, just fall back to a stub title.
        paper_title = "Untitled Paper (local stub)"

    # Simple plan summary stub; your real pipeline can replace this later.
    plan_summary = f"We're testing the claims from this paper: {paper_title}"

    # Call the (now stubbed) kid-mode storyboard generator
    storyboard_data = await explain_kid.generate_storyboard(
        paper_id=paper_id,
        paper_title=paper_title,
        plan_summary=plan_summary,
    )

    # Instead of saving to DB / storage, just fabricate IDs and timestamps.
    storyboard_id = f"story-{uuid.uuid4()}"
    now = datetime.now(timezone.utc)

    pages_count = len(storyboard_data.get("pages", []))

    logger.info(
        "storyboard.stub_created id=%s paper_id=%s pages=%d",
        storyboard_id,
        paper_id,
        pages_count,
    )

    # No storage backing in this stub, so signed_url is empty and expires_at is now.
    return StoryboardCreateResponse(
        storyboard_id=storyboard_id,
        paper_id=paper_id,
        pages_count=pages_count,
        signed_url="",
        expires_at=now.isoformat(),
    )


@router.post("/kid/{storyboard_id}/refresh", response_model=StoryboardRefreshResponse)
async def refresh_storyboard_with_results(
    storyboard_id: str,
    db: SupabaseDatabase = Depends(dependencies.get_supabase_db),
    storage: SupabaseStorage = Depends(dependencies.get_supabase_storage),
) -> StoryboardRefreshResponse:
    """
    Update the final page of a storyboard with actual run results.

    - Fetches latest successful run for the paper
    - Computes gap between claimed and observed
    - Updates final page with scoreboard
    """
    # Fetch storyboard
    storyboard_record = db.get_storyboard(storyboard_id)
    if not storyboard_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": E_STORY_NOT_FOUND, "message": f"Storyboard {storyboard_id} not found"},
        )

    paper_id = storyboard_record.paper_id

    # Find latest successful run
    runs = db.get_runs_by_paper(paper_id)
    successful_runs = [r for r in runs if r.status == "succeeded" and r.completed_at]
    if not successful_runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": E_STORY_NO_RUN, "message": f"No successful runs found for paper {paper_id}"},
        )

    # Sort by created_at descending, pick latest
    successful_runs.sort(key=lambda r: r.created_at, reverse=True)
    latest_run = successful_runs[0]

    # Get the plan to know what metric we're tracking
    plan = db.get_plan(latest_run.plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": E_STORY_UPDATE_NOT_POSSIBLE, "message": "Plan not found for run"},
        )

    # Compute gap using reports service
    try:
        gap_data = await reports.compute_reproduction_gap(
            run_id=latest_run.id,
            plan_json=plan.plan_json,
            storage=storage,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": E_STORY_UPDATE_NOT_POSSIBLE, "message": str(exc)},
        )

    # Update storyboard JSON with scoreboard
    updated_json = explain_kid.update_final_page_with_scoreboard(
        storyboard_json=storyboard_record.storyboard_json,
        metric_name=gap_data["metric_name"],
        claimed_value=gap_data["claimed"],
        observed_value=gap_data["observed"],
        gap_percent=gap_data["gap_percent"],
    )

    # Update database record
    db.update_storyboard(
        storyboard_id=storyboard_id,
        run_id=latest_run.id,
        storyboard_json=updated_json,
    )

    # Update storage
    storage_key = f"storyboards/{storyboard_id}.json"
    import json

    storage.store_text(storage_key, json.dumps(updated_json, indent=2), "application/json")

    # Generate fresh signed URL
    signed_artifact = storage.create_signed_url(storage_key, expires_in=3600)

    scoreboard = Scoreboard(
        metric_name=gap_data["metric_name"],
        claimed_value=gap_data["claimed"],
        observed_value=gap_data["observed"],
        gap_percent=gap_data["gap_percent"],
    )

    logger.info(
        "storyboard.refreshed id=%s run_id=%s gap=%.2f%%",
        storyboard_id,
        latest_run.id,
        gap_data["gap_percent"],
    )

    return StoryboardRefreshResponse(
        storyboard_id=storyboard_id,
        run_id=latest_run.id,
        scoreboard=scoreboard,
        signed_url=signed_artifact.signed_url or "",
    )
