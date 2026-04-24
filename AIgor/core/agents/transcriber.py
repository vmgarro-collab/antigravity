from faster_whisper import WhisperModel
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import WHISPER_MODEL

_model = None

def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    return _model

def transcribe_chunk(audio_path: str) -> str:
    model = get_model()
    segments, _ = model.transcribe(audio_path, language="es", beam_size=5)
    return " ".join(seg.text.strip() for seg in segments)
