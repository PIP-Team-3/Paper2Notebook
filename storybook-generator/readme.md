# 🧠 Storybook Image Generator

This module is part of the **[Paper2Notebook](https://github.com/PIP-Team-3/Paper2Notebook)** project.  
It provides a simple **FastAPI service** that uses **OpenAI’s `gpt-image-1` model** to generate images from text prompts.  
The service powers the **Storybook** feature, allowing research papers to be illustrated as visual stories.

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository and navigate to the module
```bash
git clone https://github.com/PIP-Team-3/Paper2Notebook.git
cd Paper2Notebook/storybookGenerator

### 2️⃣ Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

### 3️⃣ Install dependencies
pip install -r requirements.txt

### 4️⃣ Add your OpenAI API key
OPENAI_API_KEY=sk-your_api_key_here

### 5️⃣ Run the FastAPI server
uvicorn server:app --reload


If you want to run the script automatically, run python test_client.py.

Example request body:
{
  "prompt": "a cute robot reading a research paper under a tree",
  "size": "auto"
}