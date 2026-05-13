import sys
import os
import json
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.transcriber import transcribe_chunk
from agents.summarizer import summarize

_AIGOR_DATA = Path.home() / "OneDrive - Accenture" / "Todos" / "AntiGravity" / "AIgor"
MINUTAS_DIR = _AIGOR_DATA / "minutas"
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

    return {"text": text}


class SummarizeRequest(BaseModel):
    text: str
    name: str = ""  # optional filename stem for saving


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


@app.post("/summarize/stream")
async def summarize_stream_endpoint(req: SummarizeRequest):
    from fastapi.responses import StreamingResponse
    from agents.summarizer import summarize_stream

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    transcript = req.text
    import re
    safe_name = re.sub(r'[^\w\s\-]', '', req.name).strip().replace(' ', '_')[:80] if req.name else ""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    file_stem = f"minuta_{safe_name}" if safe_name else f"minuta_{timestamp}"

    def generate():
        full_text = ""
        try:
            for chunk in summarize_stream(transcript):
                full_text += chunk
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
            filepath = MINUTAS_DIR / f"{file_stem}.md"
            content = f"{full_text}\n\n---\n\n## Transcripción completa\n\n{transcript}"
            filepath.write_text(content, encoding="utf-8")
            yield f"data: {json.dumps({'done': True, 'saved_to': str(filepath)})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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
    mode: str = "reply"  # "reply" | "summary"


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


@app.post("/outlook/emails/summarize")
def outlook_emails_summarize(req: EmailsRequest):
    try:
        from agents.outlook import get_emails
        from agents.summarizer import summarize_emails
        emails = get_emails(
            folder=req.folder,
            limit=req.limit,
            sender=req.sender or None,
            subject_contains=req.subject or None,
        )
        summary = summarize_emails(emails)
        return {"emails": emails, "summary": summary}
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
        if req.mode == "summary":
            from agents.summarizer import _llm
            body = _llm(
                "Eres AIgor. Resume este hilo de correo en 3-5 frases en español: qué se discute, qué está pendiente, si requiere acción. Directo, sin preámbulos.",
                req.thread_context,
            )
        else:
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



@app.post("/onenote/open")
def onenote_open():
    import os
    os.startfile('onenote:')
    return {"status": "ok"}


@app.post("/recording/save-wav")
async def recording_save_wav(audio: UploadFile = File(...), name: str = Form("grabacion")):
    import re
    safe = re.sub(r'[^\w\s\-]', '', name).strip().replace(' ', '_')[:80] or 'grabacion'
    data = await audio.read()
    path = MINUTAS_DIR / f"{safe}.wav"
    path.write_bytes(data)
    return {"saved_to": str(path)}


class RenameRequest(BaseModel):
    minutas_path: str = ""
    audio_path: str = ""
    new_name: str


class VaultEntryCreate(BaseModel):
    name: str
    url: str
    username: str
    password: str
    notes: str = ""


class VaultEntryUpdate(BaseModel):
    name: str = ""
    url: str = ""
    username: str = ""
    password: str = ""
    notes: str = ""


@app.post("/recording/rename")
def recording_rename(req: RenameRequest):
    import re
    # Sanitize: only keep alphanumeric, spaces, hyphens, underscores
    safe = re.sub(r'[^\w\s\-]', '', req.new_name).strip().replace(' ', '_')[:80]
    if not safe:
        raise HTTPException(status_code=400, detail="Nombre inválido")

    result = {}

    def rename_file(old_path: str, suffix: str) -> str:
        if not old_path:
            return ''
        p = Path(old_path)
        if not p.exists():
            return old_path
        # Keep original date prefix (e.g. "minuta_2026-04-30_10-30") + append description
        stem = p.stem  # e.g. "minuta_2026-04-30_10-30"
        new_stem = f"{stem}_{safe}"
        new_p = p.parent / f"{new_stem}{suffix}"
        if new_p.exists() and new_p != p:
            new_p = p.parent / f"{new_stem}_2{suffix}"
        p.rename(new_p)
        return str(new_p)

    result['minutas_path'] = rename_file(req.minutas_path, '.md')
    result['audio_path'] = rename_file(req.audio_path, Path(req.audio_path).suffix if req.audio_path else '')
    return result


# ── Dashboard ──────────────────────────────────────────────

@app.get("/dashboard/tasks")
def dashboard_tasks():
    try:
        from agents.tasks import sync_tasks
        return sync_tasks(MINUTAS_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TaskPatch(BaseModel):
    done: bool


@app.patch("/dashboard/tasks/{task_id}")
def dashboard_task_update(task_id: str, req: TaskPatch):
    try:
        from agents.tasks import update_task
        t = update_task(MINUTAS_DIR, task_id, req.done)
        if not t:
            raise HTTPException(status_code=404, detail="Tarea no encontrada")
        return t
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/dashboard/briefing/stream")
async def dashboard_briefing_stream():
    from fastapi.responses import StreamingResponse

    def build_context() -> str:
        parts = []
        try:
            from agents.outlook import get_calendar_today
            meetings = get_calendar_today()
            if meetings:
                lines = [f"- {m['start']}-{m['end']} {m['subject']} (con: {m.get('organizer','')})" for m in meetings]
                parts.append("## Reuniones de hoy\n" + "\n".join(lines))
        except Exception:
            pass
        try:
            from agents.outlook import get_emails
            emails = get_emails(folder="Inbox", limit=15)
            if emails:
                lines = [f"- {e['sender']} | {e['subject']} | {e.get('body_preview','')[:100]}" for e in emails]
                parts.append("## Correos recientes\n" + "\n".join(lines))
        except Exception:
            pass
        try:
            from agents.tasks import sync_tasks
            tasks = sync_tasks(MINUTAS_DIR)
            pending = [t for t in tasks if not t['done']]
            if pending:
                lines = [f"- [{t['source_title']}] {t['text']} (resp: {t['responsible']}, fecha: {t['deadline']})" for t in pending[:30]]
                parts.append("## Tareas pendientes\n" + "\n".join(lines))
        except Exception:
            pass
        return "\n\n".join(parts) or "Sin datos disponibles."

    BRIEFING_SYSTEM = """Eres AIgor, asistente personal de Víctor. Genera un briefing diario conciso en español.

Estructura EXACTA (markdown):

## Tu día
<reuniones con hora y breve contexto por reunión>

## Urgente
<correos o tareas que requieren acción hoy, máximo 5>

## Entregables pendientes
<tareas con fecha límite próxima o sin fecha pero explícitamente comprometidas>

## Radar
<cosas para no perder de vista aunque no sean urgentes>

## Resumen ejecutivo
<3-4 frases: qué es prioritario, qué está en riesgo, qué hay que decidir>

Reglas: solo hechos de la información proporcionada. No inventes. Conciso. Sin preámbulos."""

    def generate():
        ctx = build_context()
        from datetime import date
        system = BRIEFING_SYSTEM + f"\n\nFecha de hoy: {date.today().isoformat()}"
        try:
            import anthropic
            client = anthropic.Anthropic()
            with client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=2048,
                temperature=0.2,
                system=system,
                messages=[{"role": "user", "content": f"DATOS DEL DÍA:\n{ctx}"}],
            ) as stream:
                for chunk in stream.text_stream:
                    yield f"data: {json.dumps({'delta': chunk})}\n\n"
        except Exception as e:
            from agents.summarizer import _llm
            try:
                text = _llm(system, f"DATOS DEL DÍA:\n{ctx}")
                yield f"data: {json.dumps({'delta': text})}\n\n"
            except Exception as e2:
                yield f"data: {json.dumps({'error': str(e2)})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Vault ──────────────────────────────────────────────────

@app.get("/vault/entries")
def vault_list():
    try:
        from agents.vault import list_entries
        return list_entries()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vault/entries/{entry_id}/password")
def vault_get_password(entry_id: str):
    try:
        from agents.vault import get_password
        return {"password": get_password(entry_id)}
    except KeyError:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/vault/entries", status_code=201)
def vault_create(req: VaultEntryCreate):
    try:
        from agents.vault import create_entry
        return create_entry(req.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/vault/entries/{entry_id}")
def vault_update(entry_id: str, req: VaultEntryUpdate):
    try:
        from agents.vault import update_entry
        return update_entry(entry_id, req.model_dump(exclude_unset=True))
    except KeyError:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/vault/entries/{entry_id}", status_code=204)
def vault_delete(entry_id: str):
    try:
        from agents.vault import delete_entry
        delete_entry(entry_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/vault/entries/{entry_id}/launch")
def vault_launch(entry_id: str):
    try:
        import webbrowser
        import time
        import threading
        import pyautogui
        import pyperclip
        from agents.vault import list_entries, get_password
        entries = list_entries()
        entry = next((e for e in entries if e['id'] == entry_id), None)
        if not entry:
            raise HTTPException(status_code=404, detail="Entrada no encontrada")
        password = get_password(entry_id)

        def _autofill():
            time.sleep(3)
            pyperclip.copy(entry['username'])
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.15)
            pyautogui.press('tab')
            time.sleep(0.15)
            pyperclip.copy(password)
            pyautogui.hotkey('ctrl', 'v')
            # clear clipboard after 30s
            time.sleep(30)
            try:
                pyperclip.copy('')
            except Exception:
                pass

        webbrowser.open(entry['url'])
        threading.Thread(target=_autofill, daemon=True).start()
        return {"status": "ok", "url": entry['url']}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=False)
