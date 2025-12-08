"""
End-to-end pipeline for Kid-Mode Storybook.

Steps:
1) Download PDF from Supabase storage
2) Extract scientific claims + build storybook.json with GPT
3) Generate storybook images from storybook.json
"""

from __future__ import annotations

import os
import time
import json
import re
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client
from openai import OpenAI

import json
from pathlib import Path

# ---------------------------------------------------------------------
# ENV + GLOBAL CLIENTS
# ---------------------------------------------------------------------

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
text_client = OpenAI(api_key=OPENAI_API_KEY)


# ---------------------------------------------------------------------
# 1) DOWNLOAD PDF FROM SUPABASE
# ---------------------------------------------------------------------

def download_pdf_from_supabase(
    internal_path: str,
    bucket: str = "papers",
    output_file: str = "test_paper.pdf",
) -> str:
    """
    Download a single PDF from the Supabase storage bucket.

    internal_path: the path INSIDE the bucket (what Supabase calls "path").
                  e.g. "dev/2025/12/02/abc123.pdf"
    bucket:       storage bucket name (default "papers")
    output_file:  local filename to save to
    """
    print(f"\n[1/3] Downloading PDF from Supabase…")
    print(f"  bucket={bucket}")
    print(f"  internal_path={internal_path}")

    file_bytes = supabase.storage.from_(bucket).download(internal_path)

    with open(output_file, "wb") as f:
        f.write(file_bytes)

    print(f"  ✔ Saved to {output_file}")
    return output_file


# ---------------------------------------------------------------------
# 2) EXTRACT CLAIMS + BUILD STORYBOOK.JSON (TEXT LLM PIPELINE)
# ---------------------------------------------------------------------

def extract_text_from_response(resp) -> str:
    """
    Helper copied from extract_claims.py:
    Tries to extract the main text/JSON content from a Responses API response.
    Returns a string (which should be JSON in our prompts).
    """
    if not hasattr(resp, "output"):
        return ""

    for block in resp.output:
        if block.type == "message":
            for item in block.content:
                if item.type == "output_text":
                    return item.text
                if item.type == "output_json":
                    return json.dumps(item.json)
        elif block.type == "output_text":
            return block.text
        elif block.type == "output_json":
            return json.dumps(block.json)
    return ""


def build_storybook_json_from_pdf(
    pdf_path: str,
    storybook_path: str = "storybook.json",
) -> str:
    """
    Reimplements your extract_claims.py main block as a function:
    - creates a vector store
    - uploads the PDF
    - asks GPT for claims JSON
    - asks GPT again for a kid-mode storybook JSON
    - saves final JSON to storybook_path
    """

    print(f"\n[2/3] Creating vector store + extracting claims from {pdf_path}…")

    # 2.1 Vector store + upload
    vector_store = text_client.vector_stores.create(name="p2n_store")
    store_id = vector_store.id
    print(f"  Vector Store ID: {store_id}")

    with open(pdf_path, "rb") as f:
        file_upload = text_client.vector_stores.files.upload(
            vector_store_id=store_id,
            file=f,
        )
    print(f"  Uploaded File ID: {file_upload.id}")

    # give indexing a moment
    time.sleep(3)

    # 2.2 Claims JSON prompt (same as extract_claims.py)
    claims_prompt = """
You are a scientific explainer that outputs ONLY JSON.

Read the attached PDF (via file_search) and write a JSON object with this structure:

{
  "main_problem": "one sentence describing the main question or problem",
  "main_domain": "one or two words like 'soccer', 'psychology', 'neuroscience', 'machine learning', 'economics', etc.",
  "is_penalty_shootout_study": true,
  "method_summary": "2-4 simple sentences summarizing what the paper does to study the problem",
  "sides": {
    "side_a": {
      "technical_name": "name of the advantaged / new / first / treatment side if one exists (e.g., 'first penalty team', 'proposed CNN', 'treatment group'). If there is no advantaged side, describe the main side.",
      "simple_name": "2-6 word kid-friendly label (e.g., 'first team', 'new model')",
      "why_special": "1-2 sentences explaining why this side matters (goes first, new tool, different rule, etc.)"
    },
    "side_b": {
      "technical_name": "name of the comparison / baseline / control / second side if one exists. If not, say 'none'.",
      "simple_name": "2-6 word kid-friendly label or 'none'",
      "why_special": "1-2 sentences explaining how this side differs from side_a, or 'none' if not applicable."
    }
  },
  "outcome_variable": "short phrase for what is being measured or compared (e.g., 'goal success rate', 'classification accuracy')",
  "key_claims": [
    {
      "id": 1,
      "importance": "early | mid | late | overall",
      "claim": "one key scientific claim in 1 simple sentence",
      "evidence": "1-3 short sentences summarizing main evidence (numbers, graphs, qualitative patterns)",
      "effect_direction": "'side_a', 'side_b', 'no_difference', or 'mixed'",
      "kid_friendly": "1-2 very simple sentences explaining this claim to a 5th grader"
    }
  ],
  "kid_summary": "3-6 very simple sentences explaining to a 5th grader what the paper found and why it matters."
}

Rules:
- Set is_penalty_shootout_study = true ONLY if the paper is literally about soccer penalty shoot-outs or teams taking kicks at a goal.
- Fill every field.
- Use plain text, no LaTeX.
- Output ONLY this JSON object, no extra commentary.
"""

    claims_response = text_client.responses.create(
        model="gpt-5",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": claims_prompt},
                    {"type": "input_file", "file_id": file_upload.id},
                ],
            }
        ],
        tools=[{"type": "file_search", "vector_store_ids": [store_id]}],
    )

    raw_claims_text = extract_text_from_response(claims_response)
    claims_data = json.loads(raw_claims_text)

    # 2.3 Storybook JSON prompt (same one you used before)
    print("  Generating storybook JSON…")

    science_json = json.dumps(claims_data, indent=2)

    storybook_prompt = """
You are a children's science storyteller that outputs ONLY JSON.

You are given structured scientific information about a research paper
(the EXTRACTED_SCIENCE_INPUT will follow).

Your job is to create a VERY SIMPLE, VERY MINIMAL picture-book story that explains
the main results to a child.

ABSOLUTE PRIORITIES
-------------------
1. The story must be RESULT-ORIENTED:
   - Each page shows a single clear outcome or state (who scored, who missed, who has more, etc.).
   - Do NOT focus on process metaphors like jars, stepping stones, pedestals, levers, or complicated props.
   - Avoid abstract symbolic devices (no 'bridges of data', 'trees of evidence', etc.).

2. The story must be SIMPLE and DIRECT:
   - Use as FEW visual elements as possible to show the results.
   - Use at most ONE type of outcome object for the entire story
     (for example, glowing balls, identical tokens, or simple bars on a board).
   - Prefer literal scenes over metaphors.
     - If the study is literally about soccer penalty kicks, then show soccer players taking kicks at a goal and a simple scoreboard or piles of balls.
     - If the study is not about soccer, choose the simplest literal comparison you can:
       two characters and their results side by side.

3. The world and characters must be CONSISTENT:
   - Define how characters look ONCE in the world section.
   - On pages, do NOT change species, body shape, or main colors.
   - Do NOT introduce any new characters after page 1.

PAGE COUNT
----------
- Create between 6 and 8 pages inclusive (you choose, but keep it short).
- Page ids MUST be consecutive integers starting at 1.

WORLD SECTION (DEFINE SETTING + CHARACTERS ONCE)
------------------------------------------------
Create a world object with this structure:

{
  "setting": "1–3 sentences describing a simple, literal setting that fits the study. \
If is_penalty_shootout_study is true, this MUST be a plain soccer penalty field with a goal and a simple scoreboard.",
  "characters": [
    {
      "id": "side_a",
      "name": "short in-world name (e.g., 'First Kicker', 'New Model A')",
      "role": "link to sides.side_a.simple_name and technical role in kid-friendly language.",
      "appearance": "single paragraph describing species/type, body shape, main colors, very simple clothes/accessories. \
Keep it minimal and easy to imagine.",
      "emotional_style": "1–2 sentences about how this character usually feels/acts (calm, confident, sometimes nervous, etc.)."
    },
    {
      "id": "side_b",
      "name": "short in-world name, or 'None' if side_b.simple_name is 'none'",
      "role": "link to sides.side_b.simple_name and technical role in kid-friendly language, or 'no explicit second side'.",
      "appearance": "if there is a side_b character, describe it in one simple paragraph; if not, write 'none'.",
      "emotional_style": "if side_b exists, how they tend to feel/act; otherwise 'none'."
    },
    {
      "id": "guide",
      "name": "short in-world guide name (e.g., 'Referee', 'Professor')",
      "role": "teacher/referee/narrator that explains the results.",
      "appearance": "single paragraph describing the guide’s look in simple terms.",
      "emotional_style": "1–2 sentences about being calm, helpful, and clear."
    }
  ],
  "style_rules": [
    "Soft, simple picture-book style with gentle colors.",
    "No written WORDS or sentences inside the images.",
    "Simple numeric scoreboards (like '3–1') are allowed when needed.",
    "Do not introduce any new characters after page 1.",
    "The hero, comparison character (if any), and guide ALWAYS keep the same body shapes, species, and main colors on every page.",
    "Pick exactly ONE type of outcome object for this story (for example, soccer balls, glowing tokens, or bars on a board) and use it on all pages.",
    "Keep each scene very simple with only a few important objects.",
    "Scenes should show final results or clear current states, not complicated sequences of actions."
  ]
}

PAGES SECTION (RESULT-ORIENTED, MINIMAL)
----------------------------------------
Create between 6 and 8 page objects in an array called "pages". You decide how many pages (N) is best.

Each page object must have this shape:

{
  "id": 1,
  "title": "short title for this page",
  "caption": "2–3 kid-friendly sentences narrating what is happening and how it connects to the research result.",
  "visual_prompt": "Prompt for the illustrator. Describe ONE simple, static scene: where the characters are, what they are doing in that moment, \
how many outcome objects are visible, and what their emotions are. Focus on the result (for example, first side scored and second side missed, \
or one side clearly has more tokens).",
  "related_claim": "short reference to one or more key_claims or to the overall finding."
}

VERY IMPORTANT RULES FOR visual_prompt
--------------------------------------
- You MUST NOT re-define character appearance there. Do NOT talk in detail about species, body shapes, or main colors.
  Those are already fixed by the world.characters section.
- Refer to characters ONLY by their in-world names from world.characters.
- Do NOT introduce new characters (no extra animals, kids, crowds, etc.).
- Do NOT change species or shapes.
- Use the SAME type of outcome object on every page (for example, if you choose soccer balls, always use these balls; \
if you choose glowing tokens, always use those).
- Keep it as literal and straightforward as possible:
  - If the study is about penalty shootouts, show literal kicks, balls in or out of the goal, and simple scoreboards or piles of balls.
  - If the study is about something else, show literal comparisons (for example, two piles of tokens or two bars on a simple board).
- Each visual_prompt must describe a SINGLE static moment (like a photo), not a whole animation.

GLOBAL STORY GUIDELINES
-----------------------
- Start by introducing the main question in kid-friendly terms.
- Show how the two sides are compared in a very plain way.
- Show at least one page where side_a clearly does better (if effect_direction indicates that).
- If pressure or being behind matters in the data, you may show it using simple body language (nervous vs calm) \
and results (missed vs scored), but keep the visuals minimal.
- End with a clear, kid-friendly lesson that matches the paper’s main conclusion.

EXTRACTED_SCIENCE_INPUT:
""" + "\n" + science_json

    storybook_response = text_client.responses.create(
        model="gpt-5",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": storybook_prompt},
                ],
            }
        ],
    )

    storybook_raw = extract_text_from_response(storybook_response)

    # 2.4 Clean / parse and save
    parsed: Optional[dict] = None
    try:
        parsed = json.loads(storybook_raw)
    except json.JSONDecodeError:
        # try to salvage largest {...} block, same trick as extract_claims.py
        json_match = re.search(r"\{(.|\n)*\}", storybook_raw)
        if json_match:
            parsed = json.loads(json_match.group(0))

    if not parsed:
        raise ValueError("Could not parse storybook JSON from model output")

    with open(storybook_path, "w") as f:
        json.dump(parsed, f, indent=2)

    print(f"  ✔ Saved storybook JSON to {storybook_path}")
    return storybook_path


# ---------------------------------------------------------------------
# 3) GENERATE IMAGES FROM STORYBOOK.JSON
# ---------------------------------------------------------------------

def generate_storybook_images(
    storybook_path: str = "storybook.json",
    output_dir: str = "storybook_images",
    size: str = "1536x1024",
):
    """
    Thin wrapper around your existing generate_images_from_storybook().
    """
    # Lazy import so backend can start without Pillow when we don't generate images
    from .generate_storybook import generate_images_from_storybook

    print(f"\n[3/3] Generating storybook images from {storybook_path}…")
    results = generate_images_from_storybook(
        storybook_path=storybook_path,
        output_dir=output_dir,
        size=size,
    )
    print(f"  ✔ Generated {len(results)} images into '{output_dir}'")
    return results


# ---------------------------------------------------------------------
# MASTER PIPELINE
# ---------------------------------------------------------------------

def run_pipeline(
    internal_path: str,
    bucket: str = "papers",
    local_pdf: str = "test_paper.pdf",
    storybook_json: str = "storybook.json",
    image_dir: str = "storybook_images",
):
    """
    Full end-to-end run:
      Supabase -> PDF -> claims + storybook.json -> images
    """
    pdf_path = download_pdf_from_supabase(
        internal_path=internal_path,
        bucket=bucket,
        output_file=local_pdf,
    )

    storybook_path = build_storybook_json_from_pdf(
        pdf_path=pdf_path,
        storybook_path=storybook_json,
    )

    generate_storybook_images(
        storybook_path=storybook_path,
        output_dir=image_dir,
    )


def run_pipeline_and_return_storybook(
    internal_path: str,
    bucket: str = "papers",
    local_pdf: str = "test_paper.pdf",
    storybook_json: str = "storybook.json",
    image_dir: str = "storybook_images",
    generate_images: bool = False,
) -> dict:
    """
    High-level helper for the backend:

    1) Download PDF from Supabase
    2) Build storybook.json via LLM
    3) (optionally) generate images
    4) Return the parsed storybook JSON as a Python dict
    """
    pdf_path = download_pdf_from_supabase(
        internal_path=internal_path,
        bucket=bucket,
        output_file=local_pdf,
    )

    storybook_path = build_storybook_json_from_pdf(
        pdf_path=pdf_path,
        storybook_path=storybook_json,
    )

    if generate_images:
        generate_storybook_images(
            storybook_path=storybook_path,
            output_dir=image_dir,
        )

    with open(storybook_path, "r") as f:
        data = json.load(f)

    return data


if __name__ == "__main__":
    # Easiest: edit this string for now, or later parse from CLI args.
    # This should be the path INSIDE the "papers" bucket.
    INTERNAL_PATH = "dev/2025/12/02/4261ba15-c176-4c8d-a58e-a3e8fa451a30.pdf"

    run_pipeline(internal_path=INTERNAL_PATH)
