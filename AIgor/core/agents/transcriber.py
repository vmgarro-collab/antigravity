import sys
import os
import wave
import math

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GROQ_API_KEY

from groq import Groq

_client = Groq(api_key=GROQ_API_KEY)

MAX_BYTES = 24 * 1024 * 1024  # 24MB — margen bajo el límite de 25MB de Groq


def _split_wav(audio_path: str) -> list[str]:
    """Divide un WAV en trozos de menos de 24MB. Devuelve lista de rutas temporales."""
    size = os.path.getsize(audio_path)
    if size <= MAX_BYTES:
        return [audio_path]

    with wave.open(audio_path, 'rb') as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        frames_per_chunk = int((MAX_BYTES / (n_channels * sampwidth)) * 0.95)
        n_chunks = math.ceil(n_frames / frames_per_chunk)
        parts = []
        for i in range(n_chunks):
            wf.setpos(i * frames_per_chunk)
            data = wf.readframes(min(frames_per_chunk, n_frames - i * frames_per_chunk))
            part_path = audio_path + f'.part{i}.wav'
            with wave.open(part_path, 'wb') as out:
                out.setnchannels(n_channels)
                out.setsampwidth(sampwidth)
                out.setframerate(framerate)
                out.writeframes(data)
            parts.append(part_path)
    return parts


def transcribe_chunk(audio_path: str) -> str:
    parts = _split_wav(audio_path)
    texts = []
    try:
        for part in parts:
            with open(part, "rb") as f:
                result = _client.audio.transcriptions.create(
                    file=("recording.wav", f, "audio/wav"),
                    model="whisper-large-v3",
                    language="es",
                )
            texts.append(result.text.strip())
    finally:
        for part in parts:
            if part != audio_path and os.path.exists(part):
                os.unlink(part)
    return " ".join(texts)
