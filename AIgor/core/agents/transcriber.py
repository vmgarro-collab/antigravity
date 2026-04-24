import sys
import os
import google.generativeai as genai

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-1.5-flash")

def transcribe_chunk(audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
    response = _model.generate_content([
        "Transcribe the following audio accurately. Return only the transcribed text in the same language as the audio, no comments or explanations.",
        {"mime_type": "audio/wav", "data": audio_bytes},
    ])
    return response.text.strip()
