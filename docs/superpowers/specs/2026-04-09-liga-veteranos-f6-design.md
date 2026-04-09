# Liga Veteranos F-6 — Design Spec
Date: 2026-04-09

## Overview

A new vanilla JS web app (`/F-6/`) within the AntiGravity project that lets users browse the full liga veteranos from [LeagueRepublic](https://artificialfsala.leaguerepublic.com/index.html): clasificación, resultados, goleadores, calendario, y estadísticas individuales de jugador.

Data is scraped from LeagueRepublic via a local Python proxy using Playwright (headless Chromium) because the site has bot protection and renders content dynamically via JavaScript/AJAX.

---

## Architecture

### File Structure

```
AntiGravity/
└── F-6/
    ├── index.html     — main UI (single page, 5 tabs, glassmorphism dark theme)
    ├── styles.css     — styles matching Recorder/Planner palette
    ├── app.js         — tab navigation, fetch calls, DOM rendering
    └── server.py      — combined static file server + LeagueRepublic proxy
```

### server.py

Single Python script launched with `python server.py`. Runs on `localhost:8080`.

**Dependencies:**
```bash
pip install playwright beautifulsoup4
playwright install chromium
```

**Responsibilities:**
1. Serve static files from `/F-6/` directory
2. Proxy and parse LeagueRepublic pages using Playwright (headless Chromium), returning clean JSON
3. Add CORS headers so the frontend can fetch from `localhost`
4. Cache responses in memory for 5 minutes to avoid hammering LeagueRepublic

**Scraping approach:** Playwright opens the LeagueRepublic page, waits for the dynamic content to load (network idle or specific DOM element), then BeautifulSoup parses the rendered HTML to extract table data.

### Frontend

Vanilla JS, no build system, no framework. Dependencies via CDN (Lucide icons). Runs from `http://localhost:8080`.

---

## API Endpoints (proxy)

All endpoints scrape LeagueRepublic and return JSON. Responses cached 5 minutes in-memory.

### `GET /api/clasificacion`
Returns league standings table.

**Response:**
```json
[
  { "pos": 1, "equipo": "Nombre Equipo", "pj": 10, "g": 7, "e": 2, "p": 1, "gf": 30, "gc": 12, "pts": 23 }
]
```

### `GET /api/resultados`
Returns played matches grouped by jornada.

**Response:**
```json
[
  {
    "jornada": 5,
    "fecha": "2026-03-15",
    "local": "Equipo A", "golesLocal": 3,
    "visitante": "Equipo B", "golesVisitante": 1
  }
]
```

### `GET /api/goleadores`
Returns top scorers ranking.

**Response:**
```json
[
  { "pos": 1, "jugador": "Nombre Jugador", "equipo": "Equipo A", "goles": 12 }
]
```

### `GET /api/calendario`
Returns upcoming fixtures.

**Response:**
```json
[
  { "jornada": 11, "fecha": "2026-04-20", "hora": "18:00", "local": "Equipo A", "visitante": "Equipo B" }
]
```

### `GET /api/jugador?nombre=X`
Returns individual player stats. Searches by name (case-insensitive partial match).

**Response:**
```json
{ "jugador": "Nombre Jugador", "equipo": "Equipo A", "partidos": 10, "goles": 7 }
```

---

## Frontend — UI Design

### Navigation

Five tabs across the top of the page:
- Clasificación
- Resultados
- Goleadores
- Calendario
- Jugador

Active tab highlighted with neon accent color. On load, Clasificación is shown by default.

### Tab: Clasificación

Full standings table with columns: Pos / Equipo / PJ / G / E / P / GF / GC / Pts.

Clicking on a team name navigates to the **Jugador** tab and pre-filters by that team (shows all players from that team if the API supports it, otherwise searches by team name).

### Tab: Resultados

List of played matches grouped by jornada. Each jornada is a collapsible section header. Within each jornada, match cards show: Local — marcador — Visitante, with the score centered and visually prominent.

### Tab: Goleadores

Numbered ranking list. Each row: rank badge + player name + team + goal count. Top 3 get gold/silver/bronze accent on the rank badge.

### Tab: Calendario

List of upcoming fixtures. Each card shows: date + time + Local vs Visitante. If a match is today, it shows a "HOY" badge in neon green.

### Tab: Jugador

Search box (text input). As user types (debounced 300ms), calls `/api/jugador?nombre=X` and displays a player card with available stats. If LeagueRepublic exposes individual player pages, show: name, team, matches played, goals scored. If not, the proxy falls back to filtering the goleadores data by name, showing: name, team, goals.

### Aesthetics

- Background: `#0a0a0f`
- Glassmorphism cards: `backdrop-filter: blur(12px)`, semi-transparent dark background
- Neon accent palette (same as Recorder/Planner): purple/blue/green neons
- Icons: Lucide (CDN) — call `lucide.createIcons()` after any DOM mutation adding `data-lucide` attributes
- Fully in Spanish
- Loading spinner shown while fetching data
- Error state shown if proxy is not running (with message "Arranca server.py primero")

---

## Error Handling

- If `/api/*` returns non-200: show error card in the tab content area
- If LeagueRepublic page structure changes (scrape fails): server returns `{ "error": "No se pudo extraer los datos" }` with HTTP 502
- Cache TTL expired + scrape fails: serve stale cache with a warning header

---

## Running Locally

```bash
cd F-6
python server.py
# Open: http://localhost:8080
```
