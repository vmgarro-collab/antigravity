---
name: AIgor v1 Design
description: Orquestador local de agentes de IA con grabación, transcripción en tiempo real y generación de minutas
type: project
---

# AIgor v1 — Spec de Diseño

## Visión

AIgor es un orquestador local de agentes de IA que vive en `AntiGravity/AIgor/`. Primera versión: grabadora de audio con transcripción progresiva (faster-whisper local) y generación de minutas (Gemini 2.0 Flash). Arquitectura diseñada para escalar a nuevos agentes, LLMs e integraciones (correo, Teams, etc.) sin reescribir el núcleo.

Coexiste con Recorder/ y Planner/ sin tocarlos.

## Estructura de carpetas

```
AntiGravity/
└── AIgor/
    ├── core/
    │   ├── main.py              ← FastAPI server (puerto 8765)
    │   ├── agents/
    │   │   ├── __init__.py
    │   │   ├── transcriber.py   ← faster-whisper en local
    │   │   └── summarizer.py    ← LLM router, provider intercambiable
    │   ├── config.py            ← carga .env con python-dotenv
    │   └── requirements.txt
    ├── ui/
    │   ├── index.html
    │   ├── app.js
    │   └── styles.css
    ├── .env                     ← API keys locales (en .gitignore)
    ├── .gitignore
    └── launcher.bat             ← doble clic → arranca servidor + navegador
```

## Backend (FastAPI)

### Endpoints

| Endpoint | Método | Input | Output |
|---|---|---|---|
| `GET /health` | GET | — | `{ status: "ok" }` |
| `POST /transcribe` | POST | audio WAV (multipart) | `{ text: "..." }` |
| `POST /summarize` | POST | `{ text: "...", style: "minutas" }` | `{ result: "..." }` |

### `transcriber.py`

- Modelo: `faster-whisper` medium (descarga automática ~1.5GB primer uso)
- Idioma forzado: español
- Recibe chunk WAV de ~8s, devuelve texto del chunk
- Sin red, sin coste, 100% local

### `summarizer.py`

- Interfaz: `summarize(text: str, provider: str = "gemini") -> str`
- Provider actual: Gemini 2.0 Flash via `google-generativeai` SDK
- Prompt sistema en español, orientado a minutas de reunión
- Extensible: añadir Claude, GPT-4o u Ollama sin cambiar los endpoints

### `config.py`

Lee `.env`:
```
GEMINI_API_KEY=...
# ANTHROPIC_API_KEY=...  ← descomentado cuando esté disponible
# OPENAI_API_KEY=...
LLM_PROVIDER=gemini
WHISPER_MODEL=medium
```

## Frontend (UI)

Misma estética glassmorphism de AntiGravity (fondo `#0a0a0f`, blur, neon).

**Flujo de pantallas:**
1. **IDLE** — botón "Iniciar grabación"
2. **RECORDING** — visualizador de audio, transcripción aparece chunk a chunk progresivamente, botón "Detener"
3. **RESULTS** — transcripción completa, botón "Generar minutas", botón "Nueva grabación"
4. **SUMMARIZING** — spinner mientras Gemini procesa
5. **MINUTAS** — resultado renderizado en markdown, botón "Copiar", botón "Nueva grabación"

**Comunicación con backend:**
- Cada 8s de grabación → `POST /transcribe` con el chunk de audio
- El texto devuelto se acumula visualmente en tiempo real
- "Generar minutas" → `POST /summarize` con la transcripción acumulada

## launcher.bat

```bat
@echo off
cd /d %~dp0
start "" python core/main.py
timeout /t 3 /nobreak > nul
start http://localhost:8765
```

Doble clic desde el explorador de Windows → servidor FastAPI arranca → navegador se abre en la UI.

## Setup inicial (una sola vez)

```bash
cd AIgor
pip install -r core/requirements.txt
# Editar .env con GEMINI_API_KEY
# Doble clic en launcher.bat
```

`requirements.txt`:
```
fastapi
uvicorn
faster-whisper
google-generativeai
python-dotenv
python-multipart
```

## Escalabilidad futura

- **Nuevos agentes**: añadir fichero en `core/agents/` + endpoint en `main.py`
- **Nuevos LLMs**: añadir provider en `summarizer.py` + variable en `.env`
- **Nuevas integraciones** (Teams, correo, Graph): nuevos agentes con sus propios módulos
- **UI multi-herramienta**: `index.html` puede crecer a SPA con rutas por herramienta

## Restricciones

- Python 3.14+ instalado en el sistema
- Sin build step — vanilla JS en el frontend
- API keys solo en `.env` local, nunca al repositorio
- Primer uso de faster-whisper descarga el modelo (~1.5GB), después es offline
- Red de Accenture bloquea Anthropic API — usar Gemini con cuenta personal
