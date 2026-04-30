# AIgor v2.1 — Panel de Control + Outlook + MCP

## Visión

AIgor evoluciona de grabadora de reuniones a panel de control personal. Sidebar con tres módulos: Grabación (existente), Correos y Calendario. Backend FastAPI amplificado con integración Outlook via COM. Servidor MCP paralelo para Claude Desktop. Scheduler con briefing diario a las 9:00.

## Restricciones conocidas

- Red Accenture bloquea Anthropic API y Azure OAuth → LLM sigue siendo Groq LLaMA-3.3-70b
- Outlook desktop debe estar abierto para que COM funcione
- Sin Graph API, sin autenticación corporativa — todo local via pywin32
- Python 3.14, sin build step en frontend

---

## Estructura de carpetas

```
AIgor/
├── core/
│   ├── main.py                  ← FastAPI (ampliar con rutas /outlook/*)
│   ├── mcp_server.py            ← nuevo: servidor MCP stdio para Claude Desktop
│   ├── scheduler.py             ← nuevo: APScheduler (job 9:00 briefing)
│   ├── agents/
│   │   ├── transcriber.py       ← existente
│   │   ├── summarizer.py        ← existente
│   │   ├── diarizer.py          ← existente
│   │   └── outlook.py           ← nuevo: wrapper COM para correos y calendario
│   ├── config.py                ← añadir CLAUDE_DESKTOP_READY flag
│   └── requirements.txt         ← añadir pywin32, apscheduler, mcp
├── ui/
│   ├── index.html               ← rediseño: sidebar + 3 módulos
│   ├── app.js                   ← refactor: módulo grabación + módulos correos/calendario
│   ├── outlook.js               ← nuevo: lógica UI correos y calendario
│   └── styles.css               ← ampliar: sidebar, cards de correo, agenda
├── briefings/                   ← directorio creado en runtime
├── claude_desktop_config.json   ← config lista para copiar a %APPDATA%\Claude\
├── .env
└── launcher.bat                 ← arrancar FastAPI + MCP server
```

---

## Backend — `outlook.py`

Wrapper `pywin32` COM. Outlook debe estar corriendo. Funciones principales:

```python
def get_emails(folder="Inbox", limit=20, sender=None, subject_contains=None) -> list[dict]
def get_thread(entry_id: str) -> list[dict]
def save_draft(to: str, subject: str, body: str, reply_to_id: str = None) -> str
def get_calendar_today() -> list[dict]
def get_calendar_week() -> list[dict]
def get_unread_urgent(hours_back: int = 24) -> list[dict]
def get_open_threads(days_back: int = 7, limit: int = 10) -> list[dict]
```

Cada correo devuelve: `{id, subject, sender, date, body_preview, is_read, has_attachments}`.
Cada reunión devuelve: `{id, subject, start, end, attendees, location, body_preview}`.

---

## Backend — nuevos endpoints FastAPI

```
POST /outlook/emails              body: {folder, limit, sender, subject}
GET  /outlook/email/{entry_id}    → hilo completo
POST /outlook/draft               body: {to, subject, body, reply_to_id?}
GET  /outlook/calendar/today      → reuniones de hoy
GET  /outlook/calendar/week       → reuniones de la semana
POST /outlook/briefing/generate   → genera briefing completo con LLaMA, lo guarda y notifica
```

El endpoint `POST /outlook/briefing/generate` es el mismo job que corre el scheduler a las 9:00. Llamable también desde la UI con un botón "Generar ahora".

---

## Backend — `scheduler.py`

APScheduler con BackgroundScheduler. Un solo job:

**09:00 diario:**
1. `get_calendar_today()` → lista de reuniones
2. Para cada reunión: `get_emails(sender=attendee)` últimos 7 días → contexto
3. `get_unread_urgent(hours_back=24)` → correos urgentes sin leer
4. `get_open_threads(days_back=7)` → hilos abiertos importantes
5. Todo concatenado → `summarize(text, style="briefing")` con prompt específico
6. Guardar en `~/Documents/AIgor/briefings/briefing_YYYY-MM-DD.md`
7. Notificación Windows via `win10toast` o `plyer`

El scheduler arranca junto con el FastAPI server en `main.py` (lifespan event).

---

## Backend — `mcp_server.py`

Servidor MCP stdio usando el SDK oficial `mcp` de Anthropic. Expone las mismas operaciones que los endpoints FastAPI pero como tools MCP:

```python
@mcp.tool()
def get_today_briefing() -> str

@mcp.tool()
def list_emails(folder: str, limit: int, sender: str = None) -> list

@mcp.tool()
def get_email_thread(entry_id: str) -> list

@mcp.tool()
def draft_reply(to: str, subject: str, body: str, reply_to_id: str = None) -> str

@mcp.tool()
def get_calendar_today() -> list

@mcp.tool()
def get_calendar_week() -> list

@mcp.tool()
def search_emails(query: str, days_back: int = 30) -> list
```

El MCP server importa directamente las funciones de `outlook.py` — no llama al FastAPI.

---

## Frontend — rediseño UI

### Layout

```
┌─────────────────────────────────────────────────┐
│  sidebar  │           contenido principal        │
│  ───────  │  ───────────────────────────────── │
│  🎙️  Grab │  [módulo activo]                    │
│  📧  Mail │                                     │
│  📅  Cal  │                                     │
└─────────────────────────────────────────────────┘
```

Sidebar fijo, 60px de ancho, iconos con tooltip. Fondo glassmorphism consistente con el resto.

### Módulo Grabación (`app.js` — sin cambios funcionales)

Idéntico al actual. Vistas: IDLE → RECORDING → TRANSCRIBING → SUMMARIZING → MINUTAS.

### Módulo Correos (`outlook.js`)

- Lista de correos con badge de no leídos
- Click en correo → hilo completo en panel derecho
- Botón "Pedir borrador a Claude" → llama a `/outlook/draft` con el hilo como contexto → muestra borrador → botón "Guardar en Drafts"
- Filtros: carpeta, remitente, proyecto (texto libre)

### Módulo Calendario (`outlook.js`)

- Vista de hoy: cards de reuniones con hora, asistentes, sala
- Botón "Generar briefing ahora" → llama a `POST /outlook/briefing/generate` → spinner → muestra resultado
- Vista de semana: lista compacta

---

## `claude_desktop_config.json`

Fichero listo para copiar a `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aigor": {
      "command": "python",
      "args": ["C:/Users/victor.m.garro.perez/Documents/AntiGravity/AIgor/core/mcp_server.py"],
      "env": {
        "PYTHONPATH": "C:/Users/victor.m.garro.perez/Documents/AntiGravity"
      }
    }
  }
}
```

---

## `launcher.bat` actualizado

```bat
@echo off
cd /d %~dp0
echo Cerrando instancia anterior...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8765') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak > nul
echo Iniciando AIgor FastAPI...
start "" python core/main.py
echo El MCP server lo gestiona Claude Desktop automaticamente.
timeout /t 3 /nobreak > nul
start http://localhost:8765
```

El MCP server lo arranca Claude Desktop directamente via stdio cuando se necesita — no es un proceso persistente.

---

## Prompt briefing (añadir a `summarizer.py`)

```python
BRIEFING_PROMPT = """Eres AIgor, asistente personal de Víctor. Genera un briefing diario conciso en español.

Estructura EXACTA:

# Briefing — {fecha}

## Tu día
<lista de reuniones con hora, asistentes clave, y una línea de contexto por reunión>

## Correos urgentes sin leer
<máximo 5, con remitente, asunto y una línea de resumen>

## Hilos abiertos que necesitan atención
<máximo 5, con remitente, asunto y estado>

## Resumen ejecutivo
<3-4 frases: qué es prioritario hoy, qué está pendiente, qué hay que decidir>

Reglas: solo hechos de la información proporcionada. No inventes. Conciso."""
```

---

## Dependencias nuevas

```
pywin32
apscheduler
mcp
plyer
```

---

## Fuera de scope v2.1

- Clasificación automática de bandeja (17:00) → v2.2
- Memoria SQLite + embeddings → v2.2
- Captura audio Teams loopback → v2.3
- WhatsApp → v2.4+
