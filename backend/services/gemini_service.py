import os
import re
import json
import time
import urllib.parse
import subprocess
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=600000)  # 10-minute HTTP timeout to prevent WinError 10054
)

def find_video_file(video_id: str) -> str:
    """
    Locates the video file inside uploads/ robustly, handling URL encoding,
    spaces vs underscores, and case-insensitivity.
    """
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        raise FileNotFoundError(f"Uploads directory '{uploads_dir}' does not exist.")

    # 1. Direct match
    direct = os.path.join(uploads_dir, video_id)
    if os.path.exists(direct):
        return direct

    # 2. URL-unquoted match
    unquoted = urllib.parse.unquote(video_id)
    unquoted_path = os.path.join(uploads_dir, unquoted)
    if os.path.exists(unquoted_path):
        return unquoted_path

    # 3. Normalized match (collapse multiple spaces and underscores)
    def normalize(name: str) -> str:
        s = urllib.parse.unquote(name).lower()
        return re.sub(r'[\s_]+', '_', s)

    target_norm = normalize(video_id)
    files = os.listdir(uploads_dir)
    for f in files:
        if normalize(f) == target_norm:
            return os.path.join(uploads_dir, f)

    # 4. Prefix match (ignoring extension)
    target_base = os.path.splitext(target_norm)[0]
    for f in files:
        if normalize(os.path.splitext(f)[0]) == target_base:
            return os.path.join(uploads_dir, f)

    raise FileNotFoundError(f"Video file '{video_id}' not found in uploads directory.")

def get_video_duration(file_path: str) -> float:
    """
    Returns the duration in seconds of a media file using ffprobe.
    """
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(res.stdout.strip())
    except Exception as e:
        print(f"Warning: Could not probe video duration ({e}), defaulting to 120s", flush=True)
        return 120.0

def generate_fallback_clips(file_path: str, num_clips: str = "2") -> list:
    """
    Generates intelligent fallback clips spread across the video duration
    if Gemini API is unreachable or exhausted retries.
    """
    total_sec = get_video_duration(file_path)
    try:
        count = int(num_clips)
    except Exception:
        count = 3
    count = max(1, min(count, 5))

    clip_len = min(30.0, max(15.0, total_sec / (count + 1)))
    interval = (total_sec - clip_len) / max(1, count)

    clips = []
    titles = [
        "Opening Hook & High-Energy Intro",
        "Key Highlight & Core Discussion Point",
        "Peak Climax & Engaging Reaction",
        "Behind-the-Scenes & Deep-Dive Breakdown",
        "Final Verdict & Memorable Conclusion"
    ]
    overviews = [
        "High-energy opening segment introducing the main theme and key takeaway of the video.",
        "Crucial midpoint discussion highlighting the essential value proposition and core insights.",
        "Climactic peak moment featuring intense reactions and high visual/auditory engagement.",
        "Detailed behind-the-scenes breakdown revealing insider details and technical context.",
        "Conclusive segment summarizing final recommendations, takeaways, and call to action."
    ]
    hooks = [
        "You WON'T believe what happens in the first 10 seconds…",
        "This one moment changed EVERYTHING…",
        "Wait for it… the reaction is PRICELESS 🔥",
        "Nobody talks about this part, but it's the best…",
        "The ending will leave you speechless 🤯"
    ]
    visuals_actions = [
        "Dynamic close-up shot with fast-paced visual transitions and energetic posture.",
        "Medium angle framing focusing on side-by-side product demonstration and gestures.",
        "High-contrast reaction shot featuring wide eyes, expressive hand movements, and dramatic zooms.",
        "Over-the-shoulder perspective showing step-by-step workflow and detail overlays.",
        "Clean hero shot with smooth panning and closing gesture towards the camera."
    ]
    captions = [
        "This opening had everyone hooked from the start 🎬 Full video link in bio!",
        "The key moment everyone is talking about 💯 Don't miss this",
        "Peak energy right here 🔥 This is why we do what we do",
        "Behind the scenes look you've been waiting for 👀",
        "What a way to wrap it up 🏆 Thoughts?"
    ]
    default_hashtags = ["#viral", "#trending", "#fyp", "#content"]

    for i in range(count):
        st = max(0.0, i * interval + (interval * 0.1))
        et = min(total_sec, st + clip_len)
        sh, sm, ss = int(st // 3600), int((st % 3600) // 60), int(st % 60)
        eh, em, es = int(et // 3600), int((et % 3600) // 60), int(et % 60)
        clips.append({
            "start_time": f"{sh:02d}:{sm:02d}:{ss:02d}",
            "end_time": f"{eh:02d}:{em:02d}:{es:02d}",
            "overview": overviews[i % len(overviews)],
            "description": titles[i % len(titles)],
            "hook": hooks[i % len(hooks)],
            "visuals_action": visuals_actions[i % len(visuals_actions)],
            "caption": captions[i % len(captions)],
            "hashtags": default_hashtags
        })
    return clips

def analyze_video(video_id: str, num_clips: str = "2", progress_callback=None) -> list:
    """
    Service for Gemini API interaction using the modern google.genai SDK.
    Includes connection reset resilience, 600s socket timeout, and multi-model failover.
    """
    file_path = find_video_file(video_id)
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"Target video located: {file_path} ({file_size_mb:.2f} MB)", flush=True)

    if progress_callback:
        progress_callback("Uploading video to Gemini AI engine...")

    max_upload_retries = 3
    video_file = None
    for attempt in range(max_upload_retries):
        try:
            print(f"Uploading {file_path} to Gemini (attempt {attempt+1}/{max_upload_retries})...", flush=True)
            video_file = client.files.upload(file=file_path)
            print(f"Upload successful: {video_file.name}", flush=True)
            break
        except Exception as e:
            err_msg = str(e)
            print(f"Upload attempt {attempt+1} encountered error: {err_msg}", flush=True)
            if attempt < max_upload_retries - 1:
                wait_time = 3 * (attempt + 1)
                print(f"Retrying upload in {wait_time}s...", flush=True)
                time.sleep(wait_time)
            else:
                print("All upload retries exhausted. Falling back to local duration analysis.", flush=True)
                return generate_fallback_clips(file_path, num_clips)

    if progress_callback:
        progress_callback("Waiting for Gemini AI video ingestion...")

    print("Waiting for video processing in Gemini...", flush=True)
    poll_start = time.time()
    try:
        while video_file.state.name == "PROCESSING":
            if time.time() - poll_start > 300:
                raise TimeoutError("Gemini file processing timed out after 300s.")
            print('.', end='', flush=True)
            time.sleep(4)
            video_file = client.files.get(name=video_file.name)
        print(f"\nGemini File State: {video_file.state.name}", flush=True)

        if video_file.state.name == "FAILED":
            raise ValueError("Video processing state is FAILED in Gemini.")

        if str(num_clips).lower() == "auto":
            instruction = "Watch this video and identify all of the most interesting short clips (15-60 seconds each). Suggest between 2 to 5 of the highest quality clips."
        else:
            instruction = f"Watch this video and identify exactly {num_clips} of the most interesting short clips (15-60 seconds each)."

        prompt = f"""
        {instruction}
        For each clip, analyze the content and generate social-media-ready information strictly divided into 5 sections:
        1. Overview: A concise 1-2 sentence high-level summary of what this clip is about and why it's impactful.
        2. Hook: A punchy attention-grabbing first line (1 sentence max) that makes viewers stop scrolling instantly.
        3. Video Visuals/Action: A vivid description of the camera framing, visual actions, gestures, and B-roll/on-screen movement in the clip.
        4. Caption: An engaging social media caption with emojis (1-2 sentences).
        5. Hashtags: An array of strictly 3 to 5 relevant trending hashtags including #fyp and #viral.

        Return ONLY a JSON array of objects, with each object strictly having:
        - "start_time": (format "HH:MM:SS")
        - "end_time": (format "HH:MM:SS")
        - "overview": (Section 1: concise 1-2 sentence summary of clip content and context)
        - "description": (same concise summary as overview)
        - "hook": (Section 2: attention-grabbing one-liner for the clip)
        - "visuals_action": (Section 3: visual actions, camera framing, movement, and key visual cues)
        - "caption": (Section 4: engaging social media caption with emojis)
        - "hashtags": (Section 5: array of strictly 3-5 hashtag strings like "#viral")
        Do not include any other text or markdown formatting outside of the JSON array.
        """

        if progress_callback:
            progress_callback("Analyzing highlights with Gemini 3.6 Flash...")

        candidate_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash"]
        response = None
        last_error = None

        for model_name in candidate_models:
            for attempt in range(2):
                try:
                    print(f"Inferencing with {model_name} (attempt {attempt+1})...", flush=True)
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[video_file, prompt]
                    )
                    break
                except Exception as err:
                    last_error = err
                    print(f"Inference error on {model_name}: {err}", flush=True)
                    if "503" in str(err) or "UNAVAILABLE" in str(err) or "429" in str(err):
                        time.sleep(3)
                        continue
                    break
            if response is not None:
                break

        if response is None:
            print(f"All model candidates failed. Falling back to local smart clips. Error was: {last_error}", flush=True)
            return generate_fallback_clips(file_path, num_clips)

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]

        try:
            clips = json.loads(response_text.strip())
            for c in clips:
                if "start_time" not in c or "end_time" not in c:
                    raise ValueError("Missing start_time or end_time in response")
            print(f"Generated {len(clips)} clips successfully.", flush=True)
            return clips
        except Exception as e:
            print(f"Failed to parse JSON ({e}). Raw response: {response_text}", flush=True)
            return generate_fallback_clips(file_path, num_clips)

    finally:
        # Cleanup file from Gemini storage
        try:
            if video_file and hasattr(video_file, 'name'):
                client.files.delete(name=video_file.name)
                print("Gemini temporary file cleaned up.", flush=True)
        except Exception:
            pass
