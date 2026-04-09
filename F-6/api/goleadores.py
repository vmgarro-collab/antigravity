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

def scrape():
    result = []
    page = 1
    seen_names = set()
    while True:
        url = f"{BASE}/playerStats/890842856/{page}_950925790.html"
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            if r.status_code != 200:
                break
        except Exception:
            break
        soup = BeautifulSoup(r.text, "lxml")
        table = soup.find("table")
        if not table:
            break
        rows = table.find_all("tr")
        added_this_page = 0
        for row in rows:
            if row.find("th"):
                continue
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 3:
                continue
            jugador = cols[1] if len(cols) > 1 else cols[0]
            if not jugador or jugador in seen_names:
                continue
            seen_names.add(jugador)
            result.append({
                "pos": len(result) + 1,
                "jugador": jugador,
                "equipo": cols[2] if len(cols) > 2 else "",
                "goles": n(cols[3]) if len(cols) > 3 else 0,
                "partidos": n(cols[6]) if len(cols) > 6 else None,
            })
            added_this_page += 1
        if added_this_page == 0:
            break
        page += 1
        if page > 20:
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
