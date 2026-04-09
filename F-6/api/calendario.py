from http.server import BaseHTTPRequestHandler
import json, requests
from bs4 import BeautifulSoup
import re
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
}
BASE = "https://artificialfsala.leaguerepublic.com"
HUB_URL = f"{BASE}/matchHub/890842856/-1_-1/-1/-1/-1/-1/-1/false.html"

def get_match_dates():
    r = requests.get(HUB_URL, headers=HEADERS, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")
    links = []
    for a in soup.find_all("a", href=True):
        if "matchHub" in a["href"] and "year" in a["href"]:
            href = a["href"]
            if not href.startswith("http"):
                href = BASE + href
            links.append(href)
    return list(dict.fromkeys(links))

def scrape_fixtures_from_page(html, jornada, fecha):
    soup = BeautifulSoup(html, "lxml")
    fixtures = []
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            tds = row.find_all("td")
            if len(tds) < 3:
                continue
            # Future matches show "VS" not a score
            row_text = row.get_text()
            if not re.search(r"\bVS\b", row_text, re.IGNORECASE):
                continue
            # Find VS cell
            vs_cell = None
            for td in tds:
                if re.search(r"\bVS\b", td.get_text(), re.IGNORECASE):
                    vs_cell = td
                    break
            if vs_cell is None:
                continue
            idx = tds.index(vs_cell)
            local = tds[idx-1].get_text(strip=True) if idx > 0 else ""
            visitante = tds[idx+1].get_text(strip=True) if idx+1 < len(tds) else ""
            hora = ""
            # Look for time pattern
            m = re.search(r"(\d{1,2}:\d{2})", row_text)
            if m:
                hora = m.group(1)
            fixtures.append({
                "jornada": jornada,
                "fecha": fecha,
                "hora": hora,
                "local": local,
                "visitante": visitante,
            })
    return fixtures

def scrape():
    date_urls = get_match_dates()
    today = datetime.now()
    fixtures = []
    for jornada, url in enumerate(date_urls, start=1):
        m = re.search(r"year(\d+)_month(\d+)_day(\d+)", url)
        if not m:
            continue
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        match_date = datetime(y, mo, d)
        if match_date < today.replace(hour=0, minute=0, second=0, microsecond=0):
            continue  # skip past matches
        fecha = f"{str(d).zfill(2)}/{str(mo).zfill(2)}/{y}"
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                continue
            page_fixtures = scrape_fixtures_from_page(r.text, jornada, fecha)
            fixtures.extend(page_fixtures)
        except Exception:
            continue
    return fixtures

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
