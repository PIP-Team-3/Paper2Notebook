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
def init_client(api_key: str = None):
    if api_key is None:
        api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    return OpenAI(api_key=api_key)


# --------------------------------------------------------
# Build the world-style prefix for consistent art
# --------------------------------------------------------
def build_world_prefix(storybook_data):
    """
    Creates a prefix describing the story world's style guide:
    - Main character appearance
    - World theme
    - Recurring symbolic elements
    - Visual style & color palette
    """

    guide = storybook_data["world_guide"]

    main_char = guide.get("main_character_description", "")
    world_theme = guide.get("world_theme", "")
    recurring = guide.get("recurring_elements", [])
    visual_style = guide.get("visual_style", "")

    recurring_block = "\n".join([f"- {item}" for item in recurring])

    prefix = f"""
You are illustrating a children's storybook page in the same consistent world.

WORLD STYLE GUIDE
-----------------
Main character (always consistent):
{main_char}

World theme:
{world_theme}

Recurring symbolic elements (keep consistent, but may appear in different forms or scenes):
{recurring_block}

Overall visual style:
{visual_style}

GLOBAL RULES:
- Soft, bright, kid-friendly art.
- Same protagonist proportions, hair, clothes, and colors across all pages.
- No words, letters, or text inside the image.
- Avoid repeating backgrounds; each page must be a new scene, location, or moment in the journey.
"""

    return prefix


# --------------------------------------------------------
# Generate ONE image from GPT-Image-1
# --------------------------------------------------------
def generate_image(client: OpenAI,
                   prompt: str,
                   model: str = "gpt-image-1",
                   size: str = "auto",
                   output_format: str = "jpeg",
                   quality: str = None,
                   output_compression: int = None):

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

    print(f"\n✨ Generating image…\nPrompt (first 120 chars): {prompt[:120]}...\n")

    result = client.images.generate(**kwargs)
    b64_data = result.data[0].b64_json

    image_bytes = base64.b64decode(b64_data)
    image = Image.open(BytesIO(image_bytes))

    return image, b64_data


# --------------------------------------------------------
# Save image to disk
# --------------------------------------------------------
def save_image(image: Image.Image, path: str, resize_to: tuple = None, quality: int = 90):
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
        size: str = "auto"):

    client = init_client()

    # Load storybook JSON
    with open(storybook_path, "r") as f:
        data = json.load(f)

    pages = data["story"]["pages"]

    os.makedirs(output_dir, exist_ok=True)

    results = []

    for page in pages:
        page_id = page["id"]

        full_prompt = (
                "You are illustrating a children's educational storybook page.\n"
                "Follow the scene description carefully.\n"
                "You may include short labels or text if they help understanding.\n"
                "NO long paragraphs. NO dense text.\n"
                "Soft, bright children's illustration style.\n"
                "Scene to illustrate:\n"
                + page["visual_prompt"]
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

        results.append({
            "page_id": page_id,
            "filename": filename,
            "filepath": filepath,
            "prompt": full_prompt,
            "b64": b64data
        })

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

    print("\nFinished generating all images!")
    print(f"Generated {len(generated)} images.")
