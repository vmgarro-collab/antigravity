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
