# Futbol/server.py
import json
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from scraper import get_grupos, get_clasificacion, get_resultados

PORT = 8080

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/grupos':
            self._json(get_grupos())
        elif self.path.startswith('/api/clasificacion'):
            params = self._params()
            self._json(get_clasificacion(params.get('grupo'), params.get('competicion')))
        elif self.path.startswith('/api/resultados'):
            params = self._params()
            self._json(get_resultados(params.get('grupo'), params.get('competicion')))
        else:
            super().do_GET()

    def _params(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        return {k: v[0] for k, v in qs.items()}

    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

if __name__ == '__main__':
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Servidor en http://localhost:{PORT}")
    HTTPServer(('', PORT), ProxyHandler).serve_forever()
