// Futbol/server.js
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { getGrupos, getClasificacion, getResultados, getGoleadores } = require('./scraper.js');

const PORT = 8080;
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

async function handleApi(req, res, pathname) {
  const q = parseQuery(req.url);
  try {
    if (pathname === '/api/grupos') {
      sendJson(res, await getGrupos());
    } else if (pathname === '/api/clasificacion') {
      if (!q.grupo || !q.competicion) return sendError(res, 'Faltan parámetros: grupo, competicion', 400);
      sendJson(res, await getClasificacion(q.grupo, q.competicion, q.jornada));
    } else if (pathname === '/api/resultados') {
      if (!q.grupo || !q.competicion) return sendError(res, 'Faltan parámetros: grupo, competicion', 400);
      sendJson(res, await getResultados(q.grupo, q.competicion, q.jornada));
    } else if (pathname === '/api/goleadores') {
      if (!q.grupo || !q.competicion) return sendError(res, 'Faltan parámetros: grupo, competicion', 400);
      sendJson(res, await getGoleadores(q.grupo, q.competicion));
    } else {
      sendError(res, 'Endpoint no encontrado', 404);
    }
  } catch (e) {
    console.error('[server] API error:', e.message);
    sendError(res, `Error al obtener datos de la RFFM: ${e.message}`, 503);
  }
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  // security: don't serve outside ROOT
  if (!filePath.startsWith(ROOT)) return sendError(res, 'Forbidden', 403);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const pathname = u.pathname;
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname);
  } else {
    serveStatic(req, res, pathname);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Benjamines Madrid — http://localhost:${PORT}`);
});
