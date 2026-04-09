# Liga Veteranos F-6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vanilla JS web app in `/F-6/` that shows standings, results, top scorers, fixtures, and player stats for the liga veteranos scraped from LeagueRepublic via a Playwright proxy.

**Architecture:** `server.py` runs on `localhost:8080`, serves static files and proxies LeagueRepublic with Playwright (headless Chromium) + BeautifulSoup, caching responses 5 minutes. The frontend (`index.html` + `app.js` + `styles.css`) is vanilla JS with 5 tabs and glassmorphism dark theme.

**Tech Stack:** Python 3, Playwright, BeautifulSoup4, `http.server`, vanilla JS, Lucide icons CDN.

---

## File Map

| File | Responsibility |
|---|---|
| `F-6/server.py` | Static file server + Playwright proxy + in-memory cache |
| `F-6/index.html` | Single-page app shell: head, tab nav, 5 tab panels |
| `F-6/styles.css` | Glassmorphism dark theme, tabs, tables, cards, spinner |
| `F-6/app.js` | Tab switching, fetch + render for each tab, debounced search |

---

## Task 1: Discover LeagueRepublic URL structure

Before writing any scraper, we need to know the exact URLs and HTML structure. This is a manual discovery step.

**Files:** none created yet

- [ ] **Step 1: Open the site in browser DevTools**

  Open `https://artificialfsala.leaguerepublic.com/index.html` in Chrome/Firefox. Open DevTools → Network tab. Click through the navigation links (Clasificación, Resultados, Goleadores, Calendario). Note:
  - The exact URLs for each section (e.g. `/l/standings.html`, `/l/results.html`)
  - Whether data loads via XHR/fetch calls or is rendered server-side
  - If XHR: note the API endpoints, response format, and any required headers/cookies
  - If server-rendered: note the table CSS classes/IDs

- [ ] **Step 2: Note the structure**

  Record findings in a comment at the top of `server.py` (added in Task 2). You'll need:
  - URL for standings page
  - URL for results page
  - URL for top scorers page
  - URL for fixtures/calendar page
  - CSS selector or table index for each data table

---

## Task 2: server.py — static server + skeleton

**Files:**
- Create: `F-6/server.py`

- [ ] **Step 1: Install dependencies**

```bash
pip install playwright beautifulsoup4
playwright install chromium
```

- [ ] **Step 2: Create server.py skeleton**

Create `F-6/server.py`:

```python
#!/usr/bin/env python3
"""
Liga Veteranos F-6 — proxy server
Serves static files from F-6/ and proxies LeagueRepublic via Playwright.

LeagueRepublic URLs (fill in from DevTools discovery in Task 1):
  Clasificación : https://artificialfsala.leaguerepublic.com/l/standings.html
  Resultados    : https://artificialfsala.leaguerepublic.com/l/results.html
  Goleadores    : https://artificialfsala.leaguerepublic.com/l/topScorers.html
  Calendario    : https://artificialfsala.leaguerepublic.com/l/fixtures.html
  Jugador       : filtered from goleadores data
"""

import json
import os
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

# ---------------------------------------------------------------------------
# In-memory cache: { endpoint_key: (timestamp, data) }
# ---------------------------------------------------------------------------
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 300  # 5 minutes

def cache_get(key):
    with _cache_lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        ts, data = entry
        if time.time() - ts > CACHE_TTL:
            return None  # expired
        return data

def cache_set(key, data):
    with _cache_lock:
        _cache[key] = (time.time(), data)

def cache_get_stale(key):
    """Return stale data if present (used as fallback when scrape fails)."""
    with _cache_lock:
        entry = _cache.get(key)
        return entry[1] if entry else None

# ---------------------------------------------------------------------------
# Playwright scraper
# ---------------------------------------------------------------------------
def fetch_page_html(url: str) -> str:
    """Open URL with Playwright, wait for network idle, return rendered HTML."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        html = page.content()
        browser.close()
        return html

# ---------------------------------------------------------------------------
# Parsers (fill selectors after Task 1 discovery)
# ---------------------------------------------------------------------------
LR_BASE = "https://artificialfsala.leaguerepublic.com"

def scrape_clasificacion() -> list:
    html = fetch_page_html(f"{LR_BASE}/l/standings.html")
    soup = BeautifulSoup(html, "html.parser")
    # TODO after Task 1: adjust selector to match actual table
    table = soup.find("table")
    if not table:
        raise ValueError("No standings table found")
    rows = table.find_all("tr")[1:]  # skip header
    result = []
    for i, row in enumerate(rows, start=1):
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 8:
            continue
        result.append({
            "pos": i,
            "equipo": cols[0],
            "pj": int(cols[1] or 0),
            "g":  int(cols[2] or 0),
            "e":  int(cols[3] or 0),
            "p":  int(cols[4] or 0),
            "gf": int(cols[5] or 0),
            "gc": int(cols[6] or 0),
            "pts": int(cols[7] or 0),
        })
    return result

def scrape_resultados() -> list:
    html = fetch_page_html(f"{LR_BASE}/l/results.html")
    soup = BeautifulSoup(html, "html.parser")
    # TODO after Task 1: adjust selectors
    result = []
    jornada = 1
    for table in soup.find_all("table"):
        for row in table.find_all("tr")[1:]:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 4:
                continue
            result.append({
                "jornada": jornada,
                "fecha": cols[0],
                "local": cols[1],
                "golesLocal": int(cols[2].split("-")[0]) if "-" in cols[2] else 0,
                "golesVisitante": int(cols[2].split("-")[1]) if "-" in cols[2] else 0,
                "visitante": cols[3],
            })
        jornada += 1
    return result

def scrape_goleadores() -> list:
    html = fetch_page_html(f"{LR_BASE}/l/topScorers.html")
    soup = BeautifulSoup(html, "html.parser")
    # TODO after Task 1: adjust selectors
    table = soup.find("table")
    if not table:
        raise ValueError("No scorers table found")
    rows = table.find_all("tr")[1:]
    result = []
    for i, row in enumerate(rows, start=1):
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 3:
            continue
        result.append({
            "pos": i,
            "jugador": cols[0],
            "equipo": cols[1],
            "goles": int(cols[2] or 0),
        })
    return result

def scrape_calendario() -> list:
    html = fetch_page_html(f"{LR_BASE}/l/fixtures.html")
    soup = BeautifulSoup(html, "html.parser")
    # TODO after Task 1: adjust selectors
    result = []
    jornada = 1
    for table in soup.find_all("table"):
        for row in table.find_all("tr")[1:]:
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 3:
                continue
            fecha_hora = cols[0].split(" ")
            result.append({
                "jornada": jornada,
                "fecha": fecha_hora[0] if fecha_hora else cols[0],
                "hora": fecha_hora[1] if len(fecha_hora) > 1 else "",
                "local": cols[1],
                "visitante": cols[2],
            })
        jornada += 1
    return result

# ---------------------------------------------------------------------------
# API handler helper
# ---------------------------------------------------------------------------
ENDPOINTS = {
    "/api/clasificacion": ("clasificacion", scrape_clasificacion),
    "/api/resultados":    ("resultados",    scrape_resultados),
    "/api/goleadores":    ("goleadores",    scrape_goleadores),
    "/api/calendario":    ("calendario",    scrape_calendario),
}

def handle_api(path: str, query: dict) -> tuple[int, dict | list]:
    if path == "/api/jugador":
        nombre = query.get("nombre", [""])[0].lower()
        goleadores = cache_get("goleadores")
        if goleadores is None:
            try:
                goleadores = scrape_goleadores()
                cache_set("goleadores", goleadores)
            except Exception as e:
                stale = cache_get_stale("goleadores")
                if stale:
                    return 200, [p for p in stale if nombre in p["jugador"].lower()]
                return 502, {"error": f"No se pudo extraer los datos: {e}"}
        matches = [p for p in goleadores if nombre in p["jugador"].lower()]
        return 200, matches

    if path not in ENDPOINTS:
        return 404, {"error": "Endpoint no encontrado"}

    cache_key, scraper = ENDPOINTS[path]
    cached = cache_get(cache_key)
    if cached is not None:
        return 200, cached

    try:
        data = scraper()
        cache_set(cache_key, data)
        return 200, data
    except Exception as e:
        stale = cache_get_stale(cache_key)
        if stale:
            return 200, stale  # serve stale, frontend unaware
        return 502, {"error": f"No se pudo extraer los datos: {e}"}

# ---------------------------------------------------------------------------
# HTTP request handler
# ---------------------------------------------------------------------------
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        if parsed.path.startswith("/api/"):
            status, body = handle_api(parsed.path, query)
            payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            super().do_GET()

    def log_message(self, format, *args):
        print(f"  {self.address_string()} - {format % args}")

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    server = HTTPServer(("", PORT), Handler)
    print(f"Liga Veteranos F-6 — http://localhost:{PORT}")
    print("Ctrl+C para parar")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado.")
```

- [ ] **Step 3: Smoke-test the server starts**

```bash
cd F-6
python server.py
```

Expected output:
```
Liga Veteranos F-6 — http://localhost:8080
Ctrl+C para parar
```

- [ ] **Step 4: Adjust scraper selectors based on Task 1 findings**

  Open each LeagueRepublic URL in browser, inspect the actual table HTML. Update the CSS selectors / column indices in each `scrape_*` function. Common patterns in LeagueRepublic:
  - Tables have class `leaguerepublic-table` or similar
  - Score column may be `3-1` or `3 - 1` format — adjust the split accordingly
  - Fixtures and results may be on the same page filtered by tab — adjust URL accordingly

- [ ] **Step 5: Test each API endpoint manually**

```bash
curl http://localhost:8080/api/clasificacion
curl http://localhost:8080/api/resultados
curl http://localhost:8080/api/goleadores
curl http://localhost:8080/api/calendario
curl "http://localhost:8080/api/jugador?nombre=garcia"
```

Each should return a JSON array (or object for jugador). If you get `{"error": ...}`, check the selector adjustments in Step 4.

- [ ] **Step 6: Commit**

```bash
git add F-6/server.py
git commit -m "feat: F-6 proxy server with Playwright scraper and 5-minute cache"
```

---

## Task 3: index.html — page shell and tab navigation

**Files:**
- Create: `F-6/index.html`

- [ ] **Step 1: Create index.html**

Create `F-6/index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Liga Veteranos</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">
        <i data-lucide="trophy"></i>
        Liga Veteranos
      </h1>
    </header>

    <nav class="tab-nav">
      <button class="tab-btn active" data-tab="clasificacion">
        <i data-lucide="list-ordered"></i>
        Clasificación
      </button>
      <button class="tab-btn" data-tab="resultados">
        <i data-lucide="flag"></i>
        Resultados
      </button>
      <button class="tab-btn" data-tab="goleadores">
        <i data-lucide="star"></i>
        Goleadores
      </button>
      <button class="tab-btn" data-tab="calendario">
        <i data-lucide="calendar"></i>
        Calendario
      </button>
      <button class="tab-btn" data-tab="jugador">
        <i data-lucide="user"></i>
        Jugador
      </button>
    </nav>

    <main class="tab-content">
      <div id="tab-clasificacion" class="tab-panel active">
        <div class="loading"><i data-lucide="loader-circle"></i> Cargando...</div>
      </div>
      <div id="tab-resultados" class="tab-panel">
        <div class="loading"><i data-lucide="loader-circle"></i> Cargando...</div>
      </div>
      <div id="tab-goleadores" class="tab-panel">
        <div class="loading"><i data-lucide="loader-circle"></i> Cargando...</div>
      </div>
      <div id="tab-calendario" class="tab-panel">
        <div class="loading"><i data-lucide="loader-circle"></i> Cargando...</div>
      </div>
      <div id="tab-jugador" class="tab-panel">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input id="jugador-input" type="text" placeholder="Buscar jugador..." autocomplete="off" />
        </div>
        <div id="jugador-results"></div>
      </div>
    </main>
  </div>

  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

  Open `http://localhost:8080` — you should see the header, 5 tab buttons, and "Cargando..." in the Clasificación panel. No data yet (app.js not written).

- [ ] **Step 3: Commit**

```bash
git add F-6/index.html
git commit -m "feat: F-6 HTML shell with 5-tab navigation"
```

---

## Task 4: styles.css — glassmorphism dark theme

**Files:**
- Create: `F-6/styles.css`

- [ ] **Step 1: Create styles.css**

Create `F-6/styles.css`:

```css
:root {
  --bg-base: #0a0a0f;
  --bg-surface: rgba(25, 25, 35, 0.6);
  --bg-surface-hover: rgba(40, 40, 55, 0.8);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --text-primary: #ffffff;
  --text-secondary: #9494a0;
  --primary-color: #7928ca;
  --secondary-color: #ff0080;
  --accent-color: #00dfd8;
  --green-neon: #00ff88;
  --gold: #ffd700;
  --silver: #c0c0c0;
  --bronze: #cd7f32;
  --font-family: 'Inter', sans-serif;
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-full: 9999px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-family);
  background-color: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
  background-image:
    radial-gradient(circle at 15% 50%, rgba(121, 40, 202, 0.15), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(0, 223, 216, 0.1), transparent 25%);
}

.app-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.app-header { display: flex; align-items: center; gap: 12px; }
.app-title {
  font-size: 1.6rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
}
.app-title svg { width: 28px; height: 28px; stroke: var(--accent-color); }

/* Tabs */
.tab-nav {
  display: flex;
  gap: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 6px;
  backdrop-filter: blur(12px);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.tab-btn svg { width: 14px; height: 14px; }
.tab-btn:hover { color: var(--text-primary); background: var(--bg-surface-hover); }
.tab-btn.active {
  color: var(--text-primary);
  background: linear-gradient(135deg, rgba(121,40,202,0.4), rgba(0,223,216,0.2));
  border: 1px solid rgba(121,40,202,0.5);
}

/* Tab panels */
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* Loading & error */
.loading, .error-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px;
  color: var(--text-secondary);
  font-size: 0.95rem;
}
.error-card { color: var(--secondary-color); }
@keyframes spin { to { transform: rotate(360deg); } }
.loading svg { animation: spin 1s linear infinite; }

/* Glass card */
.glass-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  padding: 20px;
}

/* Tables */
.tabla-wrapper { overflow-x: auto; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
thead th {
  padding: 10px 12px;
  text-align: left;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
}
thead th.center, tbody td.center { text-align: center; }
tbody tr { transition: background 0.15s; }
tbody tr:hover { background: var(--bg-surface-hover); }
tbody td {
  padding: 12px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}
.equipo-link {
  color: var(--accent-color);
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}
.equipo-link:hover { text-decoration: underline; }

/* Resultados */
.jornada-section { margin-bottom: 20px; }
.jornada-header {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  padding: 8px 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.jornada-header:hover { color: var(--text-primary); }
.partido-card {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  backdrop-filter: blur(12px);
}
.partido-equipo-local { text-align: right; font-weight: 500; }
.partido-equipo-visitante { text-align: left; font-weight: 500; }
.partido-marcador {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent-color);
  padding: 6px 14px;
  background: rgba(0,223,216,0.1);
  border-radius: var(--radius-md);
  white-space: nowrap;
}
.partido-fecha { font-size: 0.75rem; color: var(--text-secondary); }

/* Goleadores */
.goleador-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  backdrop-filter: blur(12px);
}
.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
}
.rank-badge.gold   { background: rgba(255,215,0,0.2);   color: var(--gold); }
.rank-badge.silver { background: rgba(192,192,192,0.2); color: var(--silver); }
.rank-badge.bronze { background: rgba(205,127,50,0.2);  color: var(--bronze); }
.goleador-nombre { flex: 1; font-weight: 600; }
.goleador-equipo { color: var(--text-secondary); font-size: 0.85rem; }
.goleador-goles {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-color);
  min-width: 36px;
  text-align: right;
}

/* Calendario */
.fixture-card {
  display: grid;
  grid-template-columns: 140px 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  backdrop-filter: blur(12px);
}
.fixture-fecha { color: var(--text-secondary); font-size: 0.82rem; }
.fixture-local { text-align: right; font-weight: 500; }
.fixture-visitante { font-weight: 500; }
.fixture-vs {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.8rem;
  text-align: center;
}
.hoy-badge {
  background: rgba(0,255,136,0.15);
  color: var(--green-neon);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(0,255,136,0.3);
}

/* Jugador search */
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  backdrop-filter: blur(12px);
  margin-bottom: 16px;
}
.search-box svg { color: var(--text-secondary); width: 18px; height: 18px; flex-shrink: 0; }
.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 1rem;
}
.search-box input::placeholder { color: var(--text-secondary); }
.jugador-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  backdrop-filter: blur(12px);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.jugador-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.jugador-info { flex: 1; }
.jugador-nombre { font-weight: 600; font-size: 1rem; margin-bottom: 2px; }
.jugador-equipo { color: var(--text-secondary); font-size: 0.85rem; }
.jugador-stats {
  display: flex;
  gap: 20px;
  text-align: center;
}
.stat-item .stat-val {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-color);
}
.stat-item .stat-lbl {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 2: Verify styling in browser**

  Reload `http://localhost:8080` — header and tab nav should be styled with dark glassmorphism theme.

- [ ] **Step 3: Commit**

```bash
git add F-6/styles.css
git commit -m "feat: F-6 glassmorphism dark theme styles"
```

---

## Task 5: app.js — tab switching + Clasificación tab

**Files:**
- Create: `F-6/app.js`

- [ ] **Step 1: Create app.js with tab logic and clasificación renderer**

Create `F-6/app.js`:

```js
// Liga Veteranos F-6

lucide.createIcons();

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function switchTab(tabName) {
  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  if (!loadedTabs.has(tabName)) {
    loadTab(tabName);
  }
}

const loadedTabs = new Set();

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------
async function apiFetch(endpoint) {
  const res = await fetch(`http://localhost:8080${endpoint}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function showError(panelId, msg) {
  document.getElementById(panelId).innerHTML =
    `<div class="error-card"><i data-lucide="triangle-alert"></i> ${msg}</div>`;
  lucide.createIcons();
}

// ---------------------------------------------------------------------------
// Tab loaders
// ---------------------------------------------------------------------------
async function loadTab(tabName) {
  loadedTabs.add(tabName);
  switch (tabName) {
    case 'clasificacion': return loadClasificacion();
    case 'resultados':    return loadResultados();
    case 'goleadores':    return loadGoleadores();
    case 'calendario':    return loadCalendario();
    // jugador is search-driven, no initial load
  }
}

// ---------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------
async function loadClasificacion() {
  const panel = document.getElementById('tab-clasificacion');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando clasificación...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/clasificacion');
    panel.innerHTML = `
      <div class="glass-card tabla-wrapper">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Equipo</th>
              <th class="center">PJ</th>
              <th class="center">G</th>
              <th class="center">E</th>
              <th class="center">P</th>
              <th class="center">GF</th>
              <th class="center">GC</th>
              <th class="center">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td class="center">${row.pos}</td>
                <td>
                  <span class="equipo-link" onclick="buscarEquipo('${escHtml(row.equipo)}')">
                    ${escHtml(row.equipo)}
                  </span>
                </td>
                <td class="center">${row.pj}</td>
                <td class="center">${row.g}</td>
                <td class="center">${row.e}</td>
                <td class="center">${row.p}</td>
                <td class="center">${row.gf}</td>
                <td class="center">${row.gc}</td>
                <td class="center"><strong>${row.pts}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    lucide.createIcons();
  } catch (e) {
    const msg = e.message.includes('Failed to fetch')
      ? 'Arranca server.py primero'
      : e.message;
    showError('tab-clasificacion', msg);
  }
}

function buscarEquipo(nombre) {
  document.getElementById('jugador-input').value = nombre;
  switchTab('jugador');
  buscarJugador(nombre);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

- [ ] **Step 2: Test clasificación tab in browser**

  Open `http://localhost:8080`. The Clasificación tab should load and show the standings table. If you see "Arranca server.py primero", make sure `server.py` is running. If you see a scrape error, go back to Task 2 Step 4 and adjust selectors.

- [ ] **Step 3: Commit**

```bash
git add F-6/app.js
git commit -m "feat: F-6 app.js with tab switching and clasificacion renderer"
```

---

## Task 6: app.js — Resultados, Goleadores, Calendario tabs

**Files:**
- Modify: `F-6/app.js`

- [ ] **Step 1: Append resultados renderer to app.js**

Append to `F-6/app.js`:

```js
// ---------------------------------------------------------------------------
// Resultados
// ---------------------------------------------------------------------------
async function loadResultados() {
  const panel = document.getElementById('tab-resultados');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando resultados...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/resultados');
    // Group by jornada
    const byJornada = {};
    data.forEach(m => {
      if (!byJornada[m.jornada]) byJornada[m.jornada] = [];
      byJornada[m.jornada].push(m);
    });
    const html = Object.entries(byJornada).reverse().map(([jornada, partidos]) => `
      <div class="jornada-section">
        <div class="jornada-header" onclick="toggleJornada(this)">
          <i data-lucide="chevron-down"></i>
          Jornada ${jornada}
        </div>
        <div class="jornada-body">
          ${partidos.map(p => `
            <div class="partido-card">
              <div class="partido-equipo-local">${escHtml(p.local)}</div>
              <div class="partido-marcador">${p.golesLocal} – ${p.golesVisitante}</div>
              <div class="partido-equipo-visitante">${escHtml(p.visitante)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    panel.innerHTML = html || '<div class="loading">No hay resultados aún</div>';
    lucide.createIcons();
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Arranca server.py primero' : e.message;
    showError('tab-resultados', msg);
  }
}

function toggleJornada(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('[data-lucide]');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  icon.setAttribute('data-lucide', isOpen ? 'chevron-right' : 'chevron-down');
  lucide.createIcons();
}

// ---------------------------------------------------------------------------
// Goleadores
// ---------------------------------------------------------------------------
async function loadGoleadores() {
  const panel = document.getElementById('tab-goleadores');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando goleadores...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/goleadores');
    const medalClass = (pos) => pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
    panel.innerHTML = data.map(g => `
      <div class="goleador-row">
        <div class="rank-badge ${medalClass(g.pos)}">${g.pos}</div>
        <div class="goleador-nombre">${escHtml(g.jugador)}</div>
        <div class="goleador-equipo">${escHtml(g.equipo)}</div>
        <div class="goleador-goles">${g.goles} ⚽</div>
      </div>
    `).join('') || '<div class="loading">No hay datos de goleadores</div>';
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Arranca server.py primero' : e.message;
    showError('tab-goleadores', msg);
  }
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------
async function loadCalendario() {
  const panel = document.getElementById('tab-calendario');
  panel.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Cargando calendario...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch('/api/calendario');
    const today = new Date().toISOString().slice(0, 10);
    panel.innerHTML = data.map(f => {
      const isToday = f.fecha === today;
      return `
        <div class="fixture-card">
          <div class="fixture-fecha">
            ${isToday ? '<span class="hoy-badge">HOY</span> ' : ''}
            ${escHtml(f.fecha)} ${f.hora ? escHtml(f.hora) : ''}
          </div>
          <div class="fixture-local">${escHtml(f.local)}</div>
          <div class="fixture-vs">vs</div>
          <div class="fixture-visitante">${escHtml(f.visitante)}</div>
        </div>`;
    }).join('') || '<div class="loading">No hay partidos próximos</div>';
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Arranca server.py primero' : e.message;
    showError('tab-calendario', msg);
  }
}
```

- [ ] **Step 2: Test all three tabs in browser**

  Click Resultados → Goleadores → Calendario tabs. Each should load data. Verify jornada headers are collapsible. Verify gold/silver/bronze badges on top 3 goleadores.

- [ ] **Step 3: Commit**

```bash
git add F-6/app.js
git commit -m "feat: F-6 resultados, goleadores and calendario tab renderers"
```

---

## Task 7: app.js — Jugador tab with debounced search

**Files:**
- Modify: `F-6/app.js`

- [ ] **Step 1: Append jugador search to app.js**

Append to `F-6/app.js`:

```js
// ---------------------------------------------------------------------------
// Jugador (debounced search)
// ---------------------------------------------------------------------------
let jugadorTimer = null;

document.getElementById('jugador-input').addEventListener('input', (e) => {
  clearTimeout(jugadorTimer);
  const q = e.target.value.trim();
  if (q.length < 2) {
    document.getElementById('jugador-results').innerHTML = '';
    return;
  }
  jugadorTimer = setTimeout(() => buscarJugador(q), 300);
});

async function buscarJugador(nombre) {
  const results = document.getElementById('jugador-results');
  results.innerHTML = '<div class="loading"><i data-lucide="loader-circle"></i> Buscando...</div>';
  lucide.createIcons();
  try {
    const data = await apiFetch(`/api/jugador?nombre=${encodeURIComponent(nombre)}`);
    if (!Array.isArray(data) || data.length === 0) {
      results.innerHTML = '<div class="loading">No se encontró ningún jugador</div>';
      return;
    }
    results.innerHTML = data.map(j => {
      const inicial = (j.jugador || '?')[0].toUpperCase();
      return `
        <div class="jugador-card">
          <div class="jugador-avatar">${escHtml(inicial)}</div>
          <div class="jugador-info">
            <div class="jugador-nombre">${escHtml(j.jugador)}</div>
            <div class="jugador-equipo">${escHtml(j.equipo)}</div>
          </div>
          <div class="jugador-stats">
            <div class="stat-item">
              <div class="stat-val">${j.goles ?? '—'}</div>
              <div class="stat-lbl">Goles</div>
            </div>
            ${j.partidos != null ? `
            <div class="stat-item">
              <div class="stat-val">${j.partidos}</div>
              <div class="stat-lbl">Partidos</div>
            </div>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    const msg = e.message.includes('Failed to fetch') ? 'Arranca server.py primero' : e.message;
    results.innerHTML = `<div class="error-card"><i data-lucide="triangle-alert"></i> ${msg}</div>`;
    lucide.createIcons();
  }
}

// ---------------------------------------------------------------------------
// Initial load
// ---------------------------------------------------------------------------
loadTab('clasificacion');
```

- [ ] **Step 2: Test jugador tab**

  Click Jugador tab. Type a player name (at least 2 characters). After 300ms, player cards should appear. Click a team name in Clasificación → should switch to Jugador tab and search for that team.

- [ ] **Step 3: Commit**

```bash
git add F-6/app.js
git commit -m "feat: F-6 jugador tab with debounced search and team link integration"
```

---

## Task 8: Final integration test and README comment

**Files:**
- No new files

- [ ] **Step 1: Full manual smoke test**

  With `server.py` running:
  1. Open `http://localhost:8080`
  2. Clasificación loads on startup — table shows teams with stats
  3. Click Resultados — partidos grouped by jornada, marcadores visible
  4. Click a jornada header — it collapses/expands
  5. Click Goleadores — ranked list, top 3 have gold/silver/bronze badges
  6. Click Calendario — upcoming fixtures; if any match is today, "HOY" badge shows
  7. Click Jugador — type 2+ chars, player cards appear after 300ms
  8. Click a team name in Clasificación — jumps to Jugador tab, auto-searches that team
  9. Stop server.py — reload page, click each tab → "Arranca server.py primero" shown

- [ ] **Step 2: Final commit**

```bash
git add F-6/
git commit -m "feat: Liga Veteranos F-6 app complete — proxy + 5-tab UI"
```
