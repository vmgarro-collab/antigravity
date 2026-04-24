import sys
import os
import tempfile

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
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name
    try:
        text = transcribe_chunk(tmp_path)
    finally:
        os.unlink(tmp_path)
    return {"text": text}


class SummarizeRequest(BaseModel):
    text: str
    style: str = "minutas"


@app.post("/summarize")
def summarize_endpoint(req: SummarizeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")
    result = summarize(req.text)
    return {"result": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=False)
