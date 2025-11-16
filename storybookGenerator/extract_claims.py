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

PDF_PATH = "test_paper.pdf"   # change if needed


# -------------------------------
# Helper: extract text/JSON from Responses API
# -------------------------------
def extract_text_from_response(resp):
    """
    Tries to extract the main text/JSON content from a Responses API response.
    Returns a string (which should be JSON in our prompts).
    """
    # Newer format: output is a list of blocks
    for block in resp.output:
        if block.type == "message":
            # message.content is a list (e.g. output_text, output_json)
            for item in block.content:
                if item.type == "output_text":
                    return item.text
                if item.type == "output_json":
                    # Convert dict → string JSON
                    return json.dumps(item.json)
        elif block.type == "output_text":
            return block.text
        elif block.type == "output_json":
            return json.dumps(block.json)

    # Fallback: nothing found
    return ""


# -------------------------------
# 1. Create vector store + upload PDF
# -------------------------------
print("Creating vector store...")
vector_store = client.vector_stores.create(name="p2n_store")
store_id = vector_store.id
print("Vector Store ID:", store_id)

print("Uploading PDF into vector store...")
file_upload = client.vector_stores.files.upload(
    vector_store_id=store_id,
    file=open(PDF_PATH, "rb")
)
print("Uploaded File ID:", file_upload.id)

# Let OpenAI index the file
time.sleep(3)


# -------------------------------
# 2. Extract scientific claims (GPT-5 → JSON)
# -------------------------------
print("Extracting scientific claims with GPT-5...")

claims_response = client.responses.create(
    model="gpt-5",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": """
Read the attached PDF using file_search and extract:

1. The main problem.
2. The proposed method.
3. 3–7 key scientific claims.
4. Evidence for each claim.
5. Key terms and meanings.
6. A simple 5th-grader summary.
7. Visual metaphors for each claim.

Return VALID JSON ONLY.
"""
                },
                {
                    "type": "input_file",
                    "file_id": file_upload.id
                }
            ]
        }
    ],
    tools=[{
        "type": "file_search",
        "vector_store_ids": [store_id]
    }]
)

raw_claims_text = extract_text_from_response(claims_response)

print("\n--- RAW CLAIMS JSON TEXT ---\n")
print(raw_claims_text)

# Parse claims JSON
claims_data = json.loads(raw_claims_text)


# -------------------------------
# 3. Convert claims → Hero’s Journey story pages (GPT-5)
# -------------------------------
print("\nGenerating Hero’s Journey Storybook with GPT-5...")

# Build the prompt as a plain string, then append JSON
story_prompt = story_prompt = story_prompt = """
You are an expert children’s educational storyteller and illustrator.  
Your job is to transform a scientific research paper into a clear, consistent,
kid-friendly storybook that still faithfully teaches the main ideas.

You will output a JSON storybook with multiple pages.

────────────────────────────────────────────────────────────
🎨 GENERAL STYLE & WORLD CONSISTENCY
────────────────────────────────────────────────────────────
• The story should take place in ONE consistent story world.
• Use ONE main child-friendly protagonist (the model can choose them).
• Include ONE friendly helper character (robot, creature, etc.) ONLY if useful.
• Do NOT create multiple metaphor worlds.
• The world should look like a playful workshop, lab, garden, or adventure area
  — but choose just ONE theme and stay with it all story long.
• Everything in the visuals must match the rules of this world.
• You MAY include short labels or words (2–3 words max) in illustrations.
  These must be harmless (e.g., “reader tool”, “frozen words”, “learns”, etc.).
• Avoid technical labels (no formulas, no diagrams, no heavy ML terms).
• Avoid dataset names, benchmarks, or acronyms entirely in text.
• Keep the tone imaginative, warm, and curious.

────────────────────────────────────────────────────────────
📘 STORY STRUCTURE (Hero’s Journey lite)
────────────────────────────────────────────────────────────
Create a 6–10 page story following this flow:

1. **Problem** – What challenge or question the paper is trying to solve.
2. **Idea** – The core insight or tool the authors propose.
3. **Method** – How the method works (use a metaphor the model chooses).
4. **Exploration** – How adjusting parts or trying variants changes the results.
5. **Result** – What the experiments show broadly, WITHOUT numbers or acronyms.
6. **Ending / Lesson** – What the big takeaway is.

Each page must:
• Have a consistent protagonist
• Use recurring visual objects chosen by the model (e.g., a toolbox, lenses, tiles)
• Avoid introducing new metaphors late in the story

────────────────────────────────────────────────────────────
📸 IMAGE GENERATION RULES
────────────────────────────────────────────────────────────
Every “visual_prompt” must:
• Describe the scene in soft, imaginative picture-book language.
• Include consistent character design (same hair, clothes, robot style, etc.).
• Avoid technical charts, numerical tables, dataset names, or engineering diagrams.
• Use only short friendly labels (“learns”, “frozen”, “reader tool”, “strong clue”).
• Avoid referencing specific ML layers, equations, datasets.
• Focus on metaphors (lights, tiles, shoes, tools, ribbons, trails, etc.).

────────────────────────────────────────────────────────────
📦 OUTPUT JSON FORMAT
────────────────────────────────────────────────────────────
Output ONLY valid JSON with:

{
  "story": {
    "pages": [
      {
        "id": number,
        "stage": "problem | idea | method | exploration | result | ending",
        "title": "short playful title",
        "caption": "1–2 sentences explaining the concept simply for a child",
        "visual_prompt": "storybook-safe image description (no long text)",
        "related_claim": the claim/topic this page explains
      }
    ]
  }
}

────────────────────────────────────────────────────────────
📄 CONTENT TO TRANSFORM
────────────────────────────────────────────────────────────
Here is the extracted scientific data:

{{INSERT_CLAIMS_JSON_HERE}}

(Do not repeat this data; integrate it into the story.)

"""



story_prompt = story_prompt + "\n" + json.dumps(claims_data, indent=2)

storybook_response = client.responses.create(
    model="gpt-5",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": story_prompt
                }
            ]
        }
    ]
)

storybook_raw = extract_text_from_response(storybook_response)


# -------------------------------
# 4. Clean, validate, and save final storybook JSON
# -------------------------------
print("\n\n--- STORYBOOK RAW OUTPUT ---\n")
print(storybook_raw)

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
