from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import upload, clips

app = FastAPI(title="Smart Clipper API")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(clips.router, prefix="/api/clips", tags=["Clips"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Smart Clipper API is running"}

# Mount clips directory
app.mount("/clips", StaticFiles(directory="clips"), name="clips")

# Mount frontend static files
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
