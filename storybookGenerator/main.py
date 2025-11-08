import os
import base64
from io import BytesIO
from PIL import Image

from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()  # this loads your .env file automatically


def init_client(api_key: str = None):
    """
    Initialize the OpenAI client. If api_key is None, expects OPENAI_API_KEY env var.
    """
    if api_key is None:
        api_key = os.environ.get("OPENAI_API_KEY")
    if api_key is None:
        raise ValueError("Please provide an API key or set OPENAI_API_KEY environment variable")
    client = OpenAI(api_key=api_key)
    return client

def generate_image(client: OpenAI,
                   prompt: str,
                   model: str = "gpt-image-1",
                   size: str = "1024x1024",
                   quality: str = None,
                   output_format: str = "jpeg",
                   output_compression: int = None) -> Image.Image:
    """
    Generate an image given the prompt and return it as a PIL Image.
    Additional parameters: quality, compression, etc.
    """
    # Prepare kwargs for API call
    kwargs = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "output_format": output_format,
    }
    if quality is not None:
        kwargs["quality"] = quality
    if output_compression is not None:
        kwargs["output_compression"] = output_compression

    result = client.images.generate(**kwargs)
    # Assuming result.data[0].b64_json contains base64-encoded image
    image_b64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_b64)
    image = Image.open(BytesIO(image_bytes))
    return image

def save_image(image: Image.Image, path: str, resize_to: tuple = None, quality: int = 80):
    """
    Save the PIL Image to disk, optionally resizing and adjusting JPEG quality.
    """
    if resize_to:
        image = image.resize(resize_to, Image.LANCZOS)
    # Determine format from file extension
    ext = os.path.splitext(path)[1].lower()
    fmt = "PNG" if ext == ".png" else "JPEG"
    image.save(path, format=fmt, quality=quality, optimize=True)

def main():
    client = init_client()
    prompt = (
        "Render a realistic image of this character: "
        "Blobby Alien Character Spec Name: Glorptak (or nickname: \"Glorp\") "
        "Visual Appearance Body Shape: Amorphous and gelatinous. Overall silhouette resembles "
        "a teardrop or melting marshmallow, shifting slightly over time. Can squish and elongate when emotional or startled. "
        "Material Texture: Semi-translucent, bio-luminescent goo with a jelly-like wobble. Surface occasionally ripples when communicating or moving quickly. "
        "Color Palette: Base: Iridescent lavender or seafoam green. Accents: Subsurface glowing veins of neon pink, electric blue, or golden yellow. "
        "Mood-based color shifts (anger = dark red, joy = bright aqua, fear = pale gray). "
        "Facial Features: Eyes: 3–5 asymmetrical floating orbs inside the blob that rotate or blink independently. "
        "Mouth: Optional—appears as a rippling crescent on the surface when speaking or emoting. "
        "No visible nose or ears; uses vibration-sensitive receptors embedded in goo. Limbs: None by default, but can extrude pseudopods (tentacle-like limbs) when needed for interaction or locomotion. "
        "Can manifest temporary feet or hands. Movement & Behavior: Slides, bounces, and rolls. Can stick to walls and ceilings via suction. When scared, may flatten and ooze away quickly. "
        "Mannerisms: Constant wiggling or wobbling even at rest. Leaves harmless glowing slime trails. Tends to absorb nearby small objects temporarily out of curiosity."
    )
    img = generate_image(client, prompt, size="1024x1024")
    save_image(img, "glorptak.jpg", resize_to=(300,300), quality=80)
    print("Image saved to glorptak.jpg")

if __name__ == "__main__":
    main()
