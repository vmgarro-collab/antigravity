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
    tables = soup.find_all("table")
    print(f"  Found {len(tables)} table(s) on standings page")
    result = []
    pos = 1
    for t_idx, table in enumerate(tables):
        all_rows = table.find_all("tr")
        print(f"  Table {t_idx}: {len(all_rows)} rows")
        for row in all_rows:
            # Skip header rows (contain <th>)
            if row.find("th"):
                continue
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            print(f"    Row cols({len(cols)}): {cols[:10]}")
            if len(cols) < 8:
                continue
            # Find team name: prefer linked td or td with text (skip numeric-only first col)
            team_td = row.find("td", class_=lambda c: c and "highlight" in c)
            if not team_td:
                # Find first td with a link (team name)
                for td in row.find_all("td"):
                    if td.find("a"):
                        team_td = td
                        break
            equipo = team_td.get_text(strip=True) if team_td else cols[1]
            team_link = row.find("a", href=True)
            team_id = None
            if team_link:
                ids = re.findall(r'(\d{6,})', team_link["href"])
                if len(ids) >= 2:
                    team_id = ids[-1]
                elif len(ids) == 1 and ids[0] != "890842856":
                    team_id = ids[0]
            # Detect which cols hold the stats (skip pos/name cols, take last 7 numeric cols)
            nums = []
            for c in cols:
                try:
                    nums.append(int(c))
                except ValueError:
                    nums.append(None)
            # Find a run of 7 consecutive numeric values (pj g e p gf gc pts)
            stats = None
            for start in range(len(nums) - 6):
                run = nums[start:start+7]
                if all(v is not None for v in run):
                    stats = run
                    break
            if stats is None:
                continue
            entry = {
                "pos": pos, "equipo": equipo,
                "pj": stats[0], "g": stats[1], "e": stats[2], "p": stats[3],
                "gf": stats[4], "gc": stats[5], "pts": stats[6],
            }
            if team_id:
                entry["team_id"] = team_id
            result.append(entry)
            pos += 1
    print(f"  Clasificacion total: {len(result)} equipos")
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
        # Team pages (equipo_paraguas) have no team column — skip to avoid defaulting onto goles
        if equipo_paraguas:
            i_equipo = None
            i_goles  = _idx(col(["goles", "goals", "gol"]), 2)
        else:
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
            equipo = (cols[i_equipo] if i_equipo < len(cols) else "") if i_equipo is not None else ""
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

URL_GOLEADORES = f"{BASE}/playerStats/890842856/1_950925790.html"

def scrape_jugadores():
    players = []
    seen = set()

    # Goleadores generales
    print(f"  Fetching goleadores: {URL_GOLEADORES}")
    try:
        r = _get_session().get(URL_GOLEADORES, headers={"Referer": BASE + "/"}, timeout=20)
        print(f"    Status: {r.status_code}, size: {len(r.text)}")
        if r.status_code == 200:
            general = _parse_player_table(r.text)
            print(f"    Players found: {len(general)}")
            for p in general:
                if p["jugador"].lower() not in seen:
                    seen.add(p["jugador"].lower())
                    p["paraguas"] = PARAGUAS_NAME in p.get("equipo", "").lower()
                    players.append(p)
    except Exception as e:
        print(f"    Error: {e}")

    # Paraguas team (garantiza que aparecen aunque no estén en goleadores)
    print(f"  Fetching Paraguas: {URL_PARAGUAS}")
    try:
        r2 = _get_session().get(URL_PARAGUAS, headers={"Referer": BASE + "/"}, timeout=20)
        print(f"    Status: {r2.status_code}")
        if r2.status_code == 200:
            paraguas = _parse_player_table(r2.text, equipo_paraguas=True)
            added = 0
            for p in paraguas:
                if p["jugador"].lower() not in seen:
                    seen.add(p["jugador"].lower())
                    p["pos"] = len(players) + 1
                    p["equipo"] = "EL PARAGUAS"
                    p["paraguas"] = True
                    players.append(p)
                    added += 1
                else:
                    # Ensure equipo name is correct for already-added Paraguas players
                    for mp in players:
                        if mp["jugador"].lower() == p["jugador"].lower():
                            mp["equipo"] = "EL PARAGUAS"
                            mp["paraguas"] = True
            print(f"    Paraguas players added: {added}")
    except Exception as e:
        print(f"    Error: {e}")

    # Fix positions
    for i, p in enumerate(players, start=1):
        p["pos"] = i

    print(f"Total players: {len(players)}")
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
        current_hora = ""
        for row in table.find_all("tr"):
            tds = row.find_all("td")
            row_text = row.get_text()
            # Track time from any row (time headers have few TDs)
            tm = re.search(r"\b(\d{1,2}:\d{2})\b", row_text)
            if tm:
                current_hora = tm.group(1)
            if len(tds) < 3:
                continue
            hora = current_hora
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
