// Family/sw.js
const CACHE = 'familia-v1';
const ASSETS = [
  '/antigravity/Family/',
  '/antigravity/Family/index.html',
  '/antigravity/Family/styles.css',
  '/antigravity/Family/firebase.js',
  '/antigravity/Family/app.js',
  '/antigravity/Family/manifest.json',
  '/antigravity/Family/icon.png'
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
  if (!e.request.url.includes('/antigravity/Family/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
