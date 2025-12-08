"""
Kid-Mode Storybook Service.

Generates grade-3 reading level storyboards with required alt-text.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from ..config.llm import agent_defaults, get_client, traced_run
from ..schemas.storybook import GlossaryEntry, Scoreboard, StoryPage

from pathlib import Path
import sys

# Make the project root importable so we can reach storybookGenerator
BACKEND_DIR = Path(__file__).resolve().parents[3]  # .../Paper2Notebook/backend
ROOT_DIR = BACKEND_DIR.parent                      # .../Paper2Notebook
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from storybookGenerator.pipeline import run_pipeline_and_return_storybook


logger = logging.getLogger(__name__)

KID_MODE_SYSTEM_PROMPT = """You are a friendly science storyteller for kids (grade 3 reading level).

Your job is to explain a research paper and a reproduction experiment in simple words that an 8-year-old can understand.

Rules:
- Use short sentences (max 15 words)
- Use simple, everyday words
- Explain science concepts with comparisons to familiar things
- Be encouraging and positive
- ALWAYS include alt-text (visual description) for every page
- Create 5-7 pages total
- Include a glossary for any tricky words

Page structure:
1. Title page - What the paper is about
2-3. Background pages - Why this matters (use everyday examples)
4-5. Experiment pages - What the scientists did and what we tried
6. Results page - What happened (will be updated with actual results later)
7. (Optional) What's next page

For each page, provide:
- page_number: (1, 2, 3...)
- title: Short, fun title
- body: 2-4 short sentences explaining one idea
- alt_text: Describe what a picture would show (required!)
- visual_hint: What kind of picture would help (optional)

Return valid JSON with this structure:
{
  "pages": [...],
  "glossary": [{"term": "...", "definition": "..."}]
}
"""


def _extract_json_from_response(text: str) -> Dict[str, Any]:
    """Extract JSON from response, handling markdown code blocks."""
    text = text.strip()

    # Remove markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```)
        lines = lines[1:]
        # Remove last line if it's ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    return json.loads(text)


async def generate_storyboard(
    paper_id: str,
    paper_title: str,
    plan_summary: str,
) -> Dict[str, Any]:
    """
    Call the storybookGenerator pipeline for this paper.

    For now we use a hard-coded Supabase internal_path for the PDF.
    Later, we can look this up from the paper record in the database
    using paper_id.
    """

    # TODO: REPLACE THIS with the real internal path for the current paper.
    # This should be the path INSIDE the "papers" bucket, exactly like you
    # would pass to pipeline.py when running it by hand.
    internal_path = "papers/dev/2025/12/02/68918c14-2e0d-49e2-b174-f61fa6fa84b4.pdf"


    logger.info(
        "kid.storyboard.pipeline_start paper_id=%s internal_path=%s",
        paper_id,
        internal_path,
    )

    # Run your full pipeline and get the storybook JSON as a dict.
    # For now, we keep generate_images=False so this just creates JSON;
    # you can flip it to True once you’re ready to also generate images here.
    storyboard_data = run_pipeline_and_return_storybook(
        internal_path=internal_path,
        generate_images=True,
    )

    logger.info(
        "kid.storyboard.pipeline_done paper_id=%s pages=%d",
        paper_id,
        len(storyboard_data.get("pages", [])),
    )

    return storyboard_data

