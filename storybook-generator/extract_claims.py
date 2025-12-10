from openai import OpenAI
from dotenv import load_dotenv
import os
import time
import json
import re

# -------------------------------
# Setup
# -------------------------------
load_dotenv()
client = OpenAI()

PDF_PATH = "test_paper.pdf"   # change to your paper path


# -------------------------------
# Helper: extract text/JSON from Responses API
# -------------------------------
def extract_text_from_response(resp):
    """
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


if __name__ == "__main__":
    # -------------------------------
    # 1. Create vector store + upload PDF
    # -------------------------------
    print("Creating vector store...")
    vector_store = client.vector_stores.create(name="p2n_store")
    store_id = vector_store.id
    print("Vector Store ID:", store_id)

    print("Uploading PDF into vector store...")
    with open(PDF_PATH, "rb") as f:
        file_upload = client.vector_stores.files.upload(
            vector_store_id=store_id,
            file=f
        )
    print("Uploaded File ID:", file_upload.id)

    # Give indexing a moment
    time.sleep(3)

    # -------------------------------
    # 2. Extract a simple structured summary of the paper
    # -------------------------------
    print("Extracting scientific summary with GPT-5...")

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

    claims_response = client.responses.create(
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

    print("\n--- RAW CLAIMS JSON TEXT ---\n")
    print(raw_claims_text)

    claims_data = json.loads(raw_claims_text)

    # -------------------------------
    # 3. Generate a SIMPLE, RESULT-ORIENTED storybook
    # -------------------------------
    print("\nGenerating Storybook with GPT-5 (minimal, result-oriented)...")

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

    storybook_response = client.responses.create(
        model="gpt-5",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": storybook_prompt}
                ],
            }
        ],
    )

    storybook_raw = extract_text_from_response(storybook_response)

    print("\n\n--- STORYBOOK RAW OUTPUT ---\n")
    print(storybook_raw)

    # -------------------------------
    # 4. Clean, validate, and save final storybook JSON
    # -------------------------------
    parsed = None
    try:
        parsed = json.loads(storybook_raw)
        print("\n--- STORYBOOK JSON (Parsed Successfully) ---\n")
        print(json.dumps(parsed, indent=2))
    except json.JSONDecodeError:
        print("\n[WARNING] GPT-5 output was not valid JSON on first try. Attempting auto-fix...")

        # Try to extract the largest {...} block
        json_match = re.search(r"\{(.|\n)*\}", storybook_raw)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                print("\n--- STORYBOOK JSON (Auto-fixed) ---\n")
                print(json.dumps(parsed, indent=2))
            except Exception as e:
                print("\n[ERROR] Auto-fixed JSON still invalid:", e)
        else:
            print("\n[ERROR] Could not find any JSON object in the output.")

    if parsed:
        with open("storybook.json", "w") as f:
            json.dump(parsed, f, indent=2)
        print("\nSaved 'storybook.json' successfully!")
    else:
        print("\nDid NOT save JSON due to errors.")
