import sys
import os
import urllib.request
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GROQ_API_KEY

def transcribe_chunk(audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    boundary = "----FormBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="chunk.wav"\r\n'
        f"Content-Type: audio/wav\r\n\r\n"
    ).encode() + audio_bytes + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="model"\r\n\r\n'
        f"whisper-large-v3\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="language"\r\n\r\n'
        f"es\r\n"
        f"--{boundary}--\r\n"
    ).encode()

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    return result.get("text", "").strip()
