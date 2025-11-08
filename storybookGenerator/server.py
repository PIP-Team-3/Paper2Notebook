# server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os, base64
from typing import Optional

# Load environment variables
load_dotenv()

# Initialize client once
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

app = FastAPI()

# Define input format
class ImageRequest(BaseModel):
    prompt: str
    size: Optional[str] = "1024x1024"

@app.post("/generate_image")
async def generate_image(request: ImageRequest):
    try:
        result = client.images.generate(
            model="gpt-image-1",
            prompt=request.prompt,
            size=request.size
        )
        # Return base64-encoded image
        image_b64 = result.data[0].b64_json
        return {"image_base64": image_b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
