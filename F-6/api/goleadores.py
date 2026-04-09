from http.server import BaseHTTPRequestHandler
import json, requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
}
BASE = "https://artificialfsala.leaguerepublic.com"

def n(v):
    try: return int(v)
    except: return 0

URL_STATS = "https://artificialfsala.leaguerepublic.com/playerStats/890842856.html"

def scrape():
    r = requests.get(URL_STATS, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")
    result = []
    for table in soup.find_all("table"):
        headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
        if not headers:
            continue
        def col(keywords):
            for kw in keywords:
                for i, h in enumerate(headers):
                    if kw in h:
                        return i
            return None
        i_name   = col(["jugador", "player", "nombre"]) or 1
        i_equipo = col(["equipo", "team", "club"]) or 2
        i_goles  = col(["goles", "goals", "gol"]) or 3
        i_part   = col(["partidos", "played", "pj", "nº"])
        for row in table.find_all("tr"):
            if row.find("th"):
                continue
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 3:
                continue
            jugador = cols[i_name] if i_name < len(cols) else ""
            if not jugador:
                continue
            equipo = cols[i_equipo] if i_equipo < len(cols) else ""
            result.append({
                "pos": len(result) + 1,
                "jugador": jugador,
                "equipo": equipo,
                "goles": n(cols[i_goles]) if i_goles and i_goles < len(cols) else 0,
                "partidos": n(cols[i_part]) if i_part and i_part < len(cols) else None,
                "paraguas": "paraguas" in equipo.lower(),
            })
        if result:
            break
    return result

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            data = scrape()
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
        except Exception as e:
            body = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8")
            self.send_response(502)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, max-age=300")
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *args): pass
