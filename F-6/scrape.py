#!/usr/bin/env python3
"""
Scraper de Liga Veteranos — ejecutado por GitHub Actions cada hora.
Guarda los resultados en F-6/data/*.json
"""

import json
import os
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
}

BASE = "https://artificialfsala.leaguerepublic.com"
URL_STANDINGS  = f"{BASE}/standingsForDate/950925790/2/-1/-1.html"
URL_STATS      = f"{BASE}/playerStats/890842856/1_950925790.html"
URL_MATCHHUB   = f"{BASE}/matchHub/890842856/-1_-1/-1/-1/-1/-1/-1/false.html"

OUT_DIR = os.path.join(os.path.dirname(__file__), "data")

# ---------------------------------------------------------------------------

def get(url):
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    return r.text

def n(v):
    try: return int(v)
    except: return 0

# ---------------------------------------------------------------------------

def scrape_clasificacion():
    soup = BeautifulSoup(get(URL_STANDINGS), "lxml")
    table = soup.find("table")
    if not table:
        raise ValueError("No standings table")
    result = []
    for i, row in enumerate(table.find_all("tr")[1:], start=1):
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 8:
            continue
        team_td = row.find("td", class_=lambda c: c and "highlight" in c)
        equipo = team_td.get_text(strip=True) if team_td else cols[0]
        result.append({
            "pos": i, "equipo": equipo,
            "pj": n(cols[1]), "g": n(cols[2]), "e": n(cols[3]), "p": n(cols[4]),
            "gf": n(cols[5]), "gc": n(cols[6]), "pts": n(cols[7]),
        })
    return result

# ---------------------------------------------------------------------------

def _detect_col_indices(header_row):
    """
    Inspect <th> cells to map column names → indices.
    Returns dict with keys: jugador, equipo, goles, partidos (or None if not found).
    Falls back to heuristic defaults if headers are ambiguous.
    """
    ths = [th.get_text(strip=True).lower() for th in header_row.find_all("th")]
    print(f"  [debug] header cols: {ths}")

    def find(keywords):
        for i, h in enumerate(ths):
            if any(k in h for k in keywords):
                return i
        return None

    jugador_i  = find(["jugador", "player", "nombre", "name"])
    equipo_i   = find(["equipo", "team", "club"])
    goles_i    = find(["goles", "goals", "gol"])
    partidos_i = find(["partidos", "played", "pj", "pg"])

    # Fallback defaults if headers are missing / unrecognised
    if jugador_i  is None: jugador_i  = 1
    if equipo_i   is None: equipo_i   = 2
    if goles_i    is None: goles_i    = 3
    if partidos_i is None: partidos_i = 6

    print(f"  [debug] col map → jugador:{jugador_i} equipo:{equipo_i} goles:{goles_i} partidos:{partidos_i}")
    return jugador_i, equipo_i, goles_i, partidos_i


def scrape_jugadores():
    result = []
    page = 1
    seen_names = set()
    col_map = None  # detected once from page 1 headers

    while True:
        url = f"{BASE}/playerStats/890842856/{page}_950925790.html"
        print(f"  Fetching page {page}: {url}")
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            print(f"  Status: {r.status_code}")
            if r.status_code != 200:
                break
        except Exception as e:
            print(f"  Error fetching page {page}: {e}")
            break

        soup = BeautifulSoup(r.text, "lxml")
        table = soup.find("table")
        if not table:
            print(f"  No table on page {page}, stopping.")
            break

        rows = table.find_all("tr")
        print(f"  Rows on page {page}: {len(rows)}")

        # Detect column indices from the first header row we encounter
        if col_map is None:
            header_row = next((r for r in rows if r.find("th")), None)
            if header_row:
                col_map = _detect_col_indices(header_row)
            else:
                col_map = (1, 2, 3, 6)  # hard fallback

        jugador_i, equipo_i, goles_i, partidos_i = col_map

        added_this_page = 0
        for row in rows:
            if row.find("th"):
                continue
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 3:
                continue
            jugador = cols[jugador_i] if jugador_i < len(cols) else ""
            if not jugador or jugador in seen_names:
                continue
            seen_names.add(jugador)
            equipo   = cols[equipo_i]   if equipo_i   < len(cols) else ""
            goles    = n(cols[goles_i]) if goles_i    < len(cols) else 0
            partidos = n(cols[partidos_i]) if partidos_i < len(cols) else None
            result.append({
                "pos":      len(result) + 1,
                "jugador":  jugador,
                "equipo":   equipo,
                "goles":    goles,
                "partidos": partidos,
            })
            added_this_page += 1

        print(f"  Added {added_this_page} players from page {page}")
        if added_this_page == 0:
            break
        page += 1
        if page > 20:
            break

    return result


# ---------------------------------------------------------------------------

URL_PARAGUAS = f"{BASE}/playerStatsForTeam/890842856/565913747.html"

def scrape_paraguas():
    """
    Scrape the EL PARAGUAS team-specific stats page and return a list of players
    in the same format as scrape_jugadores() rows.
    """
    print(f"  Fetching Paraguas page: {URL_PARAGUAS}")
    try:
        r = requests.get(URL_PARAGUAS, headers=HEADERS, timeout=20)
        print(f"  Status: {r.status_code}")
        if r.status_code != 200:
            return []
    except Exception as e:
        print(f"  Error: {e}")
        return []

    soup = BeautifulSoup(r.text, "lxml")
    table = soup.find("table")
    if not table:
        print("  No table found on Paraguas page.")
        return []

    rows = table.find_all("tr")
    print(f"  Rows on Paraguas page: {len(rows)}")

    # Detect headers
    header_row = next((row for row in rows if row.find("th")), None)
    if header_row:
        jugador_i, equipo_i, goles_i, partidos_i = _detect_col_indices(header_row)
    else:
        jugador_i, equipo_i, goles_i, partidos_i = 1, 2, 3, 6

    result = []
    for row in rows:
        if row.find("th"):
            continue
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 3:
            continue
        jugador = cols[jugador_i] if jugador_i < len(cols) else ""
        if not jugador:
            continue
        equipo   = cols[equipo_i]      if equipo_i   < len(cols) else "EL PARAGUAS"
        goles    = n(cols[goles_i])    if goles_i    < len(cols) else 0
        partidos = n(cols[partidos_i]) if partidos_i < len(cols) else None
        result.append({
            "jugador":  jugador,
            "equipo":   equipo or "EL PARAGUAS",
            "goles":    goles,
            "partidos": partidos,
        })

    print(f"  Paraguas players found: {len(result)}")
    return result

# ---------------------------------------------------------------------------

def get_match_date_urls():
    soup = BeautifulSoup(get(URL_MATCHHUB), "lxml")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "matchHub" in href and "year" in href:
            if not href.startswith("http"):
                href = BASE + href
            links.append(href)
    return list(dict.fromkeys(links))

def parse_fecha(url):
    m = re.search(r"year(\d+)_month(\d+)_day(\d+)", url)
    if not m:
        return None, None
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return f"{str(d).zfill(2)}/{str(mo).zfill(2)}/{y}", datetime(y, mo, d)

def parse_score(text):
    m = re.search(r"(\d+)\s*-\s*(\d+)", text)
    return (int(m.group(1)), int(m.group(2))) if m else None

def scrape_matches_from_page(html, jornada, fecha):
    soup = BeautifulSoup(html, "lxml")
    played, upcoming = [], []
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            tds = row.find_all("td")
            if len(tds) < 3:
                continue
            row_text = row.get_text()
            # Time
            hora = ""
            tm = re.search(r"(\d{1,2}:\d{2})", row_text)
            if tm:
                hora = tm.group(1)
            # Score (played)
            score_td = next((td for td in tds if re.search(r"\d+\s*-\s*\d+", td.get_text())), None)
            if score_td:
                score = parse_score(score_td.get_text(strip=True))
                if score:
                    idx = tds.index(score_td)
                    local     = tds[idx-1].get_text(strip=True) if idx > 0 else ""
                    visitante = tds[idx+1].get_text(strip=True) if idx+1 < len(tds) else ""
                    if local or visitante:
                        played.append({
                            "jornada": jornada, "fecha": fecha,
                            "local": local, "golesLocal": score[0],
                            "golesVisitante": score[1], "visitante": visitante,
                        })
                continue
            # VS (upcoming)
            vs_td = next((td for td in tds if re.search(r"\bVS\b", td.get_text(), re.IGNORECASE)), None)
            if vs_td:
                idx = tds.index(vs_td)
                local     = tds[idx-1].get_text(strip=True) if idx > 0 else ""
                visitante = tds[idx+1].get_text(strip=True) if idx+1 < len(tds) else ""
                if local or visitante:
                    upcoming.append({
                        "jornada": jornada, "fecha": fecha, "hora": hora,
                        "local": local, "visitante": visitante,
                    })
    return played, upcoming

def scrape_resultados_y_calendario():
    date_urls = get_match_date_urls()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    resultados, calendario = [], []
    for jornada, url in enumerate(date_urls, start=1):
        fecha_str, fecha_dt = parse_fecha(url)
        if not fecha_str:
            continue
        try:
            html = get(url)
        except Exception as e:
            print(f"  ⚠ Skipping {url}: {e}")
            continue
        played, upcoming = scrape_matches_from_page(html, jornada, fecha_str)
        if fecha_dt < today:
            resultados.extend(played)
        else:
            calendario.extend(upcoming)
    return resultados, calendario

# ---------------------------------------------------------------------------

def save(name, data):
    path = os.path.join(OUT_DIR, f"{name}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {name}.json — {len(data)} registros")

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Scraping clasificación...")
    save("clasificacion", scrape_clasificacion())

    print("Scraping jugadores...")
    jugadores = scrape_jugadores()

    print("Scraping Paraguas team players...")
    paraguas_players = scrape_paraguas()
    existing_names = {j["jugador"] for j in jugadores}
    added = 0
    for p in paraguas_players:
        if p["jugador"] not in existing_names:
            p["pos"] = len(jugadores) + 1
            jugadores.append(p)
            existing_names.add(p["jugador"])
            added += 1
    if added:
        print(f"  Merged {added} Paraguas players not in main list.")

    save("goleadores", jugadores)
    save("jugador", jugadores)  # same data, searched client-side

    print("Scraping partidos (matchHub)...")
    resultados, calendario = scrape_resultados_y_calendario()
    save("resultados", resultados)
    save("calendario", calendario)

    # Timestamp
    ts = {"actualizado": datetime.now().strftime("%d/%m/%Y %H:%M")}
    save("meta", [ts])
    print("Done.")

if __name__ == "__main__":
    main()
