from supabase import create_client
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Bucket name
BUCKET = "papers"

# Manually paste the internal path (everything AFTER "papers/")
internal_path = "papers/dev/2025/11/11/86f29bc2-d51b-4f0d-ad90-08e9a898d899.pdf"

print(f"Downloading: {internal_path}")

# Download the file
file_bytes = supabase.storage.from_(BUCKET).download(internal_path)

# Save it locally
output_file = "test_paper.pdf"
with open(output_file, "wb") as f:
    f.write(file_bytes)

print(f"✔ Saved to {output_file}")
