import requests
import base64
from io import BytesIO
from PIL import Image

# Supported values are: '1024x1024', '1024x1536', '1536x1024', and 'auto'
response = requests.post(
    "http://127.0.0.1:8000/generate_image",
    json={"prompt": "a dolphin in the sea", "size": "auto"},
)

data = response.json()

# Only try decoding if it worked
if "image_base64" in data:
    b64_data = data["image_base64"]
    img = Image.open(BytesIO(base64.b64decode(b64_data)))
    img.show()
    img.save("generated_image.jpg")
    print("✅ Image saved as generated_image.jpg")
else:
    print("❌ Error:", data)
