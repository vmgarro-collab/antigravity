import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GROQ_API_KEY, HUGGINGFACE_TOKEN

from groq import Groq
import wave
import math
import tempfile

_client = Groq(api_key=GROQ_API_KEY)

MAX_BYTES = 24 * 1024 * 1024


def _split_wav(audio_path: str) -> list:
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


def _format_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _transcribe_with_diarization(audio_path: str) -> str:
    """faster-whisper para segmentos con timestamps + pyannote para speakers."""
    from faster_whisper import WhisperModel
    from core.agents.diarizer import diarize, assign_speaker

    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments_gen, info = model.transcribe(
        audio_path, language="es", beam_size=5,
        vad_filter=True, vad_parameters={"min_silence_duration_ms": 500},
    )
    segments = list(segments_gen)

    diarization = diarize(audio_path)

    lines = []
    current_speaker = None
    current_start = None
    buffer = []

    def flush():
        if buffer and current_start is not None:
            lines.append(f"**[{_format_ts(current_start)}] {current_speaker}:** {' '.join(buffer)}")
        buffer.clear()

    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
        speaker = assign_speaker(seg.start, seg.end, diarization)
        if speaker != current_speaker:
            flush()
            current_speaker = speaker
            current_start = seg.start
        buffer.append(text)

    flush()
    return "\n\n".join(lines)


def transcribe_chunk(audio_path: str) -> str:
    """Transcribe con diarización si hay token HF, si no usa Groq simple."""
    if HUGGINGFACE_TOKEN:
        try:
            return _transcribe_with_diarization(audio_path)
        except Exception as e:
            print(f"[diarization failed, fallback to Groq] {e}")

    # Fallback: Groq Whisper sin diarización
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
