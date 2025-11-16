import os
import hashlib
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (configure more restrictively in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# uploads the paper by calling the backend ingest endpoint
@app.post("/papers/")
async def upload_paper(
    file: UploadFile = File(...),
    title: str = Form(None),
):
    """
    Upload a paper PDF and ingest it via the backend API.
    Calls POST /api/v1/papers/ingest on the backend service.
    """
    import httpx

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    ingest_endpoint = f"{backend_url}/api/v1/papers/ingest"

    try:
        contents = await file.read()
        await file.seek(0)

        # Prepare form data for the ingest endpoint
        form_data = {
            "file": (file.filename, contents, file.content_type)
        }
        if title:
            form_data["title"] = (None, title)

        # Call the backend ingest endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(ingest_endpoint, files=form_data)

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Backend ingest failed: {response.text}"
            )

        result = response.json()
        paper_id = result.get("paper_id")

        # Update the paper stage to "ingest" in the database
        if paper_id:
            try:
                supabase.table("papers").update({"stage": "ingest"}).eq("id", paper_id).execute()
            except Exception as e:
                print(f"Warning: Failed to update paper stage: {e}")
                # Don't fail the request if stage update fails

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail=f"Paper upload failed: {str(e)}"
        )

@app.get("/papers/{paper_id}/extract")
async def extract_claims(paper_id: str):
    """
    Extract claims from a paper by calling the backend extract endpoint.
    Calls POST /api/v1/papers/{paper_id}/extract on the backend service.

    Returns an SSE stream of extraction progress and results.
    Relays backend SSE events in a readable format for the frontend.

    Backend event types handled:
    - stage_update: Progress milestones (extract_start, file_search_call, persist_start, persist_done, extract_complete)
    - token: Output tokens from the LLM
    - log_line: Backend reasoning and logs
    - result: Final extracted claims
    - error: Extraction errors with remediation hints
    """
    import httpx
    import json

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    extract_endpoint = f"{backend_url}/api/v1/papers/{paper_id}/extract"

    async def event_stream():
        """Generator that streams SSE events from backend to frontend."""
        try:
            # Update the paper stage to "extract" in the database
            try:
                supabase.table("papers").update({"stage": "extract"}).eq("id", paper_id).execute()
            except Exception as e:
                print(f"Warning: Failed to update paper stage: {e}")

            # Call the backend extract endpoint with streaming
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("POST", extract_endpoint) as response:
                    if response.status_code not in [200, 201]:
                        error_data = await response.aread()
                        error_msg = error_data.decode() if error_data else "Unknown error"
                        yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"
                        return

                    # Stream each line from the backend response
                    current_event_type = None
                    async for line in response.aiter_lines():
                        if not line:
                            continue

                        # Parse SSE format: "event: <type>" or "data: <json>"
                        if line.startswith("event: "):
                            current_event_type = line[7:]  # Extract event type
                            continue

                        if line.startswith("data: "):
                            event_data_str = line[6:]  # Extract JSON data
                            try:
                                event_data = json.loads(event_data_str)

                                # Transform backend events into readable frontend events
                                event_type = current_event_type or "message"

                                # Map backend event types to human-readable messages
                                if event_type == "stage_update":
                                    stage = event_data.get("stage", "")
                                    stage_messages = {
                                        "extract_start": "Starting extraction process...",
                                        "file_search_call": "Searching paper content...",
                                        "persist_start": f"Saving {event_data.get('count', '?')} claims to database...",
                                        "persist_done": f"Successfully saved {event_data.get('count', '?')} claims",
                                        "extract_complete": "Extraction complete!",
                                    }
                                    message = stage_messages.get(stage, f"Stage: {stage}")
                                    yield f"data: {json.dumps({'type': 'progress', 'message': message})}\n\n"

                                elif event_type == "token":
                                    # Stream tokens as they arrive
                                    delta = event_data.get("delta", "")
                                    if delta:
                                        yield f"data: {json.dumps({'type': 'log', 'message': delta})}\n\n"

                                elif event_type == "log_line":
                                    # Backend reasoning/logs
                                    message = event_data.get("message", "")
                                    yield f"data: {json.dumps({'type': 'log', 'message': message})}\n\n"

                                elif event_type == "result":
                                    # Final results
                                    claims = event_data.get("claims", [])
                                    yield f"data: {json.dumps({'type': 'complete', 'message': f'Extracted {len(claims)} claims', 'claims': claims})}\n\n"

                                elif event_type == "error":
                                    # Backend error
                                    code = event_data.get("code", "")
                                    message = event_data.get("message", "Unknown error")
                                    remediation = event_data.get("remediation", "")
                                    error_msg = f"{message}"
                                    if remediation:
                                        error_msg += f" - {remediation}"
                                    yield f"data: {json.dumps({'type': 'error', 'message': error_msg, 'code': code})}\n\n"

                                else:
                                    # Generic event relay
                                    yield f"data: {json.dumps({'type': 'log', 'message': json.dumps(event_data)})}\n\n"

                            except json.JSONDecodeError:
                                # If data is not JSON, relay as plain text
                                yield f"data: {json.dumps({'type': 'log', 'message': event_data_str})}\n\n"

        except Exception as e:
            error_msg = f"Claims extraction failed: {str(e)}"
            print(f"Error in extract_claims: {error_msg}")
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@app.get("/papers/{paper_id}/plan")
async def generate_plan(paper_id: str):
    """
    Generate a reproduction execution plan using LLM reasoning.
    Calls POST /api/v1/papers/{paper_id}/plan on the backend service.

    Returns JSON response with plan details.
    """
    import httpx
    import json

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    plan_endpoint = f"{backend_url}/api/v1/papers/{paper_id}/plan"

    try:
        # Get claims for this paper
        claims_response = supabase.table("claims").select("*").eq("paper_id", paper_id).execute()
        claims_data = claims_response.data

        if not claims_data:
            raise HTTPException(
                status_code=400,
                detail="No claims found for this paper. Extract claims first before planning."
            )

        # Transform claims to the format expected by backend
        claims = []
        for claim in claims_data:
            if claim.get('dataset_name') == 'SST-2':
                claims.append({
                    "dataset": claim.get("dataset_name"),
                    "split": claim.get("split"),
                    "metric": claim.get("metric_name"),
                    "value": claim.get("metric_value"),
                    "units": claim.get("units"),
                    "citation": claim.get("source_citation"),
                    "confidence": claim.get("confidence")
                })


        # Update the paper stage to "plan" in the database
        try:
            supabase.table("papers").update({"stage": "plan"}).eq("id", paper_id).execute()
        except Exception as e:
            print(f"Warning: Failed to update paper stage: {e}")

        # Call the backend plan endpoint
        payload = {
            "claims": claims,
            "budget_minutes": 20
        }


        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(plan_endpoint, json=payload)

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Backend plan generation failed: {response.text}"
            )

        return response.json()

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Plan generation failed: {str(e)}"
        )

@app.get("/papers/{paper_id}/latest-plan")
def get_latest_plan(paper_id: str):
    """
    Get the latest plan for a paper by querying the plans table
    and returning the plan with the most recent created_at date.
    """
    try:
        # Query plans table for this paper, ordered by created_at descending
        plans_response = supabase.table("plans").select("*").eq("paper_id", paper_id).order("created_at", desc=True).limit(1).execute()
        plans_data = plans_response.data

        if not plans_data:
            raise HTTPException(
                status_code=404,
                detail=f"No plans found for paper {paper_id}. Generate a plan first."
            )

        return plans_data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_latest_plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve plan: {str(e)}"
        )

@app.get("/papers/{paper_id}/plan-json")
def get_plan_json(paper_id: str):
    """
    Get the latest plan JSON for a paper.
    Returns the plan_json field from the latest plan.
    """
    try:
        # Query plans table for this paper, ordered by created_at descending
        plans_response = supabase.table("plans").select("plan_json").eq("paper_id", paper_id).order("created_at", desc=True).limit(1).execute()
        plans_data = plans_response.data

        if not plans_data:
            raise HTTPException(
                status_code=404,
                detail=f"No plans found for paper {paper_id}. Generate a plan first."
            )

        plan_json = plans_data[0].get("plan_json")
        if not plan_json:
            raise HTTPException(
                status_code=404,
                detail=f"Plan JSON not found for paper {paper_id}."
            )

        return plan_json

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_plan_json: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve plan JSON: {str(e)}"
        )

@app.get("/plans/{plan_id}/materialize")
async def generate_tests(plan_id: str):
    """
    Generate notebook and requirements.txt from plan.
    Calls POST /api/v1/plans/{plan_id}/materialize on the backend service.

    Returns JSON response with notebook and env asset paths.
    """
    import httpx

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    materialize_endpoint = f"{backend_url}/api/v1/plans/{plan_id}/materialize"

    try:
        # Get the paper_id associated with this plan
        plan_response = supabase.table("plans").select("paper_id").eq("id", plan_id).execute()
        plan_data = plan_response.data

        if not plan_data:
            raise HTTPException(
                status_code=404,
                detail=f"Plan with id {plan_id} not found"
            )

        paper_id = plan_data[0].get("paper_id")

        # Update the paper stage to "generate_test" in the database
        try:
            supabase.table("papers").update({"stage": "generate_test"}).eq("id", paper_id).execute()
        except Exception as e:
            print(f"Warning: Failed to update paper stage: {e}")
            # Don't fail the request if stage update fails

        # Call the backend materialize endpoint
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(materialize_endpoint)

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Backend materialize failed: {response.text}"
            )

        result = response.json()

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_tests: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test generation failed: {str(e)}"
        )

@app.get("/plans/{plan_id}/download-urls")
async def get_plan_download_urls(plan_id: str):
    """
    Get signed download URLs for materialized plan artifacts (notebook and requirements.txt).
    Calls GET /api/v1/plans/{plan_id}/assets on the backend service to get signed URLs.

    Returns JSON response with signed URLs for notebook and requirements files.
    """
    import httpx

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    assets_endpoint = f"{backend_url}/api/v1/plans/{plan_id}/assets"

    try:
        # Call the backend assets endpoint to get signed URLs
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(assets_endpoint)

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Backend assets fetch failed: {response.text}"
            )

        return response.json()

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_plan_download_urls: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve plan download URLs: {str(e)}"
        )

@app.get("/plans/{plan_id}/run")
async def run_tests(plan_id: str):
    """
    Execute a materialized plan's notebook in background task.
    Calls POST /api/v1/plans/{plan_id}/run on the backend service.

    Returns JSON response with run_id to be used for streaming events.
    """
    import httpx

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    run_endpoint = f"{backend_url}/api/v1/plans/{plan_id}/run"

    try:
        # Get the paper_id associated with this plan
        plan_response = supabase.table("plans").select("paper_id").eq("id", plan_id).execute()
        plan_data = plan_response.data

        if not plan_data:
            raise HTTPException(
                status_code=404,
                detail=f"Plan with id {plan_id} not found"
            )

        paper_id = plan_data[0].get("paper_id")

        # Update the paper stage to "run_test" in the database
        try:
            supabase.table("papers").update({"stage": "run_test"}).eq("id", paper_id).execute()
        except Exception as e:
            print(f"Warning: Failed to update paper stage: {e}")
            # Don't fail the request if stage update fails

        # Call the backend run endpoint
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(run_endpoint)

        if response.status_code not in [200, 201, 202]:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Backend run failed: {response.text}"
            )

        result = response.json()

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in run_tests: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Run tests failed: {str(e)}"
        )

@app.get("/runs/{run_id}/events")
async def stream_run_events(run_id: str):
    """
    Stream real-time execution events via SSE.
    Calls GET /api/v1/runs/{run_id}/events on the backend service.

    Returns an SSE stream of execution progress and results.
    Relays backend SSE events in a readable format for the frontend.

    Backend event types handled:
    - stage_update: Stage transitions (run_start, run_complete, run_error)
    - progress: Progress percentage (0-100)
    - log_line: Execution logs
    - error: Execution errors
    """
    import httpx
    import json

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    events_endpoint = f"{backend_url}/api/v1/runs/{run_id}/events"

    async def event_stream():
        """Generator that streams SSE events from backend to frontend."""
        try:
            # Call the backend events endpoint with streaming
            async with httpx.AsyncClient(timeout=600.0) as client:
                async with client.stream("GET", events_endpoint) as response:
                    if response.status_code not in [200, 201]:
                        error_data = await response.aread()
                        error_msg = error_data.decode() if error_data else "Unknown error"
                        yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"
                        return

                    # Stream each line from the backend response
                    current_event_type = None
                    async for line in response.aiter_lines():
                        if not line:
                            continue

                        # Parse SSE format: "event: <type>" or "data: <json>"
                        if line.startswith("event: "):
                            current_event_type = line[7:]  # Extract event type
                            continue

                        if line.startswith("data: "):
                            event_data_str = line[6:]  # Extract JSON data
                            try:
                                event_data = json.loads(event_data_str)

                                # Transform backend events into readable frontend events
                                event_type = current_event_type or "message"

                                # Map backend event types to human-readable messages
                                if event_type == "stage_update":
                                    stage = event_data.get("stage", "")
                                    stage_messages = {
                                        "run_start": "Starting notebook execution...",
                                        "run_complete": "Notebook execution complete!",
                                        "run_error": "Notebook execution failed!",
                                    }
                                    message = stage_messages.get(stage, f"Stage: {stage}")
                                    yield f"data: {json.dumps({'type': 'progress', 'message': message})}\n\n"

                                elif event_type == "progress":
                                    # Progress percentage
                                    percent = event_data.get("percent", 0)
                                    yield f"data: {json.dumps({'type': 'progress', 'message': f'Progress: {percent}%', 'percent': percent})}\n\n"

                                elif event_type == "log_line":
                                    # Execution logs
                                    message = event_data.get("message", "")
                                    yield f"data: {json.dumps({'type': 'log', 'message': message})}\n\n"

                                elif event_type == "error":
                                    # Backend error
                                    message = event_data.get("message", "Unknown error")
                                    code = event_data.get("code", "")
                                    error_msg = f"{message}"
                                    if code:
                                        error_msg += f" ({code})"
                                    yield f"data: {json.dumps({'type': 'error', 'message': error_msg, 'code': code})}\n\n"

                                else:
                                    # Generic event relay
                                    yield f"data: {json.dumps({'type': 'log', 'message': json.dumps(event_data)})}\n\n"

                            except json.JSONDecodeError:
                                # If data is not JSON, relay as plain text
                                yield f"data: {json.dumps({'type': 'log', 'message': event_data_str})}\n\n"

        except Exception as e:
            error_msg = f"Run events stream failed: {str(e)}"
            print(f"Error in stream_run_events: {error_msg}")
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@app.get("/papers/{paper_id}/claims")
async def get_claims(paper_id: str):
    try:
        result = supabase.table("claims").select("*").eq("paper_id", paper_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e.message}")
    
    claims = result.data
        
    if not claims:    
        raise HTTPException(status_code=404, detail=f"Claims for the paper with given id {paper_id} not found")

    return claims

@app.post("/papers/{id}/start")
def start():
    return f"kick off paper processing for paper: {id}"