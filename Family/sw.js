// Family/sw.js
const CACHE = 'familia-v1';
const ASSETS = [
  '/Family/',
  '/Family/index.html',
  '/Family/styles.css',
  '/Family/firebase.js',
  '/Family/app.js',
  '/Family/manifest.json',
  '/Family/icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Solo cachear assets propios, dejar pasar Firebase y CDNs
  if (!e.request.url.includes('/Family/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
