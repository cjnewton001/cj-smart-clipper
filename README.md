# Smart Clipper

A personal short-form video clipping workflow tool.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Add your Gemini API Key to `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

## Run

```bash
uvicorn backend.main:app --reload
```

The UI will be available at http://localhost:8000
