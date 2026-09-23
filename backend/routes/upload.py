import os
import re
import uuid
from fastapi import APIRouter, UploadFile, File

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_video(file: UploadFile = File(...)):
    """
    Saves the uploaded video to the /uploads directory with sanitized, reliable naming.
    """
    raw_name = file.filename or f"video_{uuid.uuid4().hex[:8]}.mp4"
    # Keep alphanumeric, dots, dashes, and underscores
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', raw_name)
    clean_name = re.sub(r'_+', '_', clean_name)
    if not clean_name or clean_name.startswith('.'):
        clean_name = f"video_{uuid.uuid4().hex[:8]}.mp4"
        
    file_path = os.path.join(UPLOAD_DIR, clean_name)
    
    # Save uploaded file in chunks to handle large files smoothly
    with open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024 * 4): # 4MB chunks
            f.write(chunk)

    return {
        "message": "Video uploaded successfully",
        "filename": clean_name,
        "video_id": clean_name,
        "original_filename": file.filename
    }
