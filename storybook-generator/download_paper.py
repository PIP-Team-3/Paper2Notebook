from supabase import create_client
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Bucket name
BUCKET = "papers"

# Manually paste the internal path (everything AFTER "papers/")
internal_path = "papers/dev/2025/12/02/e08c4cc2-3dce-4a1b-95de-8c185f66a88d.pdf"


print(f"Downloading: {internal_path}")

# Download the file
file_bytes = supabase.storage.from_(BUCKET).download(internal_path)

# Save it locally
output_file = "test_paper.pdf"
with open(output_file, "wb") as f:
    f.write(file_bytes)

print(f"✔ Saved to {output_file}")
