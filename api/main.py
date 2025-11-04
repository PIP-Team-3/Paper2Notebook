import os
import hashlib
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

app = FastAPI()

# returns the list of all papers from db
@app.get("/papers")
def read_all_papers():
    try:
        return supabase.table("papers").select("*").execute().data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e.message}")   

# returns the paper that matches the given id
@app.get("/papers/{id}")
def read_paper(id):
    try:
        result = supabase.table("papers").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e.message}")
    
    papers = result.data
        
    if not papers:    
        raise HTTPException(status_code=404, detail=f"Paper with id {id} not found")

    return papers[0]

# uploads the paper
@app.post("/papers/")
async def upload_paper(
    file: UploadFile = File(...),         
    title: str = Form(...),              
    created_by_uuid: str = Form(None),
    doi: str = Form(None),               
    arxiv_id: str = Form(None),          
    source_url: str = Form(None)         
):
    # 1. File Handling & SHA256 Calculation
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    try:
        contents = await file.read()
        sha256 = hashlib.sha256(contents).hexdigest()
        await file.seek(0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {e}")
    finally:
        await file.close()

    # 2. Check for Duplication via SHA256
    try:
        existing_doc = supabase.table("papers").select("id").eq("pdf_sha256", sha256).execute()
        if existing_doc.data:
            raise HTTPException(status_code=409, detail="File already exists (SHA256 duplicate)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {e}")

    if created_by_uuid == "":
        created_by_uuid = None
    
    # 3. DB INSERT to get the Primary Key 'id'
    try:
        metadata_to_insert = {
            "title": title,
            "source_url": source_url,
            "doi": doi,
            "arxiv_id": arxiv_id,
            "pdf_storage_path": "papers/",
            "vector_store_id": "pending",
            "pdf_sha256": sha256,
            "status": "ready", # db only accepts ready for now
            "created_by": created_by_uuid,
        }   
        db_insert_result = supabase.table("papers").insert(metadata_to_insert).execute()
        new_doc_id = db_insert_result.data[0]['id']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload error: {e}")

    # 4. Storage Upload
    storage_filename = f"{new_doc_id}{os.path.splitext(file.filename)[1]}"
    storage_path = f"papers/{storage_filename}" 

    try:
        supabase.storage.from_("papers").upload(
            file=contents,
            path=storage_path,
            file_options={"content-type": file.content_type}
        )

    except Exception as e:
        # Delete the partially created DB record if storage fails
        supabase.table("papers").delete().eq("id", new_doc_id).execute()
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # 5. Finalize with file paths and final status
    try:
        update_data = {
            "pdf_storage_path": storage_path,
            "status": "ready" # should be changed
        }     
        supabase.table("papers").update(update_data).eq("id", new_doc_id).execute()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB update error: {e}")

    # 6. Success Response
    return {
        "message": f"Document '{title}' successfully processed.",
        "id": new_doc_id,
        "storage_path": storage_path,
        "status": "ready"
    }

@app.post("/papers/{id}/start")
def start():
    return f"kick off paper processing for paper: {id}"