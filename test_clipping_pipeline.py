import os
import sys
import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_pipeline():
    print("=== TESTING SMART CLIPPER PIPELINE ===")

    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print("Health Check Status:", r.status_code, r.json())
        assert r.status_code == 200
    except Exception as e:
        print("ERROR: Health check failed. Make sure the server is running on port 8000.")
        sys.exit(1)

    # 2. Prepare test video
    test_video_path = os.path.join("vid test", "iPhone 18 Pro Unboxing - This Needs Explaining(720P_HD).mp4")
    if not os.path.exists(test_video_path):
        print(f"Test video {test_video_path} not found, generating dummy video...")
        test_video_path = "dummy.mp4"
        with open(test_video_path, "wb") as f:
            f.write(b"0" * 1024)

    print(f"Uploading file: {test_video_path} ({os.path.getsize(test_video_path)} bytes)...")
    with open(test_video_path, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/upload/", files={"file": (os.path.basename(test_video_path), f, "video/mp4")})
    
    print("Upload response:", r.status_code, r.json())
    assert r.status_code == 200
    upload_data = r.json()
    video_id = upload_data["video_id"]

    # 3. Trigger clip generation
    print(f"Triggering clip generation for video_id='{video_id}'...")
    r = requests.post(f"{BASE_URL}/api/clips/generate/{video_id}?num_clips=2&aspect_ratio=9:16")
    print("Generation response:", r.status_code, r.json())
    assert r.status_code == 200
    task_id = r.json()["task_id"]

    # 4. Poll task status
    print(f"Polling task status for task_id='{task_id}'...")
    completed = False
    for attempt in range(90):
        time.sleep(2)
        r = requests.get(f"{BASE_URL}/api/clips/status/{task_id}")
        data = r.json()
        status = data.get("status")
        stage = data.get("stage", "Unknown")
        print(f"  Attempt {attempt+1}: Status='{status}', Stage='{stage}'")

        if status == "completed":
            completed = True
            print("\nSUCCESS! Clip generation completed.")
            print(f"Clips generated ({len(data['clips'])}):")
            for c in data['clips']:
                print(f" - ID: {c['id']} | Duration: {c.get('duration')} | URL: {c['url']} | Thumb: {c.get('thumbnail_url')}")
            print(f"Zip archive: {data.get('zip_url')}")
            break
        elif status == "failed":
            print(f"Task failed: {data.get('error')}")
            break

    assert completed, "Task did not complete successfully"
    print("\nALL PIPELINE TESTS PASSED PERFECTLY!")

    if os.path.exists("dummy.mp4"):
        os.remove("dummy.mp4")

if __name__ == "__main__":
    test_pipeline()
