import os
import sys
import math
import wave

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import HUGGINGFACE_TOKEN


def diarize(audio_path: str) -> object:
    """Ejecuta pyannote diarización. Devuelve el objeto Annotation."""
    from pyannote.audio import Pipeline
    import torch

    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=HUGGINGFACE_TOKEN,
    )
    pipeline.to(torch.device("cpu"))
    return pipeline(audio_path)


def assign_speaker(start: float, end: float, diarization) -> str:
    overlaps = {}
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        overlap = max(0.0, min(end, turn.end) - max(start, turn.start))
        if overlap > 0:
            overlaps[speaker] = overlaps.get(speaker, 0.0) + overlap
    if not overlaps:
        return "SPEAKER_??"
    return max(overlaps, key=overlaps.get)


def format_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"
