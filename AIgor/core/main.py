import sys
import os
import tempfile
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.transcriber import transcribe_chunk
from agents.summarizer import summarize

app = FastAPI(title="AIgor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ui_path = os.path.join(os.path.dirname(__file__), '..', 'ui')
app.mount("/ui", StaticFiles(directory=ui_path, html=True), name="ui")

MINUTAS_DIR = Path.home() / "Documents" / "AIgor" / "minutas"
MINUTAS_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/ui/index.html")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    if not audio.filename.endswith(".wav"):
        raise HTTPException(status_code=400, detail="Solo se aceptan ficheros WAV")
    data = await audio.read()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        text = transcribe_chunk(tmp_path)
    finally:
        os.unlink(tmp_path)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    audio_saved = None
    try:
        from pydub import AudioSegment
        wav_tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        wav_tmp.write(data)
        wav_tmp.close()
        mp3_path = MINUTAS_DIR / f"grabacion_{timestamp}.mp3"
        AudioSegment.from_wav(wav_tmp.name).export(str(mp3_path), format="mp3", bitrate="64k")
        os.unlink(wav_tmp.name)
        audio_saved = str(mp3_path)
    except Exception:
        wav_path = MINUTAS_DIR / f"grabacion_{timestamp}.wav"
        wav_path.write_bytes(data)
        audio_saved = str(wav_path)

    return {"text": text, "audio_saved_to": audio_saved}


class SummarizeRequest(BaseModel):
    text: str


@app.post("/summarize")
def summarize_endpoint(req: SummarizeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    minutas = summarize(req.text)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filepath = MINUTAS_DIR / f"minuta_{timestamp}.md"
    content = f"{minutas}\n\n---\n\n## Transcripción completa\n\n{req.text}"
    filepath.write_text(content, encoding="utf-8")

    return {"result": minutas, "saved_to": str(filepath)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=False)
