from http.server import BaseHTTPRequestHandler
import json, requests
from bs4 import BeautifulSoup
import re

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
    return list(dict.fromkeys(links))  # deduplicate preserving order

def parse_score(text):
    m = re.search(r"(\d+)\s*-\s*(\d+)", text)
    return (int(m.group(1)), int(m.group(2))) if m else None

def scrape_matches_from_page(html, jornada):
    soup = BeautifulSoup(html, "lxml")
    matches = []
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            tds = row.find_all("td")
            if len(tds) < 3:
                continue
            texts = [td.get_text(strip=True) for td in tds]
            # Look for score pattern in any cell
            score_cell = None
            for td in tds:
                if re.search(r"\d+\s*-\s*\d+", td.get_text()):
                    score_cell = td
                    break
            if score_cell is None:
                continue
            score_text = score_cell.get_text(strip=True)
            score = parse_score(score_text)
            if score is None:
                continue
            idx = tds.index(score_cell)
            local = tds[idx-1].get_text(strip=True) if idx > 0 else ""
            visitante = tds[idx+1].get_text(strip=True) if idx+1 < len(tds) else ""
            # Try to find date from a heading row above
            fecha = ""
            matches.append({
                "jornada": jornada,
                "fecha": fecha,
                "local": local,
                "golesLocal": score[0],
                "golesVisitante": score[1],
                "visitante": visitante,
            })
    return matches

def scrape():
    date_urls = get_match_dates()
    all_matches = []
    for jornada, url in enumerate(date_urls, start=1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                continue
            matches = scrape_matches_from_page(r.text, jornada)
            # Extract date from URL: year{Y}_month{M}_day{D}
            m = re.search(r"year(\d+)_month(\d+)_day(\d+)", url)
            if m:
                fecha = f"{m.group(3).zfill(2)}/{m.group(2).zfill(2)}/{m.group(1)}"
                for match in matches:
                    match["fecha"] = fecha
            all_matches.extend(matches)
        except Exception:
            continue
    return all_matches

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
