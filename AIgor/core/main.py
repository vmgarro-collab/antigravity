import sys
import os
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.transcriber import transcribe_chunk
from agents.summarizer import summarize

MINUTAS_DIR = Path.home() / "Documents" / "AIgor" / "minutas"
MINUTAS_DIR.mkdir(parents=True, exist_ok=True)

_scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scheduler
    try:
        from scheduler import start_scheduler
        _scheduler = start_scheduler()
    except Exception as e:
        print(f"[scheduler] No se pudo arrancar: {e}")
    yield
    if _scheduler:
        _scheduler.shutdown()


app = FastAPI(title="AIgor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ui_path = os.path.join(os.path.dirname(__file__), '..', 'ui')
app.mount("/ui", StaticFiles(directory=ui_path, html=True), name="ui")


@app.get("/")
def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/ui/index.html")


@app.get("/health")
def health():
    return {"status": "ok"}


# ── Transcripción ──────────────────────────────────────────

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


# ── Outlook ────────────────────────────────────────────────

class EmailsRequest(BaseModel):
    folder: str = "Inbox"
    limit: int = 20
    sender: str = ""
    subject: str = ""


class DraftRequest(BaseModel):
    to: str
    subject: str
    body: str
    reply_to_id: str = ""


class DraftGenerateRequest(BaseModel):
    thread_context: str


def _outlook_error(e: Exception):
    raise HTTPException(status_code=503, detail=f"Outlook no disponible: {str(e)}")


@app.post("/outlook/emails")
def outlook_emails(req: EmailsRequest):
    try:
        from agents.outlook import get_emails
        return get_emails(
            folder=req.folder,
            limit=req.limit,
            sender=req.sender or None,
            subject_contains=req.subject or None,
        )
    except Exception as e:
        _outlook_error(e)


@app.get("/outlook/email/{entry_id:path}")
def outlook_email_thread(entry_id: str):
    try:
        from agents.outlook import get_thread
        return get_thread(entry_id)
    except Exception as e:
        _outlook_error(e)


@app.post("/outlook/draft")
def outlook_draft(req: DraftRequest):
    try:
        from agents.outlook import save_draft
        entry_id = save_draft(
            to=req.to,
            subject=req.subject,
            body=req.body,
            reply_to_id=req.reply_to_id or None,
        )
        return {"entry_id": entry_id, "status": "guardado en Drafts"}
    except Exception as e:
        _outlook_error(e)


@app.post("/outlook/draft/generate")
def outlook_draft_generate(req: DraftGenerateRequest):
    try:
        from agents.summarizer import generate_email_reply
        body = generate_email_reply(req.thread_context)
        return {"body": body}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/outlook/calendar/today")
def outlook_calendar_today():
    try:
        from agents.outlook import get_calendar_today
        return get_calendar_today()
    except Exception as e:
        _outlook_error(e)


@app.get("/outlook/calendar/week")
def outlook_calendar_week():
    try:
        from agents.outlook import get_calendar_week
        return get_calendar_week()
    except Exception as e:
        _outlook_error(e)


@app.post("/outlook/briefing/generate")
def outlook_briefing_generate():
    try:
        from scheduler import generate_briefing
        filepath = generate_briefing()
        content = filepath.read_text(encoding="utf-8")
        return {"result": content, "saved_to": str(filepath)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=False)
