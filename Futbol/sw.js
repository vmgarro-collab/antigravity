// Futbol/sw.js — Service Worker
'use strict';

const CACHE = 'libertad-v5';
const PRECACHE = [
  '/antigravity/Futbol/',
  '/antigravity/Futbol/index.html',
  '/antigravity/Futbol/app.js',
  '/antigravity/Futbol/styles.css',
  '/antigravity/Futbol/icons/icon-512.jpg',
  '/antigravity/Futbol/icons/icon-192.jpg',
  '/antigravity/Futbol/data/clasificacion.json',
  '/antigravity/Futbol/data/resultados.json',
  '/antigravity/Futbol/data/goleadores.json',
  '/antigravity/Futbol/data/todos_partidos.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isData = url.pathname.includes('/data/');
  const isShell = url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

  // Network first para datos y archivos de la app (HTML/JS/CSS), cache como fallback
  if (isData || isShell) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
