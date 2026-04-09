# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AntiGravity** is a dual-module AI productivity suite: two independent, vanilla JS web apps with no build system. All dependencies are CDN-loaded. Both apps work from `file://` and are fully localized in Spanish.

- **Recorder/** — NeuroScribe: AI meeting recorder (Groq Whisper + LLaMA)
- **Planner/** — Outlook Flow: Calendar with Microsoft Graph sync or local fallback
- **CTA/** — Empty (reserved)

## Running Locally

No build step. Serve statically:

```bash
python -m http.server 8000
# Then open: http://localhost:8000/Recorder/index.html
#             http://localhost:8000/Planner/index.html
```

No linter, no test suite. Manual testing only.

## Architecture

### Recorder (`/Recorder`)

**Files:** `app.js` (core logic), `db.js` (IndexedDB), `index.html`, `styles.css`

**Flow:**
1. `init()` → `initDB()` + `loadHistory()` (populate sidebar from IndexedDB)
2. `startRecording()` → MediaRecorder (WebM/Opus @ 24kbps) + Web Audio visualizer
3. `stopRecordingAndTranscribe()` → Save blob to IndexedDB → `performRealTranscription(blob)`
4. `performRealTranscription()` → POST to Groq Whisper → transcript saved to `rawTranscriptText` global + persisted
5. `triggerAiAction(type)` → POST to Groq LLaMA → renders markdown result

**External APIs:**
- Groq Whisper: `https://api.groq.com/openai/v1/audio/transcriptions` — model `whisper-large-v3-turbo`, forced `language: 'es'`
- Groq LLaMA: `https://api.groq.com/openai/v1/chat/completions` — model `llama-3.3-70b-versatile`, temp 0.2

**Key globals:** `currentState`, `rawTranscriptText`, `currentRecordingId`, `audioBlob`, `mediaRecorder`, `groqApiKeyMemory`

**State machine:** `IDLE → RECORDING → TRANSCRIBING → RESULTS` — views are `.view` divs toggled via `.active` class.

**IndexedDB (NeuroScribeDB, store: `recordings`):**
```js
{ id: timestamp, title, dateLabel, audioBlob, audioUrl (data URL), mimeType, transcript? }
```

**File:// compatibility:** `localStorage` may be blocked → API key falls back to `groqApiKeyMemory`. Blobs use data URLs (not `blob://`). Native `prompt()` used for API key input.

**Audio:** Records compressed WebM/Ogg. WAV conversion happens only at export via Web Audio API decoding.

**Icons:** Lucide — must call `lucide.createIcons()` after any DOM mutation that adds `data-lucide` attributes.

---

### Planner (`/Planner`)

**Files:** `auth.js` (MSAL), `graph.js` (Graph API), `calendar.js` (FullCalendar), `index.html`, `styles.css`

**Mode selection at startup** (in `calendar.js`):
- Check `localStorage.is_local_mode` and `localStorage.outlook_client_id`
- **Local mode:** Skip auth, load `localStorage.local_events` → `saveLocalEvents()` on all changes
- **Cloud mode:** `initAuth()` → MSAL login → `getGraphClient()` → `fetchOutlookEvents()` → on change: `updateOutlookEvent()` / `createOutlookEvent()`

**External APIs:**
- MSAL v2.35: `https://alcdn.msauth.net/browser/2.35.0/js/msal-browser.min.js`
- Microsoft Graph: `GET/PATCH/POST /me/events` — scopes: `["User.Read", "Calendars.ReadWrite"]`
- FullCalendar v6.1.11 + Microsoft Graph Client — all via CDN

**Key globals:** `msalInstance`, `graphClient`, `calendar`, `isLocalMode`

**`isLocalMode` boolean gates all sync paths** — every event handler checks this flag before deciding whether to call Graph API or localStorage.

**localStorage schema:**
```js
// Cloud mode config
outlook_client_id, outlook_tenant_id, microsoft_account, is_local_mode

// Local mode events
local_events: JSON array of { id, title, start, end }  // ISO8601 datetimes
```

**Azure first-run setup:** Setup modal prompts for Client ID + Tenant ID → saves to localStorage → page reloads.

**Calendar config:** Week view (Monday start), 7 AM–9 PM, Spanish locale (`locale: 'es'`), drag-drop + resize + click-to-create enabled.

---

## Key Conventions

- **Spanish-first:** All UI strings, alerts, API prompts are hardcoded in Spanish. No i18n library.
- **No modal library:** Hidden `<div>` elements toggled with inline `style="display:none/block"`.
- **No backend:** Both apps call external APIs directly from the browser. Groq key is user-provided and stored unencrypted in localStorage.
- **Scripts loaded at end of `<body>`** with no `defer`/`async` — execution order matters.
- **Glassmorphism UI:** `backdrop-filter: blur()`, dark base (`#0a0a0f`), neon accent palette.
