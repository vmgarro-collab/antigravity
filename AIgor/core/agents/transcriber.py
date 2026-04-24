import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GROQ_API_KEY

from groq import Groq

_client = Groq(api_key=GROQ_API_KEY)

def transcribe_chunk(audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        result = _client.audio.transcriptions.create(
            file=("chunk.wav", f, "audio/wav"),
            model="whisper-large-v3",
            language="es",
        )
    return result.text.strip()
