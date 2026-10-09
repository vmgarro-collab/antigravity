// FutbolFemenino/server.js — dev server local
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { getClasificacion, getResultados, getGoleadores } = require('./scraper.js');

const PORT = 8081;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function parseQuery(urlStr) {
  const u = new URL(urlStr, 'http://localhost');
  const out = {};
  u.searchParams.forEach((v, k) => { out[k] = v; });
  return out;
}

function sendJson(res, data, status = 200) {
  const body = Buffer.from(JSON.stringify(data, null, 0), 'utf-8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': body.length,
  });
  res.end(body);
}

function sendError(res, msg, status = 500) {
  sendJson(res, { error: msg }, status);
}

const COMPETICION_ID = '26737919';
const GRUPO_ID       = '26737922';

async function handleApi(req, res, pathname) {
  const q = parseQuery(req.url);
  const grupoId       = q.grupo       || GRUPO_ID;
  const competicionId = q.competicion || COMPETICION_ID;
  try {
    if (pathname === '/api/clasificacion') {
      sendJson(res, await getClasificacion(grupoId, competicionId, q.jornada));
    } else if (pathname === '/api/resultados') {
      sendJson(res, await getResultados(grupoId, competicionId, q.jornada));
    } else if (pathname === '/api/goleadores') {
      sendJson(res, await getGoleadores(grupoId, competicionId));
    } else {
      sendError(res, 'Endpoint no encontrado', 404);
    }
  } catch (e) {
    console.error('[server] API error:', e.message);
    sendError(res, e.message);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    return handleApi(req, res, pathname);
  }

  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'EISDIR') {
        fs.readFile(path.join(filePath, 'index.html'), (e2, d2) => {
          if (e2) { res.writeHead(404); res.end('Not found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(d2);
        });
      } else {
        res.writeHead(404); res.end('Not found');
      }
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`FutbolFemenino dev server → http://localhost:${PORT}`);
});
