from http.server import BaseHTTPRequestHandler
import json, requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
}
URL = "https://artificialfsala.leaguerepublic.com/playerStats/890842856/1_950925790.html"

def scrape():
    r = requests.get(URL, headers=HEADERS, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")
    table = soup.find("table")
    if not table:
        raise ValueError("No scorers table found")
    result = []
    for i, row in enumerate(table.find_all("tr")[1:], start=1):
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 3:
            continue
        def n(v):
            try: return int(v)
            except: return 0
        result.append({
            "pos": i,
            "jugador": cols[1] if len(cols) > 1 else cols[0],
            "equipo": cols[2] if len(cols) > 2 else "",
            "goles": n(cols[3]) if len(cols) > 3 else 0,
            "partidos": n(cols[6]) if len(cols) > 6 else None,
        })
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
