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
URL_STATS      = "https://artificialfsala.leaguerepublic.com/playerStats/890842856.html"
URL_MATCHHUB   = f"{BASE}/matchHub/890842856/-1_-1/-1/-1/-1/-1/-1/false.html"

OUT_DIR = os.path.join(os.path.dirname(__file__), "data")

# ---------------------------------------------------------------------------

_session = None

def _get_session():
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update(HEADERS)
        # Visit home page first to pick up any session cookies
        try:
            _session.get(BASE, timeout=10)
        except Exception:
            pass
    return _session

def get(url):
    r = _get_session().get(url, headers={"Referer": BASE + "/"}, timeout=20)
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


URL_PARAGUAS = "https://artificialfsala.leaguerepublic.com/playerStatsForTeam/890842856/565913747.html"
PARAGUAS_NAME = "paraguas"  # lowercase match

def _parse_player_table(html, equipo_paraguas=False):
    soup = BeautifulSoup(html, "lxml")
    result = []
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue
        # Try <th> first, fall back to first <tr>'s <td> as headers
        header_row = rows[0]
        headers = [th.get_text(strip=True).lower() for th in header_row.find_all("th")]
        if not headers:
            headers = [td.get_text(strip=True).lower() for td in header_row.find_all("td")]
        data_rows = rows[1:] if headers else rows

        print(f"  Table headers: {headers[:8]}")

        def col(keywords):
            for kw in keywords:
                for i, h in enumerate(headers):
                    if kw in h:
                        return i
            return None

        def _idx(result, default):
            return result if result is not None else default

        i_name   = _idx(col(["jugador", "player", "nombre"]), 1)
        i_equipo = _idx(col(["equipo", "team", "club"]), 2)
        i_goles  = _idx(col(["goles", "goals", "gol"]), 3)
        i_part   = col(["partidos", "played", "pj", "nº"])

        print(f"  Col indices — name:{i_name} equipo:{i_equipo} goles:{i_goles} partidos:{i_part}")

        for row in data_rows:
            if row.find("th"):
                continue
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 3:
                continue
            jugador = cols[i_name] if i_name < len(cols) else ""
            if not jugador:
                continue
            equipo = cols[i_equipo] if i_equipo < len(cols) else ""
            is_paraguas = PARAGUAS_NAME in equipo.lower() or equipo_paraguas
            result.append({
                "pos": len(result) + 1,
                "jugador": jugador,
                "equipo": equipo,
                "goles": n(cols[i_goles]) if i_goles is not None and i_goles < len(cols) else 0,
                "partidos": n(cols[i_part]) if i_part is not None and i_part < len(cols) else None,
                "paraguas": is_paraguas,
            })
        print(f"  Players found in this table: {len(result)}")
        if result:
            break  # use first valid table with data
    return result

def scrape_jugadores():
    print(f"Fetching: {URL_STATS}")
    r = requests.get(URL_STATS, headers=HEADERS, timeout=20)
    print(f"  Status: {r.status_code}, Content-length: {len(r.text)}")
    r.raise_for_status()
    players = _parse_player_table(r.text)
    print(f"Total players from main URL: {len(players)}")

    # Merge Paraguas players
    try:
        print(f"Fetching Paraguas: {URL_PARAGUAS}")
        r2 = requests.get(URL_PARAGUAS, headers=HEADERS, timeout=20)
        print(f"  Paraguas status: {r2.status_code}")
        if r2.status_code == 200:
            paraguas_players = _parse_player_table(r2.text, equipo_paraguas=True)
            print(f"  Paraguas players found: {len(paraguas_players)}")
            existing = {p["jugador"].lower() for p in players}
            added = 0
            for p in paraguas_players:
                if p["jugador"].lower() not in existing:
                    p["pos"] = len(players) + 1
                    players.append(p)
                    added += 1
                else:
                    for mp in players:
                        if mp["jugador"].lower() == p["jugador"].lower():
                            mp["paraguas"] = True
            print(f"  Added {added} new Paraguas players not in main list")
    except Exception as e:
        print(f"  Paraguas merge failed: {e}")

    return players

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

    save("goleadores", jugadores)
    save("jugador", jugadores)  # same data, searched client-side
    paraguas = [p for p in jugadores if p.get("paraguas")]
    save("paraguas", paraguas)

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
