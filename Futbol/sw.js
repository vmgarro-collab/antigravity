// Futbol/sw.js — Service Worker
'use strict';

const CACHE = 'libertad-v6';
// Solo cacheamos assets que nunca cambian (iconos)
const PRECACHE = [
  '/antigravity/Futbol/icons/icon-512.jpg',
  '/antigravity/Futbol/icons/icon-192.jpg',
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
  const isIcon = url.pathname.includes('/icons/');

  if (isIcon) {
    // Cache-first solo para iconos
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
  // Todo lo demás (HTML, JS, CSS, datos) va directo a red sin interceptar
});
