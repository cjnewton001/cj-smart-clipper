import os
import json
import re
import time
import uuid
from typing import List
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
from backend.services.gemini_service import analyze_video, find_video_file
from backend.services.video_service import extract_clips, create_clips_zip

class ManualCut(BaseModel):
    start_time: str
    end_time: str


router = APIRouter()

# In-memory storage for background task states
TASKS_STORE = {}

def _process_video_task(task_id: str, video_id: str, num_clips: str, aspect_ratio: str = "original"):
    t0 = time.time()
    try:
        def update_stage(msg: str):
            if task_id in TASKS_STORE:
                TASKS_STORE[task_id]["stage"] = msg

        print(f"[Task {task_id}] Resolving source video for '{video_id}'...", flush=True)
        resolved_path = find_video_file(video_id)
        file_size_bytes = os.path.getsize(resolved_path)
        actual_name = os.path.basename(resolved_path)
        
        TASKS_STORE[task_id].update({
            "source_filename": actual_name,
            "file_size": file_size_bytes,
            "stage": "Ingesting video with Gemini AI..."
        })

        print(f"[Task {task_id}] Analyzing video '{actual_name}' ({file_size_bytes / (1024*1024):.2f} MB)...", flush=True)
        timestamps = analyze_video(video_id, num_clips, progress_callback=update_stage)
        
        update_stage("Extracting highlights via FFmpeg...")
        print(f"[Task {task_id}] Extracting clips using FFmpeg (aspect_ratio={aspect_ratio})...", flush=True)
        clips = extract_clips(video_id, timestamps, aspect_ratio=aspect_ratio, progress_callback=update_stage)
        
        # Build ZIP archive for batch download
        zip_url = create_clips_zip(video_id, clips) if clips else None

        elapsed = round(time.time() - t0, 1)
        TASKS_STORE[task_id] = {
            "status": "completed",
            "video_id": video_id,
            "source_filename": actual_name,
            "file_size": file_size_bytes,
            "duration": elapsed,
            "clips": clips,
            "zip_url": zip_url,
            "stage": "Finished"
        }
        print(f"[Task {task_id}] Completed in {elapsed}s with {len(clips)} clips!", flush=True)
    except Exception as e:
        elapsed = round(time.time() - t0, 1)
        print(f"[Task {task_id}] Failed with error: {e}", flush=True)
        TASKS_STORE[task_id] = {
            "status": "failed",
            "duration": elapsed,
            "error": str(e)
        }

@router.post("/generate/{video_id}")
def generate_clips(video_id: str, background_tasks: BackgroundTasks, num_clips: str = "auto", aspect_ratio: str = "original"):
    """
    Starts an asynchronous background task to analyze video and generate clips.
    Returns a task_id immediately to prevent HTTP connection timeouts.
    """
    task_id = str(uuid.uuid4())
    TASKS_STORE[task_id] = {
        "status": "processing",
        "video_id": video_id,
        "aspect_ratio": aspect_ratio,
        "stage": "Initializing video clipping deck...",
        "start_time": time.time()
    }
    
    background_tasks.add_task(_process_video_task, task_id, video_id, num_clips, aspect_ratio)
    
    return {
        "message": "Clip generation started",
        "task_id": task_id,
        "video_id": video_id
    }

def _process_manual_video_task(task_id: str, video_id: str, cuts: List[ManualCut]):
    t0 = time.time()
    try:
        def update_stage(msg: str):
            if task_id in TASKS_STORE:
                TASKS_STORE[task_id]["stage"] = msg

        print(f"[Task {task_id}] Resolving source video for '{video_id}'...", flush=True)
        resolved_path = find_video_file(video_id)
        file_size_bytes = os.path.getsize(resolved_path)
        actual_name = os.path.basename(resolved_path)
        
        TASKS_STORE[task_id].update({
            "source_filename": actual_name,
            "file_size": file_size_bytes,
            "stage": "Preparing manual extraction..."
        })

        timestamps = [{"start_time": cut.start_time, "end_time": cut.end_time, "description": f"Manual cut {cut.start_time}-{cut.end_time}"} for cut in cuts]
        
        update_stage("Extracting highlights via FFmpeg...")
        print(f"[Task {task_id}] Extracting manual clips using FFmpeg...", flush=True)
        # We enforce original aspect ratio for manual cuts or pass original
        clips = extract_clips(video_id, timestamps, aspect_ratio="original", progress_callback=update_stage)
        
        # Build ZIP archive for batch download
        zip_url = create_clips_zip(video_id, clips) if clips else None

        elapsed = round(time.time() - t0, 1)
        TASKS_STORE[task_id] = {
            "status": "completed",
            "video_id": video_id,
            "source_filename": actual_name,
            "file_size": file_size_bytes,
            "duration": elapsed,
            "clips": clips,
            "zip_url": zip_url,
            "stage": "Finished"
        }
        print(f"[Task {task_id}] Completed manual generation in {elapsed}s with {len(clips)} clips!", flush=True)
    except Exception as e:
        elapsed = round(time.time() - t0, 1)
        print(f"[Task {task_id}] Manual task failed with error: {e}", flush=True)
        TASKS_STORE[task_id] = {
            "status": "failed",
            "duration": elapsed,
            "error": str(e)
        }

@router.post("/manual_generate/{video_id}")
def generate_manual_clips(video_id: str, cuts: List[ManualCut], background_tasks: BackgroundTasks):
    """
    Starts an asynchronous background task to extract user-provided timestamp ranges.
    Returns a task_id immediately.
    """
    task_id = str(uuid.uuid4())
    TASKS_STORE[task_id] = {
        "status": "processing",
        "video_id": video_id,
        "aspect_ratio": "original",
        "stage": "Initializing manual extraction deck...",
        "start_time": time.time()
    }
    
    background_tasks.add_task(_process_manual_video_task, task_id, video_id, cuts)
    
    return {
        "message": "Manual clip extraction started",
        "task_id": task_id,
        "video_id": video_id
    }

@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    """
    Endpoint for polling task progress.
    """
    if task_id not in TASKS_STORE:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return TASKS_STORE[task_id]

@router.get("/sessions/list")
def list_sessions():
    """
    Scans generated clips in /clips and groups them into sessions by video source.
    Returns a list of sessions for the Library view.
    """
    CLIPS_DIR = "clips"
    if not os.path.exists(CLIPS_DIR):
        return {"sessions": []}

    files = os.listdir(CLIPS_DIR)
    clip_files = [f for f in files if f.endswith(".mp4") and "_clip_" in f]
    
    sessions = {}
    for clip_f in clip_files:
        parts = clip_f.split("_clip_")
        base_name = parts[0]
        if base_name not in sessions:
            sessions[base_name] = {
                "source_filename": base_name + ".mp4",
                "clips": [],
                "created_at": time.ctime(os.path.getmtime(os.path.join(CLIPS_DIR, clip_f))),
                "timestamp": os.path.getmtime(os.path.join(CLIPS_DIR, clip_f))
            }
        
        clip_path = os.path.join(CLIPS_DIR, clip_f)
        thumb_name = clip_f.rsplit(".", 1)[0] + "_thumb.jpg"
        thumb_path = os.path.join(CLIPS_DIR, thumb_name)
        meta_name = clip_f.rsplit(".", 1)[0] + "_meta.json"
        meta_path = os.path.join(CLIPS_DIR, meta_name)
        
        # Load sidecar metadata if available
        clip_meta = {}
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as mf:
                    clip_meta = json.load(mf)
            except Exception:
                pass
        
        sessions[base_name]["clips"].append({
            "id": clip_f,
            "filename": clip_f,
            "url": f"/clips/{clip_f}",
            "thumbnail_url": f"/clips/{thumb_name}" if os.path.exists(thumb_path) else None,
            "file_size": f"{os.path.getsize(clip_path) / (1024*1024):.1f} MB",
            "overview": clip_meta.get("overview") or clip_meta.get("description", ""),
            "description": clip_meta.get("overview") or clip_meta.get("description", ""),
            "hook": clip_meta.get("hook", ""),
            "visuals_action": clip_meta.get("visuals_action", ""),
            "caption": clip_meta.get("caption", ""),
            "hashtags": clip_meta.get("hashtags", [])
        })

    # Sort sessions newest first
    sorted_sessions = sorted(sessions.values(), key=lambda s: s["timestamp"], reverse=True)
    return {"sessions": sorted_sessions}

@router.get("/{video_id}")
async def get_clips(video_id: str):
    """
    Fetch existing clips generated for a video_id.
    """
    CLIPS_DIR = "clips"
    safe_base = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', os.path.splitext(video_id)[0])
    matched_clips = []
    
    if os.path.exists(CLIPS_DIR):
        for f in os.listdir(CLIPS_DIR):
            if f.startswith(safe_base) and f.endswith(".mp4") and "_clip_" in f:
                thumb_f = f.rsplit(".", 1)[0] + "_thumb.jpg"
                meta_f = f.rsplit(".", 1)[0] + "_meta.json"
                meta_path = os.path.join(CLIPS_DIR, meta_f)
                
                clip_meta = {}
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path, 'r', encoding='utf-8') as mf:
                            clip_meta = json.load(mf)
                    except Exception:
                        pass
                
                matched_clips.append({
                    "id": f,
                    "url": f"/clips/{f}",
                    "thumbnail_url": f"/clips/{thumb_f}" if os.path.exists(os.path.join(CLIPS_DIR, thumb_f)) else None,
                    "overview": clip_meta.get("overview") or clip_meta.get("description", f"Extracted clip from {video_id}"),
                    "description": clip_meta.get("overview") or clip_meta.get("description", f"Extracted clip from {video_id}"),
                    "hook": clip_meta.get("hook", ""),
                    "visuals_action": clip_meta.get("visuals_action", ""),
                    "caption": clip_meta.get("caption", ""),
                    "hashtags": clip_meta.get("hashtags", [])
                })
                
    return {"video_id": video_id, "clips": matched_clips}

