import os
import json
import base64
from io import BytesIO
from PIL import Image
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


# --------------------------------------------------------
# Initialize the OpenAI client
# --------------------------------------------------------
def init_client(api_key: str = None) -> OpenAI:
    if api_key is None:
        api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    return OpenAI(api_key=api_key)


# --------------------------------------------------------
# Build a world-style prefix from storybook["world"]
# --------------------------------------------------------
def build_world_prefix(world: dict) -> str:
    """
    Build a world-level style guide prompt from the storybook["world"] section.

    Expected world format (from new extract_claims.py):

    {
      "setting": "1–3 sentences...",
      "characters": [
        {
          "id": "side_a" | "side_b" | "guide",
          "name": "in-world name (e.g., 'Team Star')",
          "role": "link to scientific side / explanation",
          "appearance": "paragraph describing species/type, body shape, colors, clothing, symbol, etc.",
          "emotional_style": "1–2 sentences about typical emotions/behavior."
        },
        ...
      ],
      "style_rules": [
        "soft watercolor...",
        "No text labels...",
        ...
      ]
    }
    """

    characters = world.get("characters", [])
    setting = world.get("setting", "")
    style_rules = world.get("style_rules", [])

    # Describe characters nicely
    char_lines = []
    for ch in characters:
        cid = ch.get("id", "unknown")
        name = ch.get("name", "Unnamed character")
        role = ch.get("role", "character")
        appearance_text = ch.get("appearance", "")
        emotional = ch.get("emotional_style", "")

        char_desc = f"{name} ({cid}) — {role}. Appearance: {appearance_text}"
        if emotional:
            char_desc += f" Emotional style: {emotional}"
        char_lines.append(f"- {char_desc}")

    # Style rules
    style_rules_str = "\n- ".join(style_rules) if style_rules else ""

    prefix = f"""
You are illustrating a children's storybook set in a single, consistent world.

WORLD STYLE GUIDE
-----------------
Main characters (they MUST look the SAME on every page):
{chr(10).join(char_lines)}

Setting:
- {setting}

Visual style rules:
- {style_rules_str}

GLOBAL CONSISTENCY RULES (VERY IMPORTANT):
- Always draw the SAME versions of each character on every page
  (same species, body shape, colors, proportions, clothes/accessories, and overall look).
- Use ONLY the characters defined above. Do NOT invent new characters or crowds.
- Soft, bright, kid-friendly picture-book style.
- Absolutely NO words, letters, labels, or text anywhere inside the image
  (no captions, no signs with writing).
"""
    return prefix.strip() + "\n"

# --------------------------------------------------------
# Generate ONE image from GPT-Image-1
# --------------------------------------------------------
def generate_image(
    client: OpenAI,
    prompt: str,
    model: str = "gpt-image-1",
    size: str = "auto",
    output_format: str = "jpeg",
    quality: str = None,
    output_compression: int = None,
):
    kwargs = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "output_format": output_format,
    }

    if quality:
        kwargs["quality"] = quality
    if output_compression:
        kwargs["output_compression"] = output_compression

    print(f"\n✨ Generating image…\nPrompt (first 200 chars):\n{prompt[:200]}...\n")

    result = client.images.generate(**kwargs)
    b64_data = result.data[0].b64_json

    image_bytes = base64.b64decode(b64_data)
    image = Image.open(BytesIO(image_bytes))

    return image, b64_data


# --------------------------------------------------------
# Save image to disk
# --------------------------------------------------------
def save_image(
    image: Image.Image, path: str, resize_to: tuple = None, quality: int = 90
):
    if resize_to:
        image = image.resize(resize_to, Image.LANCZOS)

    ext = os.path.splitext(path)[1].lower()
    fmt = "PNG" if ext == ".png" else "JPEG"

    image.save(path, format=fmt, quality=quality, optimize=True)


# --------------------------------------------------------
# Generate ALL images in storybook.json
# --------------------------------------------------------
def generate_images_from_storybook(
    storybook_path: str = "storybook.json",
    output_dir: str = "storybook_images",
    size: str = "auto",
    page_ids=None,
):
    client = init_client()

    # Load storybook JSON ONCE
    with open(storybook_path, "r") as f:
        data = json.load(f)

    # Support both formats:
    # 1) { "storybook": { "world": ..., "pages": ... } }
    # 2) { "world": ..., "pages": ... }
    if "storybook" in data:
        story = data["storybook"]
    else:
        story = data  # assume world/pages are at top level

    world = story["world"]
    pages = story["pages"]

    # 🔍 If page_ids is provided, keep only those pages
    if page_ids is not None:
        pages = [p for p in pages if p.get("id") in page_ids]

    os.makedirs(output_dir, exist_ok=True)

    # Build world-level style guide used for EVERY page
    world_prefix = build_world_prefix(world)

    results = []

    for page in pages:
        page_id = page["id"]

        caption = page.get("caption", "")
        visual_prompt = page.get("visual_prompt", "")

        full_prompt = (
            world_prefix
            + f"\nNow illustrate page {page_id} of this story.\n"
            + "The following caption describes the story moment for context. "
            + "Do NOT write this text in the image:\n"
            + f"\"{caption}\"\n\n"
            + "Scene to illustrate (focus on visuals, emotions, and body language):\n"
            + visual_prompt
        )

        filename = f"page_{page_id}.jpg"
        filepath = os.path.join(output_dir, filename)

        image, b64data = generate_image(
            client,
            prompt=full_prompt,
            size=size,
            output_format="jpeg",
        )

        save_image(image, filepath)
        print(f"📘 Saved → {filepath}")

        results.append(
            {
                "page_id": page_id,
                "filename": filename,
                "filepath": filepath,
                "prompt": full_prompt,
                "b64": b64data,
            }
        )

    return results


# --------------------------------------------------------
# Example usage
# --------------------------------------------------------
if __name__ == "__main__":
    generated = generate_images_from_storybook(
        storybook_path="storybook.json",
        output_dir="storybook_images",
        size="1536x1024"
    )

    print("\nFinished generating selected images!")
    print(f"Generated {len(generated)} images.")
