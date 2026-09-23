import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Create a small dummy video file
with open("test.mp4", "wb") as f:
    f.write(b"0" * 1024) # 1 KB

try:
    print("Uploading test.mp4...")
    f = client.files.upload(file="test.mp4")
    print("Uploaded:", f.name)
except Exception as e:
    print("Error:", e)
finally:
    if os.path.exists("test.mp4"):
        os.remove("test.mp4")
