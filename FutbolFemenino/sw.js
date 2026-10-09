// FutbolFemenino/sw.js — Service Worker
'use strict';

const CACHE = 'mcf-femenino-v2';
const PRECACHE = [
  '/antigravity/FutbolFemenino/',
  '/antigravity/FutbolFemenino/index.html',
  '/antigravity/FutbolFemenino/app.js',
  '/antigravity/FutbolFemenino/styles.css',
  '/antigravity/FutbolFemenino/icons/icon-512.jpg',
  '/antigravity/FutbolFemenino/icons/icon-192.jpg',
  '/antigravity/FutbolFemenino/data/clasificacion.json',
  '/antigravity/FutbolFemenino/data/resultados.json',
  '/antigravity/FutbolFemenino/data/goleadores.json',
  '/antigravity/FutbolFemenino/data/todos_partidos.json',
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
  const isData  = url.pathname.includes('/data/');
  const isShell = url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

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
