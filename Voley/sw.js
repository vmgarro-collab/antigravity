// Voley/sw.js — Service Worker
'use strict';

const CACHE = 'voley-mayo-v1';
const PRECACHE = [
  '/antigravity/Voley/',
  '/antigravity/Voley/index.html',
  '/antigravity/Voley/app.js',
  '/antigravity/Voley/styles.css',
  '/antigravity/Voley/icons/icon-512.jpg',
  '/antigravity/Voley/icons/icon-192.jpg',
  '/antigravity/Voley/data/clasificacion.json',
  '/antigravity/Voley/data/resultados.json',
  '/antigravity/Voley/data/todos_partidos.json',
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
  if (url.pathname.includes('/data/')) {
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
