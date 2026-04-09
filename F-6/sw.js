// F-6/sw.js — Service Worker
'use strict';

const CACHE = 'veteranos-v1';
const PRECACHE = [
  '/antigravity/F-6/',
  '/antigravity/F-6/index.html',
  '/antigravity/F-6/app.js',
  '/antigravity/F-6/styles.css',
  '/antigravity/F-6/data/clasificacion.json',
  '/antigravity/F-6/data/resultados.json',
  '/antigravity/F-6/data/goleadores.json',
  '/antigravity/F-6/data/calendario.json',
  '/antigravity/F-6/data/paraguas.json',
  '/antigravity/F-6/data/meta.json',
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
  // Network first para los JSON de datos, cache first para el resto
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
