#!/usr/bin/env python3
"""
Liga Veteranos F-6 — proxy server
Serves static files from F-6/ and proxies LeagueRepublic via Playwright.

LeagueRepublic URLs (confirmed from browser):
  Clasificación   : https://artificialfsala.leaguerepublic.com/standingsForDate/950925790/2/-1/-1.html
  Jugadores/Goles : https://artificialfsala.leaguerepublic.com/playerStats/890842856/1_950925790.html
  Resultados/Cal  : https://artificialfsala.leaguerepublic.com/matchHub.html
                    + per-date pages: /matchHub/890842856/-1_-1/-1/-1/-1/year{Y}_month{M}_day{D}/-1/false.html

IDs:
  League/group ID   : 950925790
  Competition ID    : 890842856
"""

import json
import os
import re
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

LR_BASE        = "https://artificialfsala.leaguerepublic.com"
LR_COMPETITION = "890842856"
LR_DIVISION    = "950925790"

URL_CLASIFICACION = f"{LR_BASE}/standingsForDate/{LR_DIVISION}/2/-1/-1.html"
URL_PLAYER_STATS  = f"{LR_BASE}/playerStats/{LR_COMPETITION}/1_{LR_DIVISION}.html"
URL_MATCH_HUB     = f"{LR_BASE}/matchHub.html"

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

def fetch_pages_html(urls: list[str]) -> list[str]:
    """Fetch multiple URLs in one browser session for efficiency."""
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for url in urls:
            try:
                page = browser.new_page()
                page.goto(url, wait_until="networkidle", timeout=30000)
                results.append(page.content())
                page.close()
            except Exception:
                results.append("")
        browser.close()
    return results

# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def scrape_clasificacion() -> list:
    """
    Page: /standingsForDate/950925790/2/-1/-1.html
    Table headers: # | [team] | J | V | E | D | GA | GC | DG | PTS | ...
    Cols (0-indexed td): 0=#, 1=equipo(link), 2=J, 3=V, 4=E, 5=D, 6=GA, 7=GC, 8=DG, 9=PTS
    Team name is inside <a> within td.left.highlight
    """
    html = fetch_page_html(URL_CLASIFICACION)
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError("No standings table found")

    result = []
    rows = table.find_all("tr")
    pos = 0
    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 8:
            continue
        # Team name: td with class containing 'left' and 'highlight', text from <a>
        equipo_td = row.find("td", class_=lambda c: c and "left" in c and "highlight" in c)
        equipo = ""
        if equipo_td:
            a = equipo_td.find("a")
            equipo = a.get_text(strip=True) if a else equipo_td.get_text(strip=True)
        if not equipo:
            continue
        pos += 1

        def safe_int(td_list, idx):
            try:
                return int(td_list[idx].get_text(strip=True) or 0)
            except (ValueError, IndexError):
                return 0

        result.append({
            "pos": pos,
            "equipo": equipo,
            "pj": safe_int(cols, 2),
            "g":  safe_int(cols, 3),
            "e":  safe_int(cols, 4),
            "p":  safe_int(cols, 5),
            "gf": safe_int(cols, 6),
            "gc": safe_int(cols, 7),
            "dg": safe_int(cols, 8),
            "pts": safe_int(cols, 9),
        })
    return result


def _parse_match_hub_page(html: str, fecha: str) -> list:
    """
    Parse a single matchHub date page.
    Row structure: td.right.wrap (local) | td.highlight.nowrap or td (score/VS) | td.left.wrap (visitante)
    Score text: "2 - 1" (played) or contains "VS" (not played yet).
    """
    soup = BeautifulSoup(html, "html.parser")
    matches = []

    for row in soup.find_all("tr", attrs={"data-match-href": True}):
        cols = row.find_all("td")
        if len(cols) < 3:
            continue

        # Local team: first td (right wrap)
        local_td = cols[0]
        local_a = local_td.find("a")
        local = local_a.get_text(strip=True) if local_a else local_td.get_text(strip=True)

        # Score: second td
        score_td = cols[1]
        score_text = score_td.get_text(strip=True)

        # Visitante: third td
        vis_td = cols[2]
        vis_a = vis_td.find("a")
        visitante = vis_a.get_text(strip=True) if vis_a else vis_td.get_text(strip=True)

        if not local or not visitante:
            continue

        # Determine if played
        score_match = re.search(r"(\d+)\s*-\s*(\d+)", score_text)
        if score_match:
            goles_local = int(score_match.group(1))
            goles_visitante = int(score_match.group(2))
            jugado = True
        else:
            goles_local = None
            goles_visitante = None
            jugado = False

        # Extract time from time-heading span (look in th above the row)
        hora = ""
        table = row.find_parent("table")
        if table:
            time_span = table.find("span", class_="time-heading")
            if time_span:
                hora = time_span.get_text(strip=True)

        matches.append({
            "fecha": fecha,
            "hora": hora,
            "local": local,
            "visitante": visitante,
            "golesLocal": goles_local,
            "golesVisitante": goles_visitante,
            "jugado": jugado,
        })
    return matches


def _get_match_hub_dates() -> list[str]:
    """
    Fetch matchHub.html and extract all date URLs for this competition.
    Returns list of relative paths like /matchHub/890842856/-1_-1/...
    """
    html = fetch_page_html(URL_MATCH_HUB)
    soup = BeautifulSoup(html, "html.parser")
    pattern = re.compile(rf"/matchHub/{LR_COMPETITION}/")
    links = []
    seen = set()
    for a in soup.find_all("a", href=pattern):
        href = a["href"]
        if href not in seen:
            seen.add(href)
            links.append(href)
    return links


def _date_from_match_hub_url(url: str) -> str:
    """Extract human-readable date from URL like .../year2025_month10_day18/..."""
    m = re.search(r"year(\d+)_month(\d+)_day(\d+)", url)
    if m:
        y, mo, d = m.group(1), m.group(2), m.group(3)
        return f"{d.zfill(2)}/{mo.zfill(2)}/{y}"
    return ""


def _scrape_all_matches() -> list:
    """Fetch all match dates and parse them. Results and fixtures combined."""
    date_paths = _get_match_hub_dates()
    if not date_paths:
        return []

    urls = [f"{LR_BASE}{p}" for p in date_paths]
    htmls = fetch_pages_html(urls)

    all_matches = []
    jornada = 0
    for path, html in zip(date_paths, htmls):
        if not html:
            continue
        fecha = _date_from_match_hub_url(path)
        matches = _parse_match_hub_page(html, fecha)
        if matches:
            jornada += 1
            for m in matches:
                m["jornada"] = jornada
            all_matches.extend(matches)
    return all_matches


def scrape_resultados() -> list:
    """Return only played matches (jugado=True)."""
    all_matches = cache_get("all_matches")
    if all_matches is None:
        all_matches = _scrape_all_matches()
        cache_set("all_matches", all_matches)
    return [m for m in all_matches if m.get("jugado")]


def scrape_calendario() -> list:
    """Return only upcoming matches (jugado=False)."""
    all_matches = cache_get("all_matches")
    if all_matches is None:
        all_matches = _scrape_all_matches()
        cache_set("all_matches", all_matches)
    return [m for m in all_matches if not m.get("jugado")]


def scrape_goleadores() -> list:
    """
    Page: /playerStats/890842856/1_950925790.html
    Table columns: POS | Jugadores | Equipo | Goals | Red Cards | Yellow Cards | Nº Partidos
    td indices (0-based): 0=pos, 1=jugador(link), 2=equipo(link), 3=goals, 4=red, 5=yellow, 6=partidos
    """
    html = fetch_page_html(URL_PLAYER_STATS)
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError("No player stats table found")

    result = []
    for row in table.find_all("tr"):
        cols = row.find_all("td")
        if len(cols) < 4:
            continue

        # pos: td.fixed-col (first td)
        try:
            pos = int(cols[0].get_text(strip=True) or 0)
        except ValueError:
            continue
        if pos == 0:
            continue

        # jugador: td.fixed-col.left.highlight
        jugador_td = row.find("td", class_=lambda c: c and "fixed-col" in c and "left" in c)
        jugador = ""
        if jugador_td:
            a = jugador_td.find("a")
            jugador = a.get_text(strip=True) if a else jugador_td.get_text(strip=True)

        # equipo: td.left (not fixed-col)
        equipo_td = row.find("td", class_=lambda c: c and "left" in c and "fixed-col" not in c)
        equipo = ""
        if equipo_td:
            a = equipo_td.find("a")
            equipo = a.get_text(strip=True) if a else equipo_td.get_text(strip=True)

        def safe_int_col(idx):
            try:
                return int(cols[idx].get_text(strip=True) or 0)
            except (ValueError, IndexError):
                return 0

        result.append({
            "pos": pos,
            "jugador": jugador,
            "equipo": equipo,
            "goles": safe_int_col(3),
            "tarjetasRojas": safe_int_col(4),
            "tarjetasAmarillas": safe_int_col(5),
            "partidos": safe_int_col(6),
        })
    return result

# ---------------------------------------------------------------------------
# API handler helper
# ---------------------------------------------------------------------------
ENDPOINTS = {
    "/api/clasificacion": ("clasificacion", scrape_clasificacion),
    "/api/goleadores":    ("goleadores",    scrape_goleadores),
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

    if path in ("/api/resultados", "/api/calendario"):
        try:
            data = scrape_resultados() if path == "/api/resultados" else scrape_calendario()
            return 200, data
        except Exception as e:
            stale = cache_get_stale("all_matches")
            if stale:
                if path == "/api/resultados":
                    return 200, [m for m in stale if m.get("jugado")]
                else:
                    return 200, [m for m in stale if not m.get("jugado")]
            return 502, {"error": f"No se pudo extraer los datos: {e}"}

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
            return 200, stale
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
